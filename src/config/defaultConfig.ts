import type { SecludiaConfig, VoiceConfig, VideoConfig } from "./configTypes";

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  audioInputDevice: "default",
  inputVolume: 100,
  echoCancellation: false,
  inputSensitivity: -70,
  noiseSuppressionEnabled: true,
  audioBitrate: 128,
};

export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  videoInputDevice: "default",
  resolution: "1080p",
  frameRate: "30",
  codec: "vp9",
  maxBitrate: 2500,
  hardwareAcceleration: true,
  simulcast: true,
};

export const DEFAULT_CONFIG: SecludiaConfig = {
  theme: "default",
  language: "en",
  notificationPromptStatus: "pending",
  toastDuration: 5,
  voice: DEFAULT_VOICE_CONFIG,
  video: DEFAULT_VIDEO_CONFIG,
};
