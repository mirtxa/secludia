import { memo, useState, useRef, useCallback, useEffect } from "react";
import { Volume, CirclePlay, CircleStop, CircleExclamation } from "@gravity-ui/icons";
import { Button, Tooltip } from "@heroui/react";
import { SettingSlider, SettingSelect } from "@/components/molecules";
import { useAppContext } from "@/context";
import { useMediaDevices, usePlatform } from "@/hooks";
import { closeAudioContext } from "@/utils";

const SpeakerTest = memo(function SpeakerTest({
  deviceId,
  volume,
  supportsDeviceSelection,
  startLabel,
  stopLabel,
}: {
  deviceId: string;
  volume: number;
  supportsDeviceSelection: boolean;
  startLabel: string;
  stopLabel: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const stopTest = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    audioContextRef.current = closeAudioContext(audioContextRef.current);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startTest = useCallback(async () => {
    setError(null);
    try {
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      // Create oscillator for a pleasant test tone
      const oscillator = audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime((volume / 100) * 0.3, audioContext.currentTime); // Max 30% to avoid being too loud

      oscillator.connect(gainNode);

      // If device selection is supported, route through an audio element
      if (supportsDeviceSelection && deviceId !== "default") {
        const dest = audioContext.createMediaStreamDestination();
        gainNode.connect(dest);

        const audio = new Audio();
        audio.srcObject = dest.stream;

        // Use setSinkId to route to specific device
        if ("setSinkId" in audio) {
          await (
            audio as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }
          ).setSinkId(deviceId);
        }

        audio.play();
        audioElementRef.current = audio;
      } else {
        gainNode.connect(audioContext.destination);
      }

      oscillator.start();
      oscillatorRef.current = oscillator;
      gainNodeRef.current = gainNode;

      setIsPlaying(true);

      // Auto-stop after 3 seconds
      setTimeout(() => {
        stopTest();
      }, 3000);
    } catch (err) {
      console.error("Failed to play test tone:", err);
      setError(err instanceof Error ? err.message : "Failed to play test tone");
      stopTest();
    }
  }, [deviceId, volume, supportsDeviceSelection, stopTest]);

  const toggleTest = useCallback(() => {
    if (isPlaying) {
      stopTest();
    } else {
      startTest();
    }
  }, [isPlaying, startTest, stopTest]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
      }
      closeAudioContext(audioContextRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {error && <span className="text-sm text-danger">{error}</span>}
      <Button variant="ghost" className="w-fit" onPress={toggleTest}>
        {isPlaying ? (
          <>
            <CircleStop className="size-4" />
            {stopLabel}
          </>
        ) : (
          <>
            <CirclePlay className="size-4" />
            {startLabel}
          </>
        )}
      </Button>
    </div>
  );
});

export const AudioSection = memo(function AudioSection() {
  const { t } = useAppContext();
  const { supportsAudioOutputSelection } = usePlatform();

  const { devices: audioOutputDevices } = useMediaDevices({
    kind: "audiooutput",
    defaultLabel: t("SETTINGS_AUDIO_DEFAULT_DEVICE"),
  });

  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("default");
  const [outputVolume, setOutputVolume] = useState<number>(100);

  return (
    <div className="flex flex-col gap-4">
      {supportsAudioOutputSelection ? (
        <SettingSelect
          icon={<Volume />}
          label={t("SETTINGS_AUDIO_OUTPUT_DEVICE")}
          options={audioOutputDevices}
          value={selectedAudioOutput}
          onChange={setSelectedAudioOutput}
        />
      ) : (
        <div className="flex w-full items-center gap-3 rounded-xl bg-surface p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-default text-foreground">
            <Volume />
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="text-sm font-medium text-foreground">
              {t("SETTINGS_AUDIO_OUTPUT_DEVICE")}
            </span>
            <span className="text-[13px] text-muted">{t("SETTINGS_AUDIO_SYSTEM_DEFAULT")}</span>
          </div>
          <Tooltip>
            <CircleExclamation className="shrink-0 text-warning" />
            <Tooltip.Content placement="left" className="max-w-[200px] rounded-lg">
              {t("SETTINGS_AUDIO_OUTPUT_NOT_SUPPORTED")}
            </Tooltip.Content>
          </Tooltip>
        </div>
      )}

      <SettingSlider
        label={t("SETTINGS_AUDIO_OUTPUT_VOLUME")}
        value={outputVolume}
        onChange={setOutputVolume}
        minValue={0}
        maxValue={100}
        step={1}
        formatValue={(v) => `${v}%`}
      />

      <SpeakerTest
        deviceId={selectedAudioOutput}
        volume={outputVolume}
        supportsDeviceSelection={supportsAudioOutputSelection}
        startLabel={t("SETTINGS_AUDIO_TEST_SPEAKERS")}
        stopLabel={t("SETTINGS_AUDIO_STOP_TEST")}
      />
    </div>
  );
});
