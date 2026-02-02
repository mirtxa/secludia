import type { SecludiaConfig, VoiceConfig } from "./configTypes";

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  audioInputDevice: "default",
  inputVolume: 100,
  echoCancellation: false,
  inputSensitivity: -70,
  noiseSuppressionEnabled: true,
  audioBitrate: 128,
};

export const DEFAULT_CONFIG: SecludiaConfig = {
  theme: "default",
  language: "en",
  notificationPromptStatus: "pending",
  toastDuration: 5,
  voice: DEFAULT_VOICE_CONFIG,
};
