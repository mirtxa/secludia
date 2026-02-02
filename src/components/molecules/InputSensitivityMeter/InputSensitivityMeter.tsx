import { memo, useState, useEffect, useRef, useMemo } from "react";
import { Label, Slider } from "@heroui/react";
import { useMediaStream } from "@/hooks";
import { closeAudioContext } from "@/utils";

interface InputSensitivityMeterProps {
  threshold: number;
  onThresholdChange: (value: number) => void;
  minDb?: number;
  maxDb?: number;
  deviceId?: string;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
  /** Input volume 0-100 */
  inputVolume?: number;
  label: string;
  description?: string;
}

// Convert linear amplitude (0-1) to dB
function amplitudeToDb(amplitude: number): number {
  if (amplitude <= 0) return -Infinity;
  return 20 * Math.log10(amplitude);
}

// Convert dB to percentage position
function dbToPercent(db: number, minDb: number, maxDb: number): number {
  if (db <= minDb) return 0;
  if (db >= maxDb) return 100;
  return ((db - minDb) / (maxDb - minDb)) * 100;
}

export const InputSensitivityMeter = memo(function InputSensitivityMeter({
  threshold,
  onThresholdChange,
  minDb = -100,
  maxDb = 0,
  deviceId = "default",
  echoCancellation = true,
  autoGainControl = false,
  inputVolume = 100,
  label,
  description,
}: InputSensitivityMeterProps) {
  const [audioLevelDb, setAudioLevelDb] = useState<number>(minDb);

  // Memoize constraints to prevent unnecessary stream restarts
  const constraints = useMemo(
    () => ({
      audio: {
        deviceId: deviceId !== "default" ? { exact: deviceId } : undefined,
        noiseSuppression: false,
        echoCancellation,
        autoGainControl,
      },
    }),
    [deviceId, echoCancellation, autoGainControl]
  );

  // Use centralized media stream hook - auto-registers with MediaRegistry
  const { stream, start } = useMediaStream({
    type: "microphone",
    source: "Voice Settings",
    constraints,
  });

  // Start stream on mount
  useEffect(() => {
    start();
  }, [start]);

  // Refs for audio processing resources
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const animationRef = useRef<number | null>(null);

  // Set up audio analysis when stream is available
  useEffect(() => {
    if (!stream) return;

    let mounted = true;

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);

    const gainNode = audioContext.createGain();
    gainNode.gain.value = inputVolume / 100;
    gainNodeRef.current = gainNode;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;
    analyserRef.current = analyser;

    source.connect(gainNode);
    gainNode.connect(analyser);

    const dataArray = new Float32Array(analyser.fftSize);

    const updateLevel = () => {
      if (!mounted || !analyserRef.current) return;

      analyserRef.current.getFloatTimeDomainData(dataArray);

      let sumSquares = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sumSquares += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      const db = amplitudeToDb(rms);

      setAudioLevelDb((prev) => {
        const smoothed = prev * 0.3 + db * 0.7;
        return Math.max(minDb, Math.min(maxDb, smoothed));
      });

      animationRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      mounted = false;

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      audioContextRef.current = closeAudioContext(audioContextRef.current);
      analyserRef.current = null;
      gainNodeRef.current = null;
    };
  }, [stream, inputVolume, minDb, maxDb]);

  // Update gain when inputVolume changes (without recreating the audio graph)
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = inputVolume / 100;
    }
  }, [inputVolume]);

  const levelPercent = dbToPercent(audioLevelDb, minDb, maxDb);

  return (
    <div className="flex flex-col gap-2">
      <Slider
        value={threshold}
        onChange={(v) => onThresholdChange(v as number)}
        minValue={minDb}
        maxValue={maxDb}
        step={1}
      >
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-foreground">{label}</Label>
          <Slider.Output className="text-sm text-muted">
            {({ state }) => `${state.values[0]} dB`}
          </Slider.Output>
        </div>
        <Slider.Track className="relative bg-success border-s-warning">
          <Slider.Fill className="-ml-2 rounded-l-full bg-warning" />
          {/* Audio level progress bar */}
          <div
            className="pointer-events-none absolute inset-y-0 -left-3 rounded-l-full bg-black/40"
            style={{ width: `${levelPercent}%` }}
          />
          <Slider.Thumb className="z-20 bg-success" />
        </Slider.Track>
      </Slider>
      {description && <p className="text-xs text-muted">{description}</p>}
    </div>
  );
});
