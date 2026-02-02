import type { AvailableLanguage } from "@/i18n";
import type { TranslationKey } from "@/i18n/types";

export type SecludiaTheme =
  | "default"
  | "default-dark"
  | "familiar"
  | "midnight"
  | "sunset"
  | "mint";

export type SecludiaLanguage = AvailableLanguage;

/** Status of the app's notification onboarding prompt (not the browser permission) */
export type NotificationPromptStatus = "pending" | "granted" | "dismissed";

export interface VoiceConfig {
  audioInputDevice: string;
  inputVolume: number; // 0-100
  echoCancellation: boolean;
  inputSensitivity: number; // -100 to 0 dB
  noiseSuppressionEnabled: boolean;
  audioBitrate: number; // 32-256 kbps
}

export type VideoResolution = "480p" | "720p" | "1080p" | "1440p" | "4k";
export type FrameRate = "15" | "24" | "30" | "60";
export type VideoCodec = "vp8" | "vp9" | "h264" | "av1";

export interface VideoConfig {
  videoInputDevice: string;
  resolution: VideoResolution;
  frameRate: FrameRate;
  codec: VideoCodec;
  maxBitrate: number; // 500-8000 kbps
  hardwareAcceleration: boolean;
  simulcast: boolean;
}

export interface SecludiaConfig {
  theme: SecludiaTheme;
  language: SecludiaLanguage;
  /** Whether user has seen/interacted with the notification onboarding prompt */
  notificationPromptStatus: NotificationPromptStatus;
  toastDuration: number;
  voice: VoiceConfig;
  video: VideoConfig;
}

export const THEME_OPTIONS: { key: SecludiaTheme; labelKey: TranslationKey }[] = [
  { key: "default", labelKey: "SETTINGS_THEME_DEFAULT" },
  { key: "default-dark", labelKey: "SETTINGS_THEME_DEFAULT_DARK" },
  { key: "familiar", labelKey: "SETTINGS_THEME_FAMILIAR" },
  { key: "midnight", labelKey: "SETTINGS_THEME_MIDNIGHT" },
  { key: "sunset", labelKey: "SETTINGS_THEME_SUNSET" },
  { key: "mint", labelKey: "SETTINGS_THEME_MINT" },
];
