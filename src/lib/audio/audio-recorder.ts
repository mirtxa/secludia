/**
 * Audio Recorder using AudioWorklet
 *
 * Records audio samples from a MediaStream using AudioWorklet.
 * Returns raw Float32Array samples for processing.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet
 */

// Import worklet as URL for AudioWorklet.addModule()
import RecorderWorkletUrl from "./worklet/recorder-processor.worklet.ts?worker&url";

export interface RecordedAudio {
  samples: Float32Array;
  sampleRate: number;
}

export interface AudioRecorderOptions {
  /** Input volume 0-100 (default: 100) */
  inputVolume?: number;
}

export interface AudioRecorder {
  /** Start recording (called automatically on creation) */
  start: () => void;
  /** Stop recording and get the recorded samples */
  stop: () => Promise<RecordedAudio>;
  /** Clear recorded samples and start fresh */
  clear: () => void;
  /** Set VAD (Voice Activity Detection) threshold */
  setVadThreshold: (threshold: number, enabled: boolean) => void;
  /** Set input volume (0-100) */
  setInputVolume: (volume: number) => void;
  /** Get the AnalyserNode for visualizations */
  analyser: AnalyserNode;
  /** Clean up all resources */
  destroy: () => void;
}

/**
 * Create an audio recorder from a MediaStream
 *
 * @param stream - The MediaStream to record from
 * @param audioContext - Optional AudioContext (created if not provided)
 * @returns AudioRecorder instance
 *
 * @example
 * ```typescript
 * const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 * const recorder = await createAudioRecorder(stream);
 *
 * // Recording starts automatically
 * // ... user speaks ...
 *
 * // Stop and get samples
 * const { samples, sampleRate } = await recorder.stop();
 *
 * // Clean up
 * recorder.destroy();
 * ```
 */
export async function createAudioRecorder(
  stream: MediaStream,
  audioContext?: AudioContext,
  options: AudioRecorderOptions = {}
): Promise<AudioRecorder> {
  const { inputVolume = 100 } = options;
  const ctx = audioContext || new AudioContext({ sampleRate: 48000 });
  const ownsContext = !audioContext;

  // Ensure context is running
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  // Check AudioWorklet support
  if (!ctx.audioWorklet) {
    throw new Error("AudioWorklet is not supported in this browser");
  }

  // Load the recorder worklet module
  await ctx.audioWorklet.addModule(RecorderWorkletUrl);

  // Create audio graph
  const source = ctx.createMediaStreamSource(stream);

  // Create gain node for input volume control
  const inputGain = ctx.createGain();
  inputGain.gain.value = inputVolume / 100;

  // Create analyser for level metering
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;

  // Create recorder worklet node
  const recorderNode = new AudioWorkletNode(ctx, "recorder-processor", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1],
  });

  // Connect graph: source -> gain -> analyser -> recorder -> (silent output)
  source.connect(inputGain);
  inputGain.connect(analyser);
  analyser.connect(recorderNode);

  // Connect to destination with zero gain (keeps worklet running but silent)
  const silentGain = ctx.createGain();
  silentGain.gain.value = 0;
  recorderNode.connect(silentGain);
  silentGain.connect(ctx.destination);

  // Wait for init message from worklet
  await new Promise<void>((resolve) => {
    const initHandler = (event: MessageEvent) => {
      if (event.data.type === "init") {
        recorderNode.port.removeEventListener("message", initHandler);
        resolve();
      }
    };
    recorderNode.port.addEventListener("message", initHandler);
    recorderNode.port.start();
  });

  let stopPromiseResolve: ((audio: RecordedAudio) => void) | null = null;

  // Handle messages from worklet
  recorderNode.port.onmessage = (event) => {
    if (event.data.type === "samples" && stopPromiseResolve) {
      stopPromiseResolve({
        samples: event.data.samples,
        sampleRate: event.data.sampleRate,
      });
      stopPromiseResolve = null;
    }
  };

  return {
    start: () => {
      recorderNode.port.postMessage({ type: "clear" });
    },

    stop: () => {
      return new Promise<RecordedAudio>((resolve) => {
        stopPromiseResolve = resolve;
        recorderNode.port.postMessage({ type: "stop" });
      });
    },

    clear: () => {
      recorderNode.port.postMessage({ type: "clear" });
    },

    setVadThreshold: (threshold: number, enabled: boolean) => {
      recorderNode.port.postMessage({
        type: "set-threshold",
        data: { threshold, enabled },
      });
    },

    setInputVolume: (volume: number) => {
      inputGain.gain.value = volume / 100;
    },

    analyser,

    destroy: () => {
      source.disconnect();
      inputGain.disconnect();
      analyser.disconnect();
      recorderNode.disconnect();
      silentGain.disconnect();
      if (ownsContext) {
        ctx.close();
      }
    },
  };
}
