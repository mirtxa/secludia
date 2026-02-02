import { memo, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Video, Display, CirclePlay, Gear } from "@gravity-ui/icons";
import { Button, Card, Chip } from "@heroui/react";
import {
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
  useMediaStream,
  usePlatform,
  useTranslatedOptions,
} from "@/hooks";
import { getVideoConfig, updateVideoConfig } from "@/config/localStorage";
import { VIDEO_CODEC_OPTIONS } from "@/config/configTypes";
import { getStreamInfo } from "@/utils/media";
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

const CameraPreview = memo(function CameraPreview({
  deviceId,
  resolution,
  frameRate,
}: {
  deviceId: string;
  resolution: VideoResolution;
  frameRate: FrameRate;
}) {
  const { t } = useAppContext();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Store latest settings in ref so constraints function always reads fresh values
  const settingsRef = useRef({ deviceId, resolution, frameRate });
  useEffect(() => {
    settingsRef.current = { deviceId, resolution, frameRate };
  }, [deviceId, resolution, frameRate]);

  // Use centralized media access hook - registers with MediaRegistry for privacy indicator
  const { stream, isActive, error, start, stop } = useMediaStream({
    type: "camera",
    source: "Video Settings",
    constraints: useCallback(
      () => ({
        video: {
          deviceId:
            settingsRef.current.deviceId !== "default"
              ? { exact: settingsRef.current.deviceId }
              : undefined,
          ...RESOLUTION_CONSTRAINTS[settingsRef.current.resolution],
          frameRate: { ideal: parseInt(settingsRef.current.frameRate) },
        },
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

  // Derive actual resolution and frame rate from stream (computed during render)
  const streamInfo = getStreamInfo(stream);

  // Track whether stream was active to know if we need to restart
  const wasActiveRef = useRef(false);
  useEffect(() => {
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Track previous settings to detect changes
  const prevSettingsRef = useRef({ deviceId, resolution, frameRate });

  // Restart stream when settings change (only if currently active)
  useEffect(() => {
    const prev = prevSettingsRef.current;
    const changed =
      prev.deviceId !== deviceId || prev.resolution !== resolution || prev.frameRate !== frameRate;

    prevSettingsRef.current = { deviceId, resolution, frameRate };

    // Restart with new settings if stream was active
    if (changed && wasActiveRef.current) {
      stop();
      start();
    }
  }, [deviceId, resolution, frameRate, stop, start]);

  const handleClick = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }, [isActive, start, stop]);

  return (
    <Card className="overflow-hidden p-0" variant="secondary">
      <Card.Content className="relative aspect-video p-0">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
            <Button variant="primary" onPress={handleClick}>
              <Video className="size-4" />
              {t("SETTINGS_VIDEO_START_PREVIEW")}
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
                {t("SETTINGS_VIDEO_STOP_PREVIEW")}
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

  // Camera settings
  const [selectedVideoInput, setSelectedVideoInput] = useState(initialConfig.videoInputDevice);
  const [videoResolution, setVideoResolution] = useState(initialConfig.resolution);
  const [frameRate, setFrameRate] = useState(initialConfig.frameRate);

  // Advanced video settings
  const [videoCodec, setVideoCodec] = useState(initialConfig.codec);
  const [maxVideoBitrate, setMaxVideoBitrate] = useState(initialConfig.maxBitrate);
  const [hardwareAcceleration, setHardwareAcceleration] = useState(
    initialConfig.hardwareAcceleration
  );
  const [simulcast, setSimulcast] = useState(initialConfig.simulcast);

  // Persist settings to localStorage
  const handleVideoInputChange = useCallback((value: string) => {
    setSelectedVideoInput(value);
    updateVideoConfig("videoInputDevice", value);
  }, []);

  const handleResolutionChange = useCallback((value: VideoResolution) => {
    setVideoResolution(value);
    updateVideoConfig("resolution", value);
  }, []);

  const handleFrameRateChange = useCallback((value: FrameRate) => {
    setFrameRate(value);
    updateVideoConfig("frameRate", value);
  }, []);

  const handleCodecChange = useCallback((value: VideoCodec) => {
    setVideoCodec(value);
    updateVideoConfig("codec", value);
  }, []);

  const handleMaxBitrateChange = useCallback((value: number) => {
    setMaxVideoBitrate(value);
    updateVideoConfig("maxBitrate", value);
  }, []);

  const handleHardwareAccelerationChange = useCallback((value: boolean) => {
    setHardwareAcceleration(value);
    updateVideoConfig("hardwareAcceleration", value);
  }, []);

  const handleSimulcastChange = useCallback((value: boolean) => {
    setSimulcast(value);
    updateVideoConfig("simulcast", value);
  }, []);

  const { options: resolutionOptions } = useTranslatedOptions(VIDEO_RESOLUTION_OPTIONS);
  const { options: fpsOptions } = useTranslatedOptions(FRAME_RATE_OPTIONS);
  const { options: allCodecOptions } = useTranslatedOptions(VIDEO_CODEC_OPTIONS);

  // Filter codec options based on platform support
  const codecOptions = useMemo(() => {
    if (supportsAV1) return allCodecOptions;
    return allCodecOptions.filter((opt) => opt.key !== "av1");
  }, [allCodecOptions, supportsAV1]);

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
          onChange={handleVideoInputChange}
          isDisabled={isDisabled}
        />

        {!isDisabled && (
          <CameraPreview
            deviceId={selectedVideoInput}
            resolution={videoResolution}
            frameRate={frameRate}
          />
        )}

        <SettingSelect
          icon={<Display />}
          label={t("SETTINGS_VIDEO_RESOLUTION")}
          options={resolutionOptions}
          value={videoResolution}
          onChange={handleResolutionChange}
          isDisabled={isDisabled}
        />

        <SettingSelect
          icon={<CirclePlay />}
          label={t("SETTINGS_VIDEO_FRAME_RATE")}
          options={fpsOptions}
          value={frameRate}
          onChange={handleFrameRateChange}
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
          onChange={handleCodecChange}
          isDisabled
        />

        <SettingSlider
          label={t("SETTINGS_VIDEO_MAX_BITRATE")}
          value={maxVideoBitrate}
          onChange={handleMaxBitrateChange}
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
          onChange={handleHardwareAccelerationChange}
          isDisabled
        />

        <SettingSwitch
          label={t("SETTINGS_VIDEO_SIMULCAST")}
          description={t("SETTINGS_VIDEO_SIMULCAST_DESC")}
          isSelected={simulcast}
          onChange={handleSimulcastChange}
          isDisabled
        />
      </section>
    </div>
  );
});
