import type {
  SecludiaConfig,
  SecludiaTheme,
  SecludiaLanguage,
  NotificationPromptStatus,
  VoiceConfig,
} from "./configTypes";
import { THEME_OPTIONS } from "./configTypes";
import { DEFAULT_CONFIG, DEFAULT_VOICE_CONFIG } from "./defaultConfig";
import { AVAILABLE_LANGUAGES } from "@/i18n";

const STORAGE_KEY = "secludia.config";

/** Valid notification prompt status values */
const VALID_NOTIFICATION_PROMPT_STATUSES: NotificationPromptStatus[] = [
  "pending",
  "granted",
  "dismissed",
];

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
