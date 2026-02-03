import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ArrowsExpand, CirclePlay, Display, Gear, Speedometer } from "@gravity-ui/icons";
import { Button, Card, Chip } from "@heroui/react";
import { useAppContext } from "@/context";
import { usePersistedSetting, usePlatform, useTranslatedOptions, useMediaStream } from "@/hooks";
import { SectionHeader, SettingSwitch, SettingSelect } from "@/components/molecules";
import { getScreenConfig, updateScreenConfig } from "@/config/localStorage";
import { VIDEO_CODEC_OPTIONS } from "@/config/configTypes";
import { getStreamInfo } from "@/utils/media";
import type {
  ScreenShareResolution,
  ScreenShareFrameRate,
  BandwidthMode,
  VideoCodec,
} from "@/config/configTypes";
import type { TranslationKey } from "@/i18n/types";

const SCREEN_RESOLUTION_OPTIONS: readonly {
  key: ScreenShareResolution;
  labelKey: TranslationKey;
}[] = [
  { key: "720p", labelKey: "SETTINGS_SCREEN_RES_720P" },
  { key: "1080p", labelKey: "SETTINGS_SCREEN_RES_1080P" },
  { key: "1440p", labelKey: "SETTINGS_SCREEN_RES_1440P" },
  { key: "4k", labelKey: "SETTINGS_SCREEN_RES_4K" },
] as const;

const SCREEN_FRAME_RATE_OPTIONS: readonly {
  key: ScreenShareFrameRate;
  labelKey: TranslationKey;
}[] = [
  { key: "15", labelKey: "SETTINGS_SCREEN_FPS_15" },
  { key: "30", labelKey: "SETTINGS_SCREEN_FPS_30" },
  { key: "60", labelKey: "SETTINGS_SCREEN_FPS_60" },
  { key: "120", labelKey: "SETTINGS_SCREEN_FPS_120" },
  { key: "144", labelKey: "SETTINGS_SCREEN_FPS_144" },
] as const;

const BANDWIDTH_MODE_OPTIONS: readonly { key: BandwidthMode; labelKey: TranslationKey }[] = [
  { key: "conservative", labelKey: "SETTINGS_SCREEN_BW_CONSERVATIVE" },
  { key: "balanced", labelKey: "SETTINGS_SCREEN_BW_BALANCED" },
  { key: "aggressive", labelKey: "SETTINGS_SCREEN_BW_AGGRESSIVE" },
] as const;

/** Resolution to display constraints mapping */
const RESOLUTION_CONSTRAINTS: Record<
  ScreenShareResolution,
  { width: { ideal: number }; height: { ideal: number } }
> = {
  "720p": { width: { ideal: 1280 }, height: { ideal: 720 } },
  "1080p": { width: { ideal: 1920 }, height: { ideal: 1080 } },
  "1440p": { width: { ideal: 2560 }, height: { ideal: 1440 } },
  "4k": { width: { ideal: 3840 }, height: { ideal: 2160 } },
};

const ScreenSharePreview = memo(function ScreenSharePreview({
  resolution,
  frameRate,
  captureAudio,
}: {
  resolution: ScreenShareResolution;
  frameRate: ScreenShareFrameRate;
  captureAudio: boolean;
}) {
  const { t } = useAppContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Store latest settings in ref so constraints function always reads fresh values
  const settingsRef = useRef({ resolution, frameRate, captureAudio });
  useEffect(() => {
    settingsRef.current = { resolution, frameRate, captureAudio };
  }, [resolution, frameRate, captureAudio]);

  // Use centralized media access hook with screen type
  const { stream, isActive, error, start, stop } = useMediaStream({
    type: "screen",
    source: "Screen Sharing Settings",
    constraints: useCallback(
      () => ({
        video: {
          ...RESOLUTION_CONSTRAINTS[settingsRef.current.resolution],
          frameRate: { ideal: parseInt(settingsRef.current.frameRate) },
        },
        audio: settingsRef.current.captureAudio,
      }),
      []
    ),
  });

  // Sync stream to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Derive actual resolution and frame rate from stream
  const streamInfo = getStreamInfo(stream);

  // Track whether stream was active to know if we need to restart
  const wasActiveRef = useRef(false);
  useEffect(() => {
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Track previous settings to detect changes
  const prevSettingsRef = useRef({ resolution, frameRate, captureAudio });

  // Restart stream when settings change (only if currently active)
  useEffect(() => {
    const prev = prevSettingsRef.current;
    const videoChanged = prev.resolution !== resolution || prev.frameRate !== frameRate;
    const audioEnabled = !prev.captureAudio && captureAudio;
    const audioDisabled = prev.captureAudio && !captureAudio;

    prevSettingsRef.current = { resolution, frameRate, captureAudio };

    if (!wasActiveRef.current || !stream) return;

    // Video settings changed or audio enabled: must restart (shows picker)
    if (videoChanged || audioEnabled) {
      stop();
      start();
    }
    // Audio disabled: just stop audio tracks, no restart needed
    else if (audioDisabled) {
      stream.getAudioTracks().forEach((track) => track.stop());
    }
  }, [resolution, frameRate, captureAudio, stop, start, stream]);

  const handleClick = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }, [isActive, start, stop]);

  const handleFullscreen = useCallback(() => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  }, []);

  return (
    <Card className="overflow-hidden p-0" variant="secondary">
      <Card.Content className="relative aspect-video p-0">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
            <Button variant="primary" onPress={handleClick}>
              <Display className="size-4" />
              {t("SETTINGS_SCREEN_START_PREVIEW")}
            </Button>
          </div>
        )}
        {isActive && (
          <>
            {streamInfo && (
              <div className="absolute top-2 left-2 flex gap-2">
                <Chip size="sm" className="px-2">
                  <Display className="size-3" />
                  {streamInfo.resolution}
                </Chip>
                {streamInfo.fps && (
                  <Chip size="sm" className="px-2">
                    <CirclePlay className="size-3" />
                    {streamInfo.fps} fps
                  </Chip>
                )}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <Button variant="tertiary" size="sm" onPress={handleClick}>
                {t("SETTINGS_SCREEN_STOP_PREVIEW")}
              </Button>
            </div>
            <div className="absolute right-2 bottom-2">
              <Button variant="tertiary" size="sm" isIconOnly onPress={handleFullscreen}>
                <ArrowsExpand className="size-4" />
              </Button>
            </div>
          </>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary/90">
            <span className="text-sm text-danger">{error.message}</span>
          </div>
        )}
      </Card.Content>
    </Card>
  );
});

export const ScreenSharingSection = memo(function ScreenSharingSection() {
  const { t } = useAppContext();
  const { supportsSystemAudioCapture } = usePlatform();

  // Load config once on mount (lazy initializer)
  const [initialConfig] = useState(getScreenConfig);

  // Settings with persistence
  const [resolution, setResolution] = usePersistedSetting(
    initialConfig.resolution,
    useCallback((v: ScreenShareResolution) => updateScreenConfig("resolution", v), [])
  );
  const [frameRate, setFrameRate] = usePersistedSetting(
    initialConfig.frameRate,
    useCallback((v: ScreenShareFrameRate) => updateScreenConfig("frameRate", v), [])
  );
  const [captureSystemAudio, setCaptureSystemAudio] = usePersistedSetting(
    initialConfig.captureSystemAudio,
    useCallback((v: boolean) => updateScreenConfig("captureSystemAudio", v), [])
  );
  const [bandwidthMode, setBandwidthMode] = usePersistedSetting(
    initialConfig.bandwidthMode,
    useCallback((v: BandwidthMode) => updateScreenConfig("bandwidthMode", v), [])
  );
  const [codec, setCodec] = usePersistedSetting(
    initialConfig.codec,
    useCallback((v: VideoCodec) => updateScreenConfig("codec", v), [])
  );

  const { options: resolutionOptions } = useTranslatedOptions(SCREEN_RESOLUTION_OPTIONS);
  const { options: frameRateOptions } = useTranslatedOptions(SCREEN_FRAME_RATE_OPTIONS);
  const { options: bandwidthOptions } = useTranslatedOptions(BANDWIDTH_MODE_OPTIONS);
  const { options: codecOptions } = useTranslatedOptions(VIDEO_CODEC_OPTIONS);

  return (
    <div className="flex flex-col gap-8">
      {/* Capture Settings */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={<Display />} title={t("SETTINGS_SCREEN_SECTION_CAPTURE")} />

        <ScreenSharePreview
          resolution={resolution}
          frameRate={frameRate}
          captureAudio={supportsSystemAudioCapture && captureSystemAudio}
        />

        <SettingSelect
          icon={<Display />}
          label={t("SETTINGS_SCREEN_RESOLUTION")}
          options={resolutionOptions}
          value={resolution}
          onChange={setResolution}
        />

        <SettingSelect
          icon={<CirclePlay />}
          label={t("SETTINGS_SCREEN_FRAME_RATE")}
          options={frameRateOptions}
          value={frameRate}
          onChange={setFrameRate}
        />

        <SettingSwitch
          label={t("SETTINGS_SCREEN_CAPTURE_AUDIO")}
          description={t("SETTINGS_SCREEN_CAPTURE_AUDIO_DESC")}
          isSelected={supportsSystemAudioCapture && captureSystemAudio}
          onChange={setCaptureSystemAudio}
          isDisabled={!supportsSystemAudioCapture}
        />
      </section>

      {/* Advanced */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon={<Gear />} title={t("SETTINGS_SCREEN_SECTION_ADVANCED")} />
        <p className="text-sm text-muted">{t("SETTINGS_SCREEN_ADVANCED_COMING_SOON")}</p>

        <SettingSelect
          icon={<Speedometer />}
          label={t("SETTINGS_SCREEN_BANDWIDTH_MODE")}
          options={bandwidthOptions}
          value={bandwidthMode}
          onChange={setBandwidthMode}
          isDisabled
        />

        <SettingSelect
          icon={<Gear />}
          label={t("SETTINGS_SCREEN_CODEC")}
          options={codecOptions}
          value={codec}
          onChange={setCodec}
          isDisabled
        />
      </section>
    </div>
  );
});
