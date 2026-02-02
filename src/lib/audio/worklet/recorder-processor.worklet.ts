/**
 * Audio Recorder AudioWorklet Processor
 *
 * Captures audio samples in real-time for later processing.
 * Supports Voice Activity Detection (VAD) to only record when audio exceeds threshold.
 * Sends accumulated samples back to the main thread via MessagePort.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet
 */

// AudioWorkletGlobalScope declarations
declare const sampleRate: number;

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

// Maximum recording duration in samples (60 seconds at 48kHz)
const MAX_SAMPLES = 48000 * 60;

// Hang time in samples (continue recording for 300ms after level drops below threshold)
const HANG_TIME_SAMPLES = Math.floor(sampleRate * 0.3);

/**
 * Convert linear amplitude to dB
 */
function amplitudeToDb(amplitude: number): number {
  if (amplitude <= 0) return -Infinity;
  return 20 * Math.log10(amplitude);
}

/**
 * Calculate RMS (Root Mean Square) of audio samples
 */
function calculateRms(samples: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    sumSquares += samples[i] * samples[i];
  }
  return Math.sqrt(sumSquares / samples.length);
}

/**
 * Audio Recorder Processor
 *
 * Accumulates audio samples and sends them to the main thread on demand.
 * Supports VAD (Voice Activity Detection) with configurable threshold.
 */
class RecorderProcessor extends AudioWorkletProcessor {
  private samples: Float32Array;
  private writeIndex = 0;
  private isRecording = true;

  // VAD settings
  private vadEnabled = false;
  private thresholdDb = -50; // Default threshold in dB
  private hangCounter = 0; // Counts down after level drops below threshold

  constructor() {
    super();

    // Pre-allocate buffer for max duration
    this.samples = new Float32Array(MAX_SAMPLES);

    this.port.onmessage = this.handleMessage.bind(this);

    // Send sample rate to main thread
    this.port.postMessage({ type: "init", sampleRate });
  }

  private handleMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case "stop":
        this.stopRecording();
        break;
      case "clear":
        this.writeIndex = 0;
        this.isRecording = true;
        this.hangCounter = 0;
        break;
      case "set-threshold":
        this.thresholdDb = data.threshold;
        this.vadEnabled = data.enabled;
        break;
    }
  }

  private stopRecording(): void {
    this.isRecording = false;

    // Send captured samples to main thread
    // Create a copy of only the recorded portion
    const recordedSamples = this.samples.slice(0, this.writeIndex);

    this.port.postMessage(
      {
        type: "samples",
        samples: recordedSamples,
        sampleRate,
      },
      [recordedSamples.buffer] // Transfer ownership for efficiency
    );
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    _parameters: Record<string, Float32Array>
  ): boolean {
    const input = inputs[0]?.[0];
    const output = outputs[0]?.[0];

    if (!input) {
      return true;
    }

    // Pass through to output (for monitoring/analysis)
    if (output) {
      output.set(input);
    }

    if (!this.isRecording || this.writeIndex + input.length > MAX_SAMPLES) {
      return true;
    }

    // Check if we should record based on VAD
    let shouldRecord = true;

    if (this.vadEnabled) {
      const rms = calculateRms(input);
      const levelDb = amplitudeToDb(rms);

      if (levelDb >= this.thresholdDb) {
        // Audio is above threshold - record and reset hang counter
        shouldRecord = true;
        this.hangCounter = HANG_TIME_SAMPLES;
      } else if (this.hangCounter > 0) {
        // Audio is below threshold but within hang time - keep recording
        shouldRecord = true;
        this.hangCounter -= input.length;
      } else {
        // Audio is below threshold and hang time expired - don't record
        shouldRecord = false;
      }
    }

    if (shouldRecord) {
      this.samples.set(input, this.writeIndex);
      this.writeIndex += input.length;
    }

    return true;
  }
}

registerProcessor("recorder-processor", RecorderProcessor);
