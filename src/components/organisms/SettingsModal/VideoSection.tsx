import { memo, useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Video, Display, CirclePlay, Gear, CircleStop } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { SectionHeader, SettingSwitch, SettingSlider, SettingSelect } from "@/components/molecules";
import { useAppContext } from "@/context";
import { useMediaDevices, usePlatform, useTranslatedOptions } from "@/hooks";
import type { TranslationKey } from "@/i18n/types";
import { stopMediaStream } from "@/utils";

type VideoResolution = "720p" | "1080p" | "1440p" | "4k";
type FrameRate = "30" | "60";
type BackgroundBlur = "off" | "light" | "strong";
type VideoCodec = "vp8" | "vp9" | "h264" | "av1";

const VIDEO_RESOLUTION_OPTIONS: readonly { key: VideoResolution; labelKey: TranslationKey }[] = [
  { key: "720p", labelKey: "SETTINGS_VIDEO_RES_720P" },
  { key: "1080p", labelKey: "SETTINGS_VIDEO_RES_1080P" },
  { key: "1440p", labelKey: "SETTINGS_VIDEO_RES_1440P" },
  { key: "4k", labelKey: "SETTINGS_VIDEO_RES_4K" },
] as const;

const FRAME_RATE_OPTIONS: readonly { key: FrameRate; labelKey: TranslationKey }[] = [
  { key: "30", labelKey: "SETTINGS_VIDEO_FPS_30" },
  { key: "60", labelKey: "SETTINGS_VIDEO_FPS_60" },
] as const;

const BACKGROUND_BLUR_OPTIONS: readonly { key: BackgroundBlur; labelKey: TranslationKey }[] = [
  { key: "off", labelKey: "SETTINGS_VIDEO_BLUR_OFF" },
  { key: "light", labelKey: "SETTINGS_VIDEO_BLUR_LIGHT" },
  { key: "strong", labelKey: "SETTINGS_VIDEO_BLUR_STRONG" },
] as const;

const VIDEO_CODEC_OPTIONS: readonly { key: VideoCodec; labelKey: TranslationKey }[] = [
  { key: "vp8", labelKey: "SETTINGS_VIDEO_CODEC_VP8" },
  { key: "vp9", labelKey: "SETTINGS_VIDEO_CODEC_VP9" },
  { key: "h264", labelKey: "SETTINGS_VIDEO_CODEC_H264" },
  { key: "av1", labelKey: "SETTINGS_VIDEO_CODEC_AV1" },
] as const;

const CameraPreview = memo(function CameraPreview({
  deviceId,
  isMirrored,
  resolution,
  frameRate,
  startLabel,
  stopLabel,
}: {
  deviceId: string;
  isMirrored: boolean;
  resolution: VideoResolution;
  frameRate: FrameRate;
  startLabel: string;
  stopLabel: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getResolutionConstraints = useCallback((res: VideoResolution) => {
    switch (res) {
      case "720p":
        return { width: { ideal: 1280 }, height: { ideal: 720 } };
      case "1080p":
        return { width: { ideal: 1920 }, height: { ideal: 1080 } };
      case "1440p":
        return { width: { ideal: 2560 }, height: { ideal: 1440 } };
      case "4k":
        return { width: { ideal: 3840 }, height: { ideal: 2160 } };
    }
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current = stopMediaStream(streamRef.current);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startStream = useCallback(async () => {
    setError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId !== "default" ? { exact: deviceId } : undefined,
          ...getResolutionConstraints(resolution),
          frameRate: { ideal: parseInt(frameRate) },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
    } catch (err) {
      console.error("Failed to access camera:", err);
      setError(err instanceof Error ? err.message : "Failed to access camera");
    }
  }, [deviceId, resolution, frameRate, getResolutionConstraints]);

  const toggleStream = useCallback(() => {
    if (isStreaming) {
      stopStream();
    } else {
      startStream();
    }
  }, [isStreaming, startStream, stopStream]);

  // Stop stream on unmount
  useEffect(() => {
    return () => {
      stopMediaStream(streamRef.current);
    };
  }, []);

  // Track previous settings to detect changes
  const prevSettingsRef = useRef({ deviceId, resolution, frameRate });

  // Restart stream when settings change (only if currently streaming)
  useEffect(() => {
    const prevSettings = prevSettingsRef.current;
    const settingsChanged =
      prevSettings.deviceId !== deviceId ||
      prevSettings.resolution !== resolution ||
      prevSettings.frameRate !== frameRate;

    prevSettingsRef.current = { deviceId, resolution, frameRate };

    if (settingsChanged && streamRef.current) {
      // Stop current stream
      streamRef.current = stopMediaStream(streamRef.current);

      // Restart with new settings
      const restartStream = async () => {
        try {
          const constraints: MediaStreamConstraints = {
            video: {
              deviceId: deviceId !== "default" ? { exact: deviceId } : undefined,
              ...getResolutionConstraints(resolution),
              frameRate: { ideal: parseInt(frameRate) },
            },
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Failed to restart camera:", err);
        }
      };

      restartStream();
    }
  }, [deviceId, resolution, frameRate, getResolutionConstraints]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-video w-full object-cover"
          style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
        />
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <Video className="size-12 text-muted" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/90">
            <span className="text-sm text-danger">{error}</span>
          </div>
        )}
      </div>
      <Button variant="ghost" className="w-fit" onPress={toggleStream}>
        {isStreaming ? (
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

export const VideoSection = memo(function VideoSection() {
  const { t } = useAppContext();
  const { supportsAV1, supportsBackgroundBlur, platform } = usePlatform();

  const { devices: videoInputDevices } = useMediaDevices({
    kind: "videoinput",
    defaultLabel: t("SETTINGS_VIDEO_DEFAULT_DEVICE"),
  });

  // Camera settings
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("default");
  const [videoResolution, setVideoResolution] = useState<VideoResolution>("1080p");
  const [frameRate, setFrameRate] = useState<FrameRate>("30");
  const [mirrorVideo, setMirrorVideo] = useState<boolean>(true);
  const [lowLightAdjustment, setLowLightAdjustment] = useState<boolean>(false);
  const [backgroundBlur, setBackgroundBlur] = useState<BackgroundBlur>("off");

  // Advanced video settings - default to H.264 on Mac for better hardware support
  const [videoCodec, setVideoCodec] = useState<VideoCodec>(platform === "macos" ? "h264" : "vp9");
  const [maxVideoBitrate, setMaxVideoBitrate] = useState<number>(2500);
  const [hardwareAcceleration, setHardwareAcceleration] = useState<boolean>(true);
  const [simulcast, setSimulcast] = useState<boolean>(true);

  const { options: resolutionOptions } = useTranslatedOptions(VIDEO_RESOLUTION_OPTIONS);
  const { options: fpsOptions } = useTranslatedOptions(FRAME_RATE_OPTIONS);
  const { options: blurOptions } = useTranslatedOptions(BACKGROUND_BLUR_OPTIONS);
  const { options: allCodecOptions } = useTranslatedOptions(VIDEO_CODEC_OPTIONS);

  // Filter codec options based on platform support
  const codecOptions = useMemo(() => {
    if (supportsAV1) return allCodecOptions;
    return allCodecOptions.filter((opt) => opt.key !== "av1");
  }, [allCodecOptions, supportsAV1]);

  return (
    <div className="flex flex-col gap-8">
      {/* Camera */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon={<Video />} title={t("SETTINGS_VIDEO_SECTION_CAMERA")} />

        <SettingSelect
          icon={<Video />}
          label={t("SETTINGS_VIDEO_INPUT_DEVICE")}
          options={videoInputDevices}
          value={selectedVideoInput}
          onChange={setSelectedVideoInput}
        />

        <SettingSelect
          icon={<Display />}
          label={t("SETTINGS_VIDEO_RESOLUTION")}
          options={resolutionOptions}
          value={videoResolution}
          onChange={setVideoResolution}
        />

        <SettingSelect
          icon={<CirclePlay />}
          label={t("SETTINGS_VIDEO_FRAME_RATE")}
          options={fpsOptions}
          value={frameRate}
          onChange={setFrameRate}
        />

        <SettingSwitch
          label={t("SETTINGS_VIDEO_MIRROR")}
          description={t("SETTINGS_VIDEO_MIRROR_DESC")}
          isSelected={mirrorVideo}
          onChange={setMirrorVideo}
        />

        <SettingSwitch
          label={t("SETTINGS_VIDEO_LOW_LIGHT")}
          description={t("SETTINGS_VIDEO_LOW_LIGHT_DESC")}
          isSelected={lowLightAdjustment}
          onChange={setLowLightAdjustment}
        />

        {supportsBackgroundBlur && (
          <SettingSelect
            icon={<Display />}
            label={t("SETTINGS_VIDEO_BACKGROUND_BLUR")}
            options={blurOptions}
            value={backgroundBlur}
            onChange={setBackgroundBlur}
          />
        )}

        <CameraPreview
          deviceId={selectedVideoInput}
          isMirrored={mirrorVideo}
          resolution={videoResolution}
          frameRate={frameRate}
          startLabel={t("SETTINGS_VIDEO_START_PREVIEW")}
          stopLabel={t("SETTINGS_VIDEO_STOP_PREVIEW")}
        />
      </section>

      {/* Advanced */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon={<Gear />} title={t("SETTINGS_VIDEO_SECTION_ADVANCED")} />

        <SettingSelect
          icon={<Gear />}
          label={t("SETTINGS_VIDEO_CODEC")}
          options={codecOptions}
          value={videoCodec}
          onChange={setVideoCodec}
        />

        <SettingSlider
          label={t("SETTINGS_VIDEO_MAX_BITRATE")}
          value={maxVideoBitrate}
          onChange={setMaxVideoBitrate}
          minValue={500}
          maxValue={8000}
          step={100}
          formatValue={(v) => `${v} kbps`}
        />

        <SettingSwitch
          label={t("SETTINGS_VIDEO_HARDWARE_ACCEL")}
          description={t("SETTINGS_VIDEO_HARDWARE_ACCEL_DESC")}
          isSelected={hardwareAcceleration}
          onChange={setHardwareAcceleration}
        />

        <SettingSwitch
          label={t("SETTINGS_VIDEO_SIMULCAST")}
          description={t("SETTINGS_VIDEO_SIMULCAST_DESC")}
          isSelected={simulcast}
          onChange={setSimulcast}
        />
      </section>
    </div>
  );
});
