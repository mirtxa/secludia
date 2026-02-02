/**
 * RNNoise AudioWorklet Processor
 *
 * This file is bundled separately and loaded via audioWorklet.addModule()
 * Uses the sync WASM module with inlined binary for worklet compatibility.
 *
 * Based on:
 * - MDN AudioWorklet documentation: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet
 * - Web Audio API spec: https://webaudio.github.io/web-audio-api/#AudioWorklet
 * - Jitsi's NoiseSuppressorWorklet implementation
 *
 * Key constraints:
 * - process() receives 128 samples per call (render quantum)
 * - RNNoise requires 480 samples per frame (10ms at 48kHz)
 * - Uses circular buffer with LCM(128, 480) = 1920 samples
 * - Latency: ~10ms (one RNNoise frame)
 * - Mono processing only (first channel)
 */

// AudioWorkletGlobalScope declarations
// See: https://webaudio.github.io/web-audio-api/#AudioWorkletGlobalScope
declare const sampleRate: number;
declare const _currentTime: number;
declare const _currentFrame: number;

declare function registerProcessor(name: string, processorCtor: typeof AudioWorkletProcessor): void;

declare class AudioWorkletProcessor {
  readonly port: MessagePort;
  constructor();
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean;
}

import { createRNNWasmModuleSync } from "@jitsi/rnnoise-wasm";

// Constants
const RNNOISE_FRAME_SIZE = 480; // 10ms at 48kHz
const RNNOISE_SAMPLE_RATE = 48000;
const SHIFT_16_BIT = 32768; // Scale factor for int16 <-> float conversion

// LCM for buffer sizing - ensures clean frame boundaries
function lcm(a: number, b: number): number {
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
  return (a * b) / gcd(a, b);
}

// WASM interface for RNNoise
interface IRnnoiseModule {
  _rnnoise_create: () => number;
  _rnnoise_destroy: (context: number) => void;
  _rnnoise_process_frame: (context: number, output: number, input: number) => number;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPF32: Float32Array;
  ready: Promise<unknown>;
}

/**
 * RNNoise AudioWorklet Processor
 *
 * Buffers 128-sample render quanta into 480-sample frames for RNNoise processing.
 * Uses a circular buffer sized to LCM(128, 480) = 1920 samples.
 */
class RnnoiseWorkletProcessor extends AudioWorkletProcessor {
  // State
  private enabled = true;
  private wasmModule: IRnnoiseModule | null = null;
  private rnnoiseContext = 0;
  private wasmPcmInput = 0;
  private wasmPcmInputF32Index = 0;
  private destroyed = false;
  private ready = false;

  // Circular buffer for sample accumulation
  // Size = LCM(128, 480) = 1920 ensures clean frame boundaries
  private readonly bufferLength: number;
  private readonly circularBuffer: Float32Array;
  private readonly frameBuffer: Float32Array;
  private inputWriteIndex = 0;
  private processedIndex = 0;
  private outputReadIndex = 0;

  constructor() {
    super();

    // Verify sample rate matches RNNoise requirement
    if (sampleRate !== RNNOISE_SAMPLE_RATE) {
      console.warn(
        `[RnnoiseProcessor] Sample rate is ${sampleRate}Hz, RNNoise expects ${RNNOISE_SAMPLE_RATE}Hz`
      );
    }

    // Calculate buffer size - LCM ensures we never have partial frames
    // LCM(128, 480) = 1920 = 15 render quanta = 4 RNNoise frames
    this.bufferLength = lcm(128, RNNOISE_FRAME_SIZE);
    this.circularBuffer = new Float32Array(this.bufferLength);
    this.frameBuffer = new Float32Array(RNNOISE_FRAME_SIZE);

    // Set up message handler for control from main thread
    this.port.onmessage = this.handleMessage.bind(this);

    // Initialize WASM module
    // Note: This is async but we handle the case where process() is called
    // before initialization completes by passing through audio unchanged
    this.initWasm();
  }

  /**
   * Initialize the RNNoise WASM module
   * The sync version has the WASM binary inlined, so it compiles synchronously
   * but still has an async ready promise for initialization
   */
  private async initWasm(): Promise<void> {
    try {
      this.wasmModule = createRNNWasmModuleSync() as unknown as IRnnoiseModule;
      await this.wasmModule.ready;

      // Create RNNoise context (holds GRU state)
      this.rnnoiseContext = this.wasmModule._rnnoise_create();

      // Allocate WASM memory for PCM buffer
      this.wasmPcmInput = this.wasmModule._malloc(
        RNNOISE_FRAME_SIZE * Float32Array.BYTES_PER_ELEMENT
      );

      if (!this.wasmPcmInput) {
        throw new Error("Failed to allocate WASM memory");
      }

      // Pre-calculate heap index for faster access
      this.wasmPcmInputF32Index = this.wasmPcmInput / Float32Array.BYTES_PER_ELEMENT;

      this.ready = true;
      this.port.postMessage({ type: "ready" });
    } catch (error) {
      console.error("[RnnoiseProcessor] WASM init failed:", error);
      this.port.postMessage({
        type: "error",
        error: error instanceof Error ? error.message : "WASM init failed",
      });
    }
  }

  /**
   * Handle messages from the main thread
   */
  private handleMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case "set-enabled":
        this.enabled = data.enabled;
        break;
      case "destroy":
        this.destroy();
        break;
    }
  }

  /**
   * Clean up WASM resources
   */
  private destroy(): void {
    if (this.destroyed || !this.wasmModule) return;
    this.destroyed = true;

    if (this.wasmPcmInput) {
      this.wasmModule._free(this.wasmPcmInput);
    }
    if (this.rnnoiseContext) {
      this.wasmModule._rnnoise_destroy(this.rnnoiseContext);
    }
  }

  /**
   * Process a 480-sample frame with RNNoise
   * Reads from and writes to this.frameBuffer in-place
   * @returns VAD score (0-1)
   */
  private processRnnoiseFrame(): number {
    if (!this.wasmModule) return 0;

    // Copy frame to WASM heap, scaling float [-1,1] to int16 range
    for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
      this.wasmModule.HEAPF32[this.wasmPcmInputF32Index + i] = this.frameBuffer[i] * SHIFT_16_BIT;
    }

    // Process in-place (same buffer for input and output)
    const vadScore = this.wasmModule._rnnoise_process_frame(
      this.rnnoiseContext,
      this.wasmPcmInput,
      this.wasmPcmInput
    );

    // Copy back, scaling int16 to float [-1,1]
    for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
      this.frameBuffer[i] = this.wasmModule.HEAPF32[this.wasmPcmInputF32Index + i] / SHIFT_16_BIT;
    }

    return vadScore;
  }

  /**
   * Main audio processing method
   * Called by the Web Audio API for each render quantum (typically 128 samples)
   *
   * @param inputs - Array of inputs, each containing array of channels (Float32Array)
   * @param outputs - Array of outputs, same structure as inputs
   * @param _parameters - AudioParam values (not used)
   * @returns true to keep processor alive, false to allow shutdown
   */
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    // Get first channel of first input/output
    // RNNoise is mono, so we only process channel 0
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];

    // No input or output connected - keep processor alive
    if (!input || !output) {
      return true;
    }

    // Pass through unchanged if not ready or disabled
    if (!this.ready || !this.enabled) {
      output.set(input);
      return true;
    }

    const inputLength = input.length; // Usually 128, but check per MDN recommendation

    // Accumulate input samples into circular buffer
    for (let i = 0; i < inputLength; i++) {
      this.circularBuffer[this.inputWriteIndex] = input[i];
      this.inputWriteIndex = (this.inputWriteIndex + 1) % this.bufferLength;
    }

    // Calculate available samples for processing
    let samplesAvailable =
      (this.inputWriteIndex - this.processedIndex + this.bufferLength) % this.bufferLength;

    // Process complete 480-sample frames
    while (samplesAvailable >= RNNOISE_FRAME_SIZE) {
      // Extract frame from circular buffer
      for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
        this.frameBuffer[i] = this.circularBuffer[(this.processedIndex + i) % this.bufferLength];
      }

      // Process with RNNoise
      this.processRnnoiseFrame();

      // Write processed frame back to circular buffer
      for (let i = 0; i < RNNOISE_FRAME_SIZE; i++) {
        this.circularBuffer[(this.processedIndex + i) % this.bufferLength] = this.frameBuffer[i];
      }

      this.processedIndex = (this.processedIndex + RNNOISE_FRAME_SIZE) % this.bufferLength;
      samplesAvailable -= RNNOISE_FRAME_SIZE;
    }

    // Output processed samples
    const outputAvailable =
      (this.processedIndex - this.outputReadIndex + this.bufferLength) % this.bufferLength;

    if (outputAvailable >= inputLength) {
      // We have enough processed samples
      for (let i = 0; i < inputLength; i++) {
        output[i] = this.circularBuffer[(this.outputReadIndex + i) % this.bufferLength];
      }
      this.outputReadIndex = (this.outputReadIndex + inputLength) % this.bufferLength;
    } else {
      // Initial latency period - output silence
      // This happens for the first ~10ms while buffer fills
      output.fill(0);
    }

    // Return true to keep processor alive
    // See: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process#return_value
    return true;
  }
}

// Register the processor with the AudioWorkletGlobalScope
registerProcessor("rnnoise-processor", RnnoiseWorkletProcessor);
