import { memo, useState, useMemo, useCallback } from "react";
import { Video, Display, CirclePlay, Gear } from "@gravity-ui/icons";
import {
  MediaPreview,
  PermissionAlert,
  SectionHeader,
  SettingSwitch,
  SettingSlider,
  SettingSelect,
} from "@/components/molecules";
import { useAppContext } from "@/context";
import {
  useMediaDevices,
  useMediaPermission,
  usePersistedSetting,
  usePlatform,
  useTranslatedOptions,
} from "@/hooks";
import { getVideoConfig, updateVideoConfig } from "@/config/localStorage";
import { VIDEO_CODEC_OPTIONS } from "@/config/configTypes";
import type { TranslationKey } from "@/i18n/types";
import type { VideoResolution, FrameRate, VideoCodec } from "@/config/configTypes";

const VIDEO_RESOLUTION_OPTIONS: readonly { key: VideoResolution; labelKey: TranslationKey }[] = [
  { key: "480p", labelKey: "SETTINGS_VIDEO_RES_480P" },
  { key: "720p", labelKey: "SETTINGS_VIDEO_RES_720P" },
  { key: "1080p", labelKey: "SETTINGS_VIDEO_RES_1080P" },
  { key: "1440p", labelKey: "SETTINGS_VIDEO_RES_1440P" },
  { key: "4k", labelKey: "SETTINGS_VIDEO_RES_4K" },
] as const;

const FRAME_RATE_OPTIONS: readonly { key: FrameRate; labelKey: TranslationKey }[] = [
  { key: "15", labelKey: "SETTINGS_VIDEO_FPS_15" },
  { key: "24", labelKey: "SETTINGS_VIDEO_FPS_24" },
  { key: "30", labelKey: "SETTINGS_VIDEO_FPS_30" },
  { key: "60", labelKey: "SETTINGS_VIDEO_FPS_60" },
] as const;

/** Resolution to video constraints mapping */
const RESOLUTION_CONSTRAINTS: Record<
  VideoResolution,
  { width: { ideal: number }; height: { ideal: number } }
> = {
  "480p": { width: { ideal: 640 }, height: { ideal: 480 } },
  "720p": { width: { ideal: 1280 }, height: { ideal: 720 } },
  "1080p": { width: { ideal: 1920 }, height: { ideal: 1080 } },
  "1440p": { width: { ideal: 2560 }, height: { ideal: 1440 } },
  "4k": { width: { ideal: 3840 }, height: { ideal: 2160 } },
};

export const VideoSection = memo(function VideoSection() {
  const { t } = useAppContext();
  const { supportsAV1 } = usePlatform();

  // Camera permission
  const {
    permission: cameraPermission,
    isRequesting: isRequestingPermission,
    requestPermission,
    resetPermissions,
    isDisabled,
  } = useMediaPermission("camera");

  const { devices: videoInputDevices } = useMediaDevices({
    kind: "videoinput",
    defaultLabel: t("SETTINGS_VIDEO_DEFAULT_DEVICE"),
  });

  // Load initial config once (lazy initializer reads localStorage only on mount)
  const [initialConfig] = useState(getVideoConfig);

  // Camera settings with persistence
  const [selectedVideoInput, setSelectedVideoInput] = usePersistedSetting(
    initialConfig.videoInputDevice,
    useCallback((v: string) => updateVideoConfig("videoInputDevice", v), [])
  );
  const [videoResolution, setVideoResolution] = usePersistedSetting(
    initialConfig.resolution,
    useCallback((v: VideoResolution) => updateVideoConfig("resolution", v), [])
  );
  const [frameRate, setFrameRate] = usePersistedSetting(
    initialConfig.frameRate,
    useCallback((v: FrameRate) => updateVideoConfig("frameRate", v), [])
  );

  // Advanced video settings with persistence
  const [videoCodec, setVideoCodec] = usePersistedSetting(
    initialConfig.codec,
    useCallback((v: VideoCodec) => updateVideoConfig("codec", v), [])
  );
  const [maxVideoBitrate, setMaxVideoBitrate] = usePersistedSetting(
    initialConfig.maxBitrate,
    useCallback((v: number) => updateVideoConfig("maxBitrate", v), [])
  );
  const [hardwareAcceleration, setHardwareAcceleration] = usePersistedSetting(
    initialConfig.hardwareAcceleration,
    useCallback((v: boolean) => updateVideoConfig("hardwareAcceleration", v), [])
  );
  const [simulcast, setSimulcast] = usePersistedSetting(
    initialConfig.simulcast,
    useCallback((v: boolean) => updateVideoConfig("simulcast", v), [])
  );

  const { options: resolutionOptions } = useTranslatedOptions(VIDEO_RESOLUTION_OPTIONS);
  const { options: fpsOptions } = useTranslatedOptions(FRAME_RATE_OPTIONS);
  const { options: allCodecOptions } = useTranslatedOptions(VIDEO_CODEC_OPTIONS);

  // Filter codec options based on platform support
  const codecOptions = useMemo(() => {
    if (supportsAV1) return allCodecOptions;
    return allCodecOptions.filter((opt) => opt.key !== "av1");
  }, [allCodecOptions, supportsAV1]);

  // Camera constraints for MediaPreview
  const cameraConstraints = useCallback(
    () => ({
      video: {
        deviceId: selectedVideoInput !== "default" ? { exact: selectedVideoInput } : undefined,
        ...RESOLUTION_CONSTRAINTS[videoResolution],
        frameRate: { ideal: parseInt(frameRate) },
      },
    }),
    [selectedVideoInput, videoResolution, frameRate]
  );

  // Restart deps for camera preview
  const cameraRestartDeps = useMemo(
    () => [selectedVideoInput, videoResolution, frameRate],
    [selectedVideoInput, videoResolution, frameRate]
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Permission Alert */}
      <PermissionAlert
        permission={cameraPermission}
        isRequesting={isRequestingPermission}
        onRequestPermission={requestPermission}
        onResetPermissions={resetPermissions}
        titlePrompt={t("SETTINGS_VIDEO_PERMISSION_TITLE")}
        titleDenied={t("SETTINGS_VIDEO_PERMISSION_TITLE")}
        descriptionPrompt={t("SETTINGS_VIDEO_PERMISSION_PROMPT_DESC")}
        descriptionDenied={t("SETTINGS_VIDEO_PERMISSION_DENIED_DESC")}
        allowButtonLabel={t("SETTINGS_VIDEO_PERMISSION_BUTTON")}
        resetButtonLabel={t("SETTINGS_VIDEO_PERMISSION_RESET")}
      />

      {/* Camera */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={<Video />} title={t("SETTINGS_VIDEO_SECTION_CAMERA")} />

        <SettingSelect
          icon={<Video />}
          label={t("SETTINGS_VIDEO_INPUT_DEVICE")}
          options={videoInputDevices}
          value={selectedVideoInput}
          onChange={setSelectedVideoInput}
          isDisabled={isDisabled}
        />

        {!isDisabled && (
          <MediaPreview
            type="camera"
            source="Video Settings"
            constraints={cameraConstraints}
            restartDeps={cameraRestartDeps}
            startLabel="SETTINGS_VIDEO_START_PREVIEW"
            stopLabel="SETTINGS_VIDEO_STOP_PREVIEW"
            startIcon={<Video className="size-4" />}
            objectFit="cover"
          />
        )}

        <SettingSelect
          icon={<Display />}
          label={t("SETTINGS_VIDEO_RESOLUTION")}
          options={resolutionOptions}
          value={videoResolution}
          onChange={setVideoResolution}
          isDisabled={isDisabled}
        />

        <SettingSelect
          icon={<CirclePlay />}
          label={t("SETTINGS_VIDEO_FRAME_RATE")}
          options={fpsOptions}
          value={frameRate}
          onChange={setFrameRate}
          isDisabled={isDisabled}
        />
      </section>

      {/* Advanced */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={<Gear />} title={t("SETTINGS_VIDEO_SECTION_ADVANCED")} />
        <p className="text-sm text-muted">{t("SETTINGS_VIDEO_ADVANCED_COMING_SOON")}</p>

        <SettingSelect
          icon={<Gear />}
          label={t("SETTINGS_VIDEO_CODEC")}
          options={codecOptions}
          value={videoCodec}
          onChange={setVideoCodec}
          isDisabled
        />

        <SettingSlider
          label={t("SETTINGS_VIDEO_MAX_BITRATE")}
          value={maxVideoBitrate}
          onChange={setMaxVideoBitrate}
          minValue={500}
          maxValue={8000}
          step={100}
          formatValue={(v) => `${v} kbps`}
          isDisabled
        />

        <SettingSwitch
          label={t("SETTINGS_VIDEO_HARDWARE_ACCEL")}
          description={t("SETTINGS_VIDEO_HARDWARE_ACCEL_DESC")}
          isSelected={hardwareAcceleration}
          onChange={setHardwareAcceleration}
          isDisabled
        />

        <SettingSwitch
          label={t("SETTINGS_VIDEO_SIMULCAST")}
          description={t("SETTINGS_VIDEO_SIMULCAST_DESC")}
          isSelected={simulcast}
          onChange={setSimulcast}
          isDisabled
        />
      </section>
    </div>
  );
});
