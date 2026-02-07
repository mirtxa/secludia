import { memo, useCallback, useMemo, useState } from "react";
import { CirclePlay, Display, Gear, Speedometer } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { usePersistedSetting, usePlatform, useTranslatedOptions } from "@/hooks";
import { MediaPreview, SectionHeader, SettingSwitch, SettingSelect } from "@/components/molecules";
import { getScreenConfig, updateScreenConfig } from "@/config/localStorage";
import { VIDEO_CODEC_OPTIONS } from "@/config/configTypes";
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

  const effectiveCaptureAudio = supportsSystemAudioCapture && captureSystemAudio;

  // Screen share constraints
  const screenConstraints = useCallback(
    () => ({
      video: {
        ...RESOLUTION_CONSTRAINTS[resolution],
        frameRate: { ideal: parseInt(frameRate) },
      },
      audio: effectiveCaptureAudio,
    }),
    [resolution, frameRate, effectiveCaptureAudio]
  );

  // Restart deps for screen share preview
  const screenRestartDeps = useMemo(
    () => [resolution, frameRate, effectiveCaptureAudio],
    [resolution, frameRate, effectiveCaptureAudio]
  );

  // Handle audio track changes without full restart (avoids re-showing screen picker)
  const handleAudioTrackChange = useCallback((stream: MediaStream, enabled: boolean) => {
    if (!enabled) {
      // Audio disabled: just stop audio tracks, no restart needed
      stream.getAudioTracks().forEach((track) => track.stop());
      return true;
    }
    // Audio enabled: need full restart (getDisplayMedia must be called with audio)
    return false;
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Capture Settings */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={<Display />} title={t("SETTINGS_SCREEN_SECTION_CAPTURE")} />

        <MediaPreview
          type="screen"
          source="Screen Sharing Settings"
          constraints={screenConstraints}
          restartDeps={screenRestartDeps}
          startLabel="SETTINGS_SCREEN_START_PREVIEW"
          stopLabel="SETTINGS_SCREEN_STOP_PREVIEW"
          startIcon={<Display className="size-4" />}
          objectFit="contain"
          showFullscreenButton
          onAudioTrackChange={handleAudioTrackChange}
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
