/**
 * RNNoise-based noise suppression
 *
 * Uses @jitsi/rnnoise-wasm for noise suppression.
 * Based on the hybrid DSP/deep learning approach by Jean-Marc Valin (Xiph.Org/Mozilla).
 *
 * RNNoise uses a GRU-based neural network to compute ideal critical band gains,
 * combined with pitch filtering to attenuate noise between harmonics.
 *
 * @see https://jmvalin.ca/demo/rnnoise/
 * @see https://arxiv.org/abs/1709.08243
 * @license BSD-3-Clause (RNNoise) + Apache-2.0 (@jitsi/rnnoise-wasm)
 */

// Import WASM file URL - Vite handles this in both dev and prod
import rnnoiseWasmUrl from "@jitsi/rnnoise-wasm/dist/rnnoise.wasm?url";

// RNNoise constants
const RNNOISE_SAMPLE_LENGTH = 480;
const RNNOISE_SAMPLE_RATE = 48000;
const SHIFT_16_BIT = 32768;

export { RNNOISE_SAMPLE_LENGTH };

// WASM module interface
interface IRnnoiseModule {
  _rnnoise_create: () => number;
  _rnnoise_destroy: (context: number) => void;
  _rnnoise_process_frame: (context: number, output: number, input: number) => number;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAPF32: Float32Array;
}

/**
 * RNNoise Processor - handles WASM memory management and audio processing
 * Based on Jitsi's RnnoiseProcessor implementation
 */
class RnnoiseProcessor {
  private _context: number;
  private _destroyed = false;
  private _wasmInterface: IRnnoiseModule;
  private _wasmPcmInput: number;
  private _wasmPcmInputF32Index: number;

  constructor(wasmInterface: IRnnoiseModule) {
    this._wasmInterface = wasmInterface;

    try {
      this._context = wasmInterface._rnnoise_create();
      this._wasmPcmInput = wasmInterface._malloc(
        RNNOISE_SAMPLE_LENGTH * Float32Array.BYTES_PER_ELEMENT
      );

      if (!this._wasmPcmInput) {
        throw new Error("Failed to allocate WASM memory");
      }

      this._wasmPcmInputF32Index = this._wasmPcmInput / Float32Array.BYTES_PER_ELEMENT;
    } catch (error) {
      this.destroy();
      throw error;
    }
  }

  private _releaseWasmResources(): void {
    if (this._wasmPcmInput) {
      this._wasmInterface._free(this._wasmPcmInput);
    }
    if (this._context) {
      this._wasmInterface._rnnoise_destroy(this._context);
    }
  }

  destroy(): void {
    if (this._destroyed) {
      return;
    }
    this._destroyed = true;
    this._releaseWasmResources();
  }

  /**
   * Process an audio frame with RNNoise
   * @param pcmFrame - Float32Array of exactly 480 samples
   * @param shouldDenoise - If true, writes denoised audio back to pcmFrame
   * @returns VAD score (0-1)
   */
  processAudioFrame(pcmFrame: Float32Array, shouldDenoise = false): number {
    // Scale float samples to int16 range and copy to WASM heap
    for (let i = 0; i < RNNOISE_SAMPLE_LENGTH; i++) {
      this._wasmInterface.HEAPF32[this._wasmPcmInputF32Index + i] = pcmFrame[i] * SHIFT_16_BIT;
    }

    // Process frame in-place (output = input buffer)
    // API: _rnnoise_process_frame(context, output, input)
    const vadScore = this._wasmInterface._rnnoise_process_frame(
      this._context,
      this._wasmPcmInput,
      this._wasmPcmInput
    );

    // Copy denoised samples back, scaling to float range
    if (shouldDenoise) {
      for (let i = 0; i < RNNOISE_SAMPLE_LENGTH; i++) {
        pcmFrame[i] = this._wasmInterface.HEAPF32[this._wasmPcmInputF32Index + i] / SHIFT_16_BIT;
      }
    }

    return vadScore;
  }
}

let processorPromise: Promise<RnnoiseProcessor> | null = null;

/**
 * Lazily loads the RNNoise processor (cached after first load)
 */
async function getProcessor(): Promise<RnnoiseProcessor> {
  if (processorPromise) {
    return processorPromise;
  }

  processorPromise = (async () => {
    const { createRNNWasmModule } = await import("@jitsi/rnnoise-wasm");

    const module = await createRNNWasmModule({
      locateFile: (filename: string) => {
        if (filename.endsWith(".wasm")) {
          return rnnoiseWasmUrl;
        }
        return filename;
      },
    });

    await module.ready;
    return new RnnoiseProcessor(module as unknown as IRnnoiseModule);
  })();

  return processorPromise;
}

/**
 * Process raw audio samples with RNNoise
 *
 * @param samples - Raw audio samples in [-1, 1] range at 48kHz
 * @returns Denoised audio samples
 */
export async function processAudioSamples(
  samples: Float32Array<ArrayBufferLike>
): Promise<Float32Array> {
  if (samples.length === 0) {
    return new Float32Array(0);
  }

  const processor = await getProcessor();
  const output = new Float32Array(samples.length);

  // Process in 480-sample frames
  for (let i = 0; i < samples.length; i += RNNOISE_SAMPLE_LENGTH) {
    const frameSize = Math.min(RNNOISE_SAMPLE_LENGTH, samples.length - i);

    // Create frame buffer (pad with zeros if needed)
    const frame = new Float32Array(RNNOISE_SAMPLE_LENGTH);
    for (let j = 0; j < frameSize; j++) {
      frame[j] = samples[i + j];
    }

    // Process frame in-place
    processor.processAudioFrame(frame, true);

    // Copy processed samples to output
    for (let j = 0; j < frameSize; j++) {
      output[i + j] = frame[j];
    }
  }

  return output;
}

/**
 * Process raw Float32Array samples with RNNoise and return a playable WAV blob
 *
 * @param samples - Raw audio samples in [-1, 1] range
 * @param sampleRate - Sample rate of the input audio
 * @returns WAV blob with denoised audio
 */
export async function processRawSamplesWithRNNoise(
  samples: Float32Array<ArrayBufferLike>,
  sampleRate: number
): Promise<Blob> {
  if (samples.length === 0) {
    const buffer = new AudioBuffer({
      numberOfChannels: 1,
      length: 1,
      sampleRate: sampleRate,
    });
    return audioBufferToWav(buffer);
  }

  // Resample to 48kHz if needed
  let processingSamples: Float32Array<ArrayBufferLike>;
  let outputSampleRate: number;

  if (sampleRate !== RNNOISE_SAMPLE_RATE) {
    const inputBuffer = new AudioBuffer({
      numberOfChannels: 1,
      length: samples.length,
      sampleRate: sampleRate,
    });
    inputBuffer.copyToChannel(samples, 0);

    const duration = samples.length / sampleRate;
    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil(duration * RNNOISE_SAMPLE_RATE),
      RNNOISE_SAMPLE_RATE
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = inputBuffer;
    source.connect(offlineCtx.destination);
    source.start();
    const resampledBuffer = await offlineCtx.startRendering();
    processingSamples = resampledBuffer.getChannelData(0);
    outputSampleRate = RNNOISE_SAMPLE_RATE;
  } else {
    processingSamples = samples;
    outputSampleRate = sampleRate;
  }

  const output = await processAudioSamples(processingSamples);

  const outputBuffer = new AudioBuffer({
    numberOfChannels: 1,
    length: output.length,
    sampleRate: outputSampleRate,
  });
  outputBuffer.copyToChannel(output, 0);

  return audioBufferToWav(outputBuffer);
}

/**
 * Convert raw Float32Array samples to a playable WAV blob without processing
 */
export function samplesToWav(samples: Float32Array<ArrayBufferLike>, sampleRate: number): Blob {
  const buffer = new AudioBuffer({
    numberOfChannels: 1,
    length: samples.length || 1,
    sampleRate: sampleRate,
  });
  if (samples.length > 0) {
    buffer.copyToChannel(samples, 0);
  }
  return audioBufferToWav(buffer);
}

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const samples = buffer.getChannelData(0);
  const dataLength = samples.length * bytesPerSample;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // WAV header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
