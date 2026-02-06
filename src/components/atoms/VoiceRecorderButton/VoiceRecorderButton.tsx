import { memo, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@heroui/react";
import { Microphone, StopFill, PlayFill, PauseFill, PaperPlane, TrashBin } from "@gravity-ui/icons";
import { getVoiceConfig } from "@/config/localStorage";
import { useMediaStream } from "@/hooks";
import {
  createAudioRecorder,
  processRawSamplesWithRNNoise,
  samplesToWav,
  type AudioRecorder,
} from "@/lib/audio";
import "./VoiceRecorderButton.css";

/**
 * Self-contained voice recorder button that handles recording, playback, and sending.
 *
 * **Voice settings are automatically applied from localStorage:**
 * - `audioInputDevice` - Selected microphone
 * - `inputVolume` - Recording volume (0-100%)
 * - `echoCancellation` - Browser echo cancellation
 * - `inputSensitivity` - VAD threshold for voice detection
 * - `noiseSuppressionEnabled` - RNNoise processing
 *
 * Settings are read fresh on each recording start, so changes in Voice Settings
 * take effect immediately without remounting the component.
 *
 * @example
 * ```tsx
 * // For chat - with send button
 * <VoiceRecorderButton onSend={(audio) => sendVoiceMessage(audio)} />
 *
 * // For settings/testing - without send button
 * <VoiceRecorderButton hideSendButton />
 * ```
 */
export interface VoiceRecorderButtonProps {
  /** Called when recording is sent with the processed audio blob */
  onSend?: (audio: Blob) => void;
  /** Called when an error occurs (e.g., microphone access denied) */
  onError?: (error: Error) => void;
  /** Layout orientation - controls button order and waveform direction */
  orientation?: "left" | "right";
  /** Disable the recorder */
  isDisabled?: boolean;
  /** Hide the send button (for testing/preview mode) */
  hideSendButton?: boolean;
  /** Maximum recording duration in seconds (default: 60) */
  maxDuration?: number;
}

type RecorderState = "idle" | "recording" | "stopped";

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const BAR_WIDTH = 2;
const BAR_GAP = 2;
const BAR_SPACING = BAR_WIDTH + BAR_GAP;
const UPDATE_INTERVAL = 100;

// Memoized bar component to prevent unnecessary re-renders
const WaveformBar = memo(function WaveformBar({
  level,
  position,
}: {
  level: number;
  position: number;
}) {
  const height = 2 + (level / 100) * 22;
  return (
    <div
      className="waveform-bar absolute top-1/2 w-0.5 -translate-y-1/2 rounded-full bg-current"
      style={{ height: `${height}px`, left: `${position}px` }}
    />
  );
});

// Recording waveform - captures levels and displays animated waveform
const RecordingWaveform = memo(function RecordingWaveform({
  level,
  facingLeft = false,
  onLevelsChange,
}: {
  level: number;
  facingLeft?: boolean;
  onLevelsChange?: (levels: number[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<{ id: number; level: number }[]>([]);
  const allLevelsRef = useRef<number[]>([]);
  const levelRef = useRef(level);
  const idRef = useRef(0);
  const containerWidthRef = useRef(200);
  const [, forceRender] = useState(0);

  // Intentional: sync prop to ref for interval access (avoids stale closure)
  // eslint-disable-next-line react-hooks/refs
  levelRef.current = level;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateWidth = () => {
      containerWidthRef.current = container.offsetWidth;
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    allLevelsRef.current = [];
    const visibleBars = Math.floor(containerWidthRef.current / BAR_SPACING);
    barsRef.current = Array.from({ length: visibleBars }, (_, i) => ({
      id: i,
      level: 0,
    }));
    idRef.current = visibleBars;
    forceRender((t) => t + 1);

    const interval = window.setInterval(() => {
      const currentLevel = levelRef.current;
      const visibleBars = Math.floor(containerWidthRef.current / BAR_SPACING);
      const maxBars = visibleBars + 5;

      allLevelsRef.current.push(currentLevel);

      barsRef.current.push({ id: idRef.current++, level: currentLevel });
      if (barsRef.current.length > maxBars) {
        barsRef.current = barsRef.current.slice(-maxBars);
      }

      forceRender((t) => t + 1);
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(interval);
      onLevelsChange?.(allLevelsRef.current);
    };
  }, [onLevelsChange]);

  // Intentional: read refs during render for performance (state would cause excessive re-renders)
  const bars = barsRef.current;
  const containerWidth = containerWidthRef.current;

  return (
    <div ref={containerRef} className="relative h-6 min-w-0 flex-1 overflow-hidden">
      {/* eslint-disable-next-line react-hooks/refs -- Intentional: render from ref for perf */}
      {bars.map((bar, index) => {
        const age = bars.length - 1 - index;
        const position = facingLeft
          ? age * BAR_SPACING
          : containerWidth - BAR_SPACING - age * BAR_SPACING;

        return <WaveformBar key={bar.id} level={bar.level} position={position} />;
      })}
    </div>
  );
});

// Memoized playback bar
const PlaybackBar = memo(function PlaybackBar({
  level,
  isPlayed,
}: {
  level: number;
  isPlayed: boolean;
}) {
  const height = 2 + (level / 100) * 22;
  return (
    <div
      className={`w-0.5 shrink-0 rounded-full ${isPlayed ? "bg-current" : "bg-current opacity-40"}`}
      style={{ height: `${height}px` }}
    />
  );
});

// Playback waveform - displays full recorded waveform with progress
const PlaybackWaveform = memo(function PlaybackWaveform({
  levels,
  progress = 0,
  facingLeft = false,
  onSeek,
}: {
  levels: number[];
  progress?: number;
  facingLeft?: boolean;
  onSeek?: (progress: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [barCount, setBarCount] = useState(40);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateBarCount = () => {
      const width = container.offsetWidth;
      setBarCount(Math.max(10, Math.floor(width / BAR_SPACING)));
    };

    updateBarCount();
    const observer = new ResizeObserver(updateBarCount);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const sampledLevels = useMemo(() => {
    if (levels.length === 0) return Array(barCount).fill(0) as number[];
    if (levels.length <= barCount) {
      return [...levels, ...Array(barCount - levels.length).fill(0)] as number[];
    }

    const bucketSize = levels.length / barCount;
    const sampled: number[] = [];
    for (let i = 0; i < barCount; i++) {
      const start = Math.floor(i * bucketSize);
      const end = Math.floor((i + 1) * bucketSize);
      const bucket = levels.slice(start, end);
      sampled.push(Math.max(...bucket, 0));
    }
    return sampled;
  }, [levels, barCount]);

  const progressIndex = Math.floor(progress * sampledLevels.length);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onSeek || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      let seekProgress = clickX / rect.width;
      if (facingLeft) seekProgress = 1 - seekProgress;
      onSeek(Math.max(0, Math.min(1, seekProgress)));
    },
    [onSeek, facingLeft]
  );

  return (
    <div
      ref={containerRef}
      className={`flex h-6 min-w-0 flex-1 items-center justify-between ${onSeek ? "cursor-pointer" : ""}`}
      onClick={handleClick}
    >
      {sampledLevels.map((l, i) => {
        const actualIndex = facingLeft ? sampledLevels.length - 1 - i : i;
        const isPlayed = facingLeft
          ? actualIndex >= sampledLevels.length - progressIndex
          : actualIndex < progressIndex;

        return <PlaybackBar key={i} level={l} isPlayed={isPlayed} />;
      })}
    </div>
  );
});

const FLIP_CLASS = "-scale-x-100";

// Memoized time display component
const TimeDisplay = memo(function TimeDisplay({
  time,
  position,
}: {
  time: number;
  position: "left" | "right";
}) {
  return (
    <span className={`font-mono text-sm tabular-nums ${position === "right" ? "ml-1" : "mr-1"}`}>
      {formatTime(time)}
    </span>
  );
});

const VoiceIndicator = memo(function VoiceIndicator({
  level,
  facingLeft = false,
}: {
  level: number;
  facingLeft?: boolean;
}) {
  const mouthAngle = (level / 100) * 60;

  // Only calculate path when mouth is open
  let pathD: string | null = null;
  if (mouthAngle >= 1) {
    const angleRad = (mouthAngle * Math.PI) / 180;
    const cosAngle = Math.cos(angleRad);
    const sinAngle = Math.sin(angleRad);
    const x = 50 + 45 * cosAngle;
    const yTop = 50 - 45 * sinAngle;
    const yBottom = 50 + 45 * sinAngle;
    pathD = `M 50 50 L ${x} ${yTop} A 45 45 0 1 0 ${x} ${yBottom} Z`;
  }

  return (
    <svg viewBox="0 0 100 100" className={`voice-indicator size-4 ${facingLeft ? FLIP_CLASS : ""}`}>
      {pathD ? (
        <path d={pathD} fill="currentColor" />
      ) : (
        <circle cx="50" cy="50" r="45" fill="currentColor" />
      )}
    </svg>
  );
});

export const VoiceRecorderButton = memo(function VoiceRecorderButton({
  onSend,
  onError,
  orientation = "right",
  isDisabled = false,
  hideSendButton = false,
  maxDuration = 60,
}: VoiceRecorderButtonProps) {
  // Recording state
  const [state, setState] = useState<RecorderState>("idle");
  const [audioLevel, setAudioLevel] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedLevels, setRecordedLevels] = useState<number[]>([]);

  // Playback state
  const [isMainHovered, setIsMainHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Centralized media stream - auto-registers with MediaRegistry for privacy indicator
  // Uses getter function to read fresh voice config on each recording start
  const getConstraints = useCallback((): MediaStreamConstraints => {
    const voiceConfig = getVoiceConfig();
    return {
      audio: {
        deviceId:
          voiceConfig.audioInputDevice !== "default"
            ? { exact: voiceConfig.audioInputDevice }
            : undefined,
        noiseSuppression: false,
        echoCancellation: voiceConfig.echoCancellation,
        autoGainControl: false,
        sampleRate: 48000,
      },
    };
  }, []);

  const { start: startStream, stop: stopStream } = useMediaStream({
    type: "microphone",
    source: "Voice Message",
    constraints: getConstraints,
  });

  // Refs
  const recorderRef = useRef<AudioRecorder | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Track container width to hide waveform when too narrow
  const [showWaveform, setShowWaveform] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateShowWaveform = () => {
      setShowWaveform(container.offsetWidth >= 180);
    };

    updateShowWaveform();
    const observer = new ResizeObserver(updateShowWaveform);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Cleanup recording resources
  const cleanupRecording = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.destroy();
      recorderRef.current = null;
    }
    stopStream();
  }, [stopStream]);

  // Cleanup playback resources
  const cleanupPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackTime(0);
    setPlaybackDuration(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRecording();
      cleanupPlayback();
    };
  }, [cleanupRecording, cleanupPlayback]);

  // Create audio URL and load duration when blob changes
  useEffect(() => {
    cleanupPlayback();
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      audioUrlRef.current = url;

      // Create audio element to get duration
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setPlaybackDuration(audio.duration);
      };
      audioRef.current = audio;
    }
  }, [audioBlob, cleanupPlayback]);

  // Store recorded levels
  const handleLevelsChange = useCallback((levels: number[]) => {
    setRecordedLevels(levels);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    setAudioBlob(null);
    setRecordedLevels([]);

    try {
      // Use centralized media stream (auto-registers with MediaRegistry)
      const mediaStream = await startStream();
      if (!mediaStream) {
        throw new Error("Failed to access microphone");
      }

      const voiceConfig = getVoiceConfig();

      const recorder = await createAudioRecorder(mediaStream, undefined, {
        inputVolume: voiceConfig.inputVolume,
      });
      recorderRef.current = recorder;

      // VAD disabled for voice messages - keep natural pauses in recording

      const analyser = recorder.analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      startTimeRef.current = Date.now();

      const updateLevel = () => {
        if (!recorderRef.current) return;

        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const normalized = Math.min(100, (average / 48) * 100);
        setAudioLevel(normalized);

        setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));

        animationRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
      setState("recording");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to access microphone");
      onError?.(error);
      cleanupRecording();
    }
  }, [startStream, cleanupRecording, onError]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (recorderRef.current) {
      try {
        const { samples, sampleRate } = await recorderRef.current.stop();

        if (samples.length > 0) {
          setIsProcessing(true);

          const voiceConfig = getVoiceConfig();

          try {
            const blob = voiceConfig.noiseSuppressionEnabled
              ? await processRawSamplesWithRNNoise(samples, sampleRate)
              : samplesToWav(samples, sampleRate);

            setAudioBlob(blob);
          } catch (err) {
            if (import.meta.env.DEV) console.error("Failed to process audio:", err);
            const blob = samplesToWav(samples, sampleRate);
            setAudioBlob(blob);
          } finally {
            setIsProcessing(false);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Failed to get recorded samples:", err);
      }
    }

    if (recorderRef.current) {
      recorderRef.current.destroy();
      recorderRef.current = null;
    }

    // Stop stream via centralized hook (auto-unregisters from MediaRegistry)
    stopStream();

    setState("stopped");
    setAudioLevel(0);
  }, [stopStream]);

  // Auto-stop recording when max duration is reached
  useEffect(() => {
    if (state === "recording" && elapsedTime >= maxDuration) {
      stopRecording();
    }
  }, [state, elapsedTime, maxDuration, stopRecording]);

  // Toggle play/pause
  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    // Set up event handlers if not already set
    if (!audioRef.current.onended) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setPlaybackTime(0);
      };
      audioRef.current.ontimeupdate = () => {
        setPlaybackTime(audioRef.current?.currentTime ?? 0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Seek to position in playback
  const handleSeek = useCallback(
    (progress: number) => {
      if (!audioRef.current || !playbackDuration) return;
      const newTime = progress * playbackDuration;
      audioRef.current.currentTime = newTime;
      setPlaybackTime(newTime);
    },
    [playbackDuration]
  );

  // Main button press handler
  const handleMainPress = useCallback(() => {
    if (state === "recording") {
      stopRecording();
    } else if (state === "stopped" && audioBlob) {
      handlePlayPause();
    } else {
      startRecording();
    }
  }, [state, audioBlob, stopRecording, handlePlayPause, startRecording]);

  // Send recording (works during recording or after stopped)
  const handleSend = useCallback(async () => {
    if (!onSend) return;

    // If already have a blob, send it directly
    if (audioBlob) {
      cleanupPlayback();
      onSend(audioBlob);
      setAudioBlob(null);
      setRecordedLevels([]);
      setState("idle");
      setElapsedTime(0);
      return;
    }

    // If recording, stop and send immediately
    if (state === "recording" && recorderRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      try {
        const { samples, sampleRate } = await recorderRef.current.stop();

        if (samples.length > 0) {
          setIsProcessing(true);
          const voiceConfig = getVoiceConfig();

          let blob: Blob;
          try {
            blob = voiceConfig.noiseSuppressionEnabled
              ? await processRawSamplesWithRNNoise(samples, sampleRate)
              : samplesToWav(samples, sampleRate);
          } catch {
            blob = samplesToWav(samples, sampleRate);
          }

          setIsProcessing(false);
          onSend(blob);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("Failed to get recorded samples:", err);
        setIsProcessing(false);
      }

      if (recorderRef.current) {
        recorderRef.current.destroy();
        recorderRef.current = null;
      }
      stopStream();

      setRecordedLevels([]);
      setState("idle");
      setAudioLevel(0);
      setElapsedTime(0);
    }
  }, [audioBlob, cleanupPlayback, onSend, state, stopStream]);

  // Discard recording (works during recording or after)
  const handleDiscard = useCallback(() => {
    cleanupRecording();
    cleanupPlayback();
    setAudioBlob(null);
    setRecordedLevels([]);
    setState("idle");
    setAudioLevel(0);
    setElapsedTime(0);
  }, [cleanupRecording, cleanupPlayback]);

  const isRecording = state === "recording";
  const hasRecording = state === "stopped" && audioBlob;
  const effectiveDisabled = isDisabled || isProcessing;

  // Idle state - just microphone button
  if (state === "idle") {
    return (
      <div ref={containerRef} className="flex w-full justify-end">
        <Button
          variant="ghost"
          isIconOnly
          onPress={startRecording}
          isDisabled={effectiveDisabled}
          className="bg-accent text-white hover:bg-accent/80"
        >
          <Microphone className="size-4" />
        </Button>
      </div>
    );
  }

  // Timer display: recording -> elapsed, playing/paused -> position, stopped -> duration
  const displayTime = isRecording
    ? elapsedTime
    : isPlaying || playbackTime > 0
      ? Math.floor(playbackTime)
      : Math.floor(playbackDuration);

  const playbackProgress = playbackDuration > 0 ? playbackTime / playbackDuration : 0;

  const waveform = isRecording ? (
    <RecordingWaveform
      level={audioLevel}
      facingLeft={orientation === "left"}
      onLevelsChange={handleLevelsChange}
    />
  ) : hasRecording && recordedLevels.length > 0 ? (
    <PlaybackWaveform
      levels={recordedLevels}
      progress={playbackProgress}
      facingLeft={orientation === "left"}
      onSeek={isPlaying ? handleSeek : undefined}
    />
  ) : null;

  // Recording state: VoiceIndicator outside button for proper opacity animation
  const mainElement = isRecording ? (
    <div
      className="flex size-10 items-center justify-center"
      onMouseEnter={() => setIsMainHovered(true)}
      onMouseLeave={() => setIsMainHovered(false)}
    >
      {isMainHovered && !hideSendButton ? (
        <Button variant="danger" isIconOnly onPress={stopRecording} isDisabled={effectiveDisabled}>
          <StopFill className="size-4" />
        </Button>
      ) : (
        <VoiceIndicator level={audioLevel} facingLeft={orientation === "left"} />
      )}
    </div>
  ) : (
    <Button
      variant="ghost"
      isIconOnly
      onPress={handleMainPress}
      isDisabled={effectiveDisabled}
      className={`group hover:bg-current ${isPlaying ? "bg-current" : ""}`}
    >
      {isPlaying ? (
        <PauseFill className="size-4 text-accent" />
      ) : (
        <PlayFill className="size-4 transition-colors group-hover:text-accent" />
      )}
    </Button>
  );

  // Discard button - show during recording (if send visible) or after stopped
  const discardButton = ((!hideSendButton && (isRecording || hasRecording)) ||
    (hideSendButton && hasRecording)) && (
    <Button
      variant="ghost"
      isIconOnly
      onPress={handleDiscard}
      isDisabled={effectiveDisabled}
      className="group hover:bg-current"
    >
      <TrashBin className="size-4 transition-colors group-hover:text-danger" />
    </Button>
  );

  // Stop button - only when hideSendButton and recording (replaces send position)
  const stopButton = hideSendButton && isRecording && (
    <Button variant="danger" isIconOnly onPress={stopRecording} isDisabled={effectiveDisabled}>
      <StopFill className="size-4" />
    </Button>
  );

  const sendButton = !hideSendButton && (
    <Button
      variant="ghost"
      isIconOnly
      onPress={handleSend}
      isDisabled={effectiveDisabled}
      className="group hover:bg-current"
    >
      <PaperPlane className="size-4 transition-colors group-hover:text-accent" />
    </Button>
  );

  // Layout: [main] [waveform] [timer] [discard?] [send] for right orientation
  // Layout: [send] [discard?] [timer] [waveform] [main] for left orientation
  return (
    <div
      ref={containerRef}
      className="voice-recorder flex w-full items-center gap-2 rounded-full bg-accent px-1 py-1"
    >
      {orientation === "right" ? (
        <>
          {mainElement}
          {showWaveform ? waveform : <div className="flex-1" />}
          <TimeDisplay time={displayTime} position="right" />
          <div className="flex">
            {stopButton}
            {discardButton}
            {sendButton}
          </div>
        </>
      ) : (
        <>
          <div className="flex">
            {sendButton}
            {discardButton}
            {stopButton}
          </div>
          <TimeDisplay time={displayTime} position="left" />
          {showWaveform ? waveform : <div className="flex-1" />}
          {mainElement}
        </>
      )}
    </div>
  );
});
