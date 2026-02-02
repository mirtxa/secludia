import type {
  SecludiaConfig,
  SecludiaTheme,
  SecludiaLanguage,
  NotificationPromptStatus,
  VoiceConfig,
  VideoConfig,
  VideoResolution,
  FrameRate,
  BackgroundBlur,
  VideoCodec,
} from "./configTypes";
import { THEME_OPTIONS } from "./configTypes";
import { DEFAULT_CONFIG, DEFAULT_VOICE_CONFIG, DEFAULT_VIDEO_CONFIG } from "./defaultConfig";
import { AVAILABLE_LANGUAGES } from "@/i18n";

const STORAGE_KEY = "secludia.config";

/** Valid notification prompt status values */
const VALID_NOTIFICATION_PROMPT_STATUSES: NotificationPromptStatus[] = [
  "pending",
  "granted",
  "dismissed",
];

/** Valid video resolution values */
const VALID_RESOLUTIONS: VideoResolution[] = ["720p", "1080p", "1440p", "4k"];

/** Valid frame rate values */
const VALID_FRAME_RATES: FrameRate[] = ["30", "60"];

/** Valid background blur values */
const VALID_BACKGROUND_BLUR: BackgroundBlur[] = ["off", "light", "strong"];

/** Valid video codec values */
const VALID_CODECS: VideoCodec[] = ["vp8", "vp9", "h264", "av1"];

/**
 * Validates and sanitizes video config.
 */
function validateVideoConfig(data: unknown): VideoConfig {
  if (!data || typeof data !== "object") {
    return DEFAULT_VIDEO_CONFIG;
  }

  const video = data as Record<string, unknown>;

  return {
    videoInputDevice:
      typeof video.videoInputDevice === "string" && video.videoInputDevice.length > 0
        ? video.videoInputDevice
        : DEFAULT_VIDEO_CONFIG.videoInputDevice,
    resolution: VALID_RESOLUTIONS.includes(video.resolution as VideoResolution)
      ? (video.resolution as VideoResolution)
      : DEFAULT_VIDEO_CONFIG.resolution,
    frameRate: VALID_FRAME_RATES.includes(video.frameRate as FrameRate)
      ? (video.frameRate as FrameRate)
      : DEFAULT_VIDEO_CONFIG.frameRate,
    mirrorVideo:
      typeof video.mirrorVideo === "boolean" ? video.mirrorVideo : DEFAULT_VIDEO_CONFIG.mirrorVideo,
    lowLightAdjustment:
      typeof video.lowLightAdjustment === "boolean"
        ? video.lowLightAdjustment
        : DEFAULT_VIDEO_CONFIG.lowLightAdjustment,
    backgroundBlur: VALID_BACKGROUND_BLUR.includes(video.backgroundBlur as BackgroundBlur)
      ? (video.backgroundBlur as BackgroundBlur)
      : DEFAULT_VIDEO_CONFIG.backgroundBlur,
    codec: VALID_CODECS.includes(video.codec as VideoCodec)
      ? (video.codec as VideoCodec)
      : DEFAULT_VIDEO_CONFIG.codec,
    maxBitrate:
      typeof video.maxBitrate === "number" && video.maxBitrate >= 500 && video.maxBitrate <= 8000
        ? video.maxBitrate
        : DEFAULT_VIDEO_CONFIG.maxBitrate,
    hardwareAcceleration:
      typeof video.hardwareAcceleration === "boolean"
        ? video.hardwareAcceleration
        : DEFAULT_VIDEO_CONFIG.hardwareAcceleration,
    simulcast:
      typeof video.simulcast === "boolean" ? video.simulcast : DEFAULT_VIDEO_CONFIG.simulcast,
  };
}

/**
 * Validates and sanitizes voice config.
 */
function validateVoiceConfig(data: unknown): VoiceConfig {
  if (!data || typeof data !== "object") {
    return DEFAULT_VOICE_CONFIG;
  }

  const voice = data as Record<string, unknown>;

  return {
    audioInputDevice:
      typeof voice.audioInputDevice === "string" && voice.audioInputDevice.length > 0
        ? voice.audioInputDevice
        : DEFAULT_VOICE_CONFIG.audioInputDevice,
    inputVolume:
      typeof voice.inputVolume === "number" && voice.inputVolume >= 0 && voice.inputVolume <= 100
        ? voice.inputVolume
        : DEFAULT_VOICE_CONFIG.inputVolume,
    echoCancellation:
      typeof voice.echoCancellation === "boolean"
        ? voice.echoCancellation
        : DEFAULT_VOICE_CONFIG.echoCancellation,
    inputSensitivity:
      typeof voice.inputSensitivity === "number" &&
      voice.inputSensitivity >= -100 &&
      voice.inputSensitivity <= 0
        ? voice.inputSensitivity
        : DEFAULT_VOICE_CONFIG.inputSensitivity,
    noiseSuppressionEnabled:
      typeof voice.noiseSuppressionEnabled === "boolean"
        ? voice.noiseSuppressionEnabled
        : DEFAULT_VOICE_CONFIG.noiseSuppressionEnabled,
    audioBitrate:
      typeof voice.audioBitrate === "number" &&
      voice.audioBitrate >= 32 &&
      voice.audioBitrate <= 256
        ? voice.audioBitrate
        : DEFAULT_VOICE_CONFIG.audioBitrate,
  };
}

/**
 * Validates and sanitizes a config object loaded from localStorage.
 * Returns a valid config, falling back to defaults for invalid values.
 */
function validateConfig(data: unknown): SecludiaConfig {
  if (!data || typeof data !== "object") {
    return DEFAULT_CONFIG;
  }

  const config = data as Record<string, unknown>;
  const validThemes = THEME_OPTIONS.map((t) => t.key);

  return {
    theme: validThemes.includes(config.theme as SecludiaTheme)
      ? (config.theme as SecludiaTheme)
      : DEFAULT_CONFIG.theme,
    language: AVAILABLE_LANGUAGES.includes(config.language as SecludiaLanguage)
      ? (config.language as SecludiaLanguage)
      : DEFAULT_CONFIG.language,
    notificationPromptStatus: VALID_NOTIFICATION_PROMPT_STATUSES.includes(
      config.notificationPromptStatus as NotificationPromptStatus
    )
      ? (config.notificationPromptStatus as NotificationPromptStatus)
      : DEFAULT_CONFIG.notificationPromptStatus,
    toastDuration:
      typeof config.toastDuration === "number" &&
      config.toastDuration >= 1 &&
      config.toastDuration <= 15
        ? config.toastDuration
        : DEFAULT_CONFIG.toastDuration,
    voice: validateVoiceConfig(config.voice),
    video: validateVideoConfig(config.video),
  };
}

export function loadConfig(): SecludiaConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_CONFIG;
    const parsed = JSON.parse(stored);
    return validateConfig(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: SecludiaConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function updateConfig<K extends keyof SecludiaConfig>(key: K, value: SecludiaConfig[K]): void {
  const config = loadConfig();
  saveConfig({ ...config, [key]: value });
}

export function updateTheme(theme: SecludiaTheme): void {
  updateConfig("theme", theme);
}

export function updateLanguage(language: SecludiaLanguage): void {
  updateConfig("language", language);
}

export function updateNotificationPromptStatus(status: NotificationPromptStatus): void {
  updateConfig("notificationPromptStatus", status);
}

export function getNotificationPromptStatus(): NotificationPromptStatus {
  return loadConfig().notificationPromptStatus;
}

export function updateToastDuration(duration: number): void {
  updateConfig("toastDuration", duration);
}

export function getToastDuration(): number {
  return loadConfig().toastDuration ?? 5;
}

// Voice config helpers
export function getVoiceConfig(): VoiceConfig {
  return loadConfig().voice;
}

export function updateVoiceConfig<K extends keyof VoiceConfig>(
  key: K,
  value: VoiceConfig[K]
): void {
  const config = loadConfig();
  saveConfig({
    ...config,
    voice: { ...config.voice, [key]: value },
  });
}

// Video config helpers
export function getVideoConfig(): VideoConfig {
  return loadConfig().video;
}

export function updateVideoConfig<K extends keyof VideoConfig>(
  key: K,
  value: VideoConfig[K]
): void {
  const config = loadConfig();
  saveConfig({
    ...config,
    video: { ...config.video, [key]: value },
  });
}
