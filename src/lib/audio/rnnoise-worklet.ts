/**
 * RNNoise AudioWorklet Node
 *
 * Main thread wrapper for the RNNoise AudioWorklet processor.
 * Provides real-time noise suppression using the Web Audio API AudioWorklet.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_AudioWorklet
 * @see https://webaudio.github.io/web-audio-api/#AudioWorklet
 */

// Import worklet as URL for AudioWorklet.addModule()
import RnnoiseWorkletUrl from "./worklet/rnnoise-processor.worklet.ts?worker&url";

/**
 * RNNoise node interface
 */
export interface RnnoiseNode {
  /** The AudioWorkletNode to connect in the audio graph */
  node: AudioWorkletNode;
  /** Enable or disable noise suppression (pass-through when disabled) */
  setEnabled: (enabled: boolean) => void;
  /** Clean up resources */
  destroy: () => void;
}

/**
 * Create an RNNoise AudioWorklet node for real-time noise suppression
 *
 * @param audioContext - The AudioContext to use (should be 48kHz for optimal quality)
 * @returns RnnoiseNode with the worklet node and control methods
 * @throws Error if AudioWorklet is not supported or initialization fails
 *
 * @example
 * ```typescript
 * const audioContext = new AudioContext({ sampleRate: 48000 });
 * const source = audioContext.createMediaStreamSource(micStream);
 * const rnnoise = await createRnnoiseNode(audioContext);
 *
 * source.connect(rnnoise.node);
 * rnnoise.node.connect(audioContext.destination);
 *
 * // Later: disable/enable
 * rnnoise.setEnabled(false);
 *
 * // Cleanup
 * rnnoise.destroy();
 * ```
 */
export async function createRnnoiseNode(audioContext: AudioContext): Promise<RnnoiseNode> {
  // Check AudioWorklet support
  if (!audioContext.audioWorklet) {
    throw new Error("AudioWorklet is not supported in this browser");
  }

  // Warn if sample rate is not 48kHz
  if (audioContext.sampleRate !== 48000) {
    console.warn(
      `[RNNoise] AudioContext sample rate is ${audioContext.sampleRate}Hz. ` +
        `RNNoise is optimized for 48000Hz. Audio quality may be affected.`
    );
  }

  // Load the worklet module
  await audioContext.audioWorklet.addModule(RnnoiseWorkletUrl);

  // Create the worklet node
  const workletNode = new AudioWorkletNode(audioContext, "rnnoise-processor", {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [1], // Mono output
  });

  // Wait for WASM to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("RNNoise worklet initialization timeout"));
    }, 10000);

    workletNode.port.onmessage = (event) => {
      if (event.data.type === "ready") {
        clearTimeout(timeout);
        resolve();
      } else if (event.data.type === "error") {
        clearTimeout(timeout);
        reject(new Error(event.data.error));
      }
    };
  });

  return {
    node: workletNode,
    setEnabled: (enabled: boolean) => {
      workletNode.port.postMessage({ type: "set-enabled", data: { enabled } });
    },
    destroy: () => {
      workletNode.port.postMessage({ type: "destroy" });
      workletNode.disconnect();
    },
  };
}

/**
 * Create an RNNoise-processed MediaStream from an input stream
 *
 * @param inputStream - The input MediaStream (e.g., from getUserMedia)
 * @param audioContext - Optional AudioContext (created if not provided, should be 48kHz)
 * @returns Object with processed stream and control methods
 *
 * @example
 * ```typescript
 * const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
 * const { stream, setEnabled, destroy } = await createRnnoiseStream(micStream);
 *
 * // Use the processed stream
 * peerConnection.addTrack(stream.getAudioTracks()[0], stream);
 *
 * // Toggle noise suppression
 * setEnabled(false);
 *
 * // Cleanup when done
 * destroy();
 * ```
 */
export async function createRnnoiseStream(
  inputStream: MediaStream,
  audioContext?: AudioContext
): Promise<{
  stream: MediaStream;
  setEnabled: (enabled: boolean) => void;
  destroy: () => void;
}> {
  // Create AudioContext at 48kHz if not provided
  const ctx = audioContext || new AudioContext({ sampleRate: 48000 });
  const ownsContext = !audioContext;

  // Ensure context is running
  if (ctx.state === "suspended") {
    await ctx.resume();
  }

  // Create audio graph: source -> rnnoise -> destination
  const source = ctx.createMediaStreamSource(inputStream);
  const { node, setEnabled, destroy: destroyNode } = await createRnnoiseNode(ctx);
  const destination = ctx.createMediaStreamDestination();

  source.connect(node);
  node.connect(destination);

  return {
    stream: destination.stream,
    setEnabled,
    destroy: () => {
      source.disconnect();
      destroyNode();
      if (ownsContext) {
        ctx.close();
      }
    },
  };
}
