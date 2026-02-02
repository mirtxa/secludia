import { useState, useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";

export type Platform = "windows" | "macos" | "linux" | "android" | "ios" | "web";

export interface PlatformInfo {
  /** The operating system platform */
  platform: Platform;
  /** Whether running in Tauri desktop app */
  isTauri: boolean;
  /** Whether platform detection is complete */
  isReady: boolean;

  // Media capability flags
  /** setSinkId() for selecting audio output devices - limited on Safari/WebKit */
  supportsAudioOutputSelection: boolean;
  /** getDisplayMedia() with system audio - mainly Windows Chrome/Edge */
  supportsSystemAudioCapture: boolean;
  /** Hardware H.264 encoding/decoding support */
  supportsHardwareH264: boolean;
  /** Hardware VP9 encoding/decoding support */
  supportsHardwareVP9: boolean;
  /** AV1 codec support */
  supportsAV1: boolean;
}

/**
 * Detects platform from browser user agent (fallback for web)
 */
function detectPlatformFromUserAgent(): Platform {
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) return "ios";
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux")) return "linux";

  return "web";
}

/**
 * Detects browser engine for feature detection
 */
function detectBrowser(): "chromium" | "firefox" | "safari" | "unknown" {
  const ua = navigator.userAgent.toLowerCase();

  // Check for Chromium-based browsers (Chrome, Edge, Opera, etc.)
  if (ua.includes("chrome") || ua.includes("chromium") || ua.includes("edg")) {
    return "chromium";
  }
  // Check for Firefox
  if (ua.includes("firefox")) {
    return "firefox";
  }
  // Check for Safari (but not Chrome on iOS which also has Safari in UA)
  if (ua.includes("safari") && !ua.includes("chrome")) {
    return "safari";
  }

  return "unknown";
}

/**
 * Determines media capabilities based on platform and browser
 */
function getMediaCapabilities(
  platform: Platform,
  inTauri: boolean
): Omit<PlatformInfo, "platform" | "isTauri" | "isReady"> {
  const browser = detectBrowser();

  // Tauri uses platform webviews:
  // - Windows: WebView2 (Chromium-based)
  // - macOS: WebKit (Safari-like)
  // - Linux: WebKitGTK (WebKit-based)
  const effectiveBrowser = inTauri
    ? platform === "windows"
      ? "chromium"
      : "safari" // macOS and Linux use WebKit
    : browser;

  // Audio output selection (setSinkId)
  // - Chromium: Full support
  // - Firefox: Full support
  // - Safari/WebKit: Limited/no support
  const supportsAudioOutputSelection =
    effectiveBrowser === "chromium" || effectiveBrowser === "firefox";

  // System audio capture in screen sharing
  // - Only works reliably on Windows with Chromium
  // - macOS has system-level restrictions
  // - Linux support varies
  const supportsSystemAudioCapture = platform === "windows" && effectiveBrowser === "chromium";

  // Hardware H.264
  // - Windows: Good support via hardware decoders
  // - macOS: Excellent support via VideoToolbox
  // - Linux: Depends on hardware/drivers
  const supportsHardwareH264 = platform === "windows" || platform === "macos";

  // Hardware VP9
  // - Newer hardware (2017+) generally supports it
  // - macOS M1+ has hardware VP9
  // - Windows with modern GPUs
  const supportsHardwareVP9 = platform === "windows" || platform === "macos";

  // AV1 codec
  // - Chromium: Software support, hardware on newer chips
  // - Firefox: Software support
  // - Safari: Limited (macOS 14+)
  const supportsAV1 = effectiveBrowser === "chromium" || effectiveBrowser === "firefox";

  return {
    supportsAudioOutputSelection,
    supportsSystemAudioCapture,
    supportsHardwareH264,
    supportsHardwareVP9,
    supportsAV1,
  };
}

/**
 * Hook for detecting platform and media capabilities.
 * Uses Tauri OS plugin when running in Tauri, falls back to user agent detection for web.
 */
export function usePlatform(): PlatformInfo {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>(() => {
    // Initial state with reasonable defaults
    const inTauri = isTauri();
    const platform = detectPlatformFromUserAgent();
    const capabilities = getMediaCapabilities(platform, inTauri);

    return {
      platform,
      isTauri: inTauri,
      isReady: false,
      ...capabilities,
    };
  });

  useEffect(() => {
    let isMounted = true;

    const detectPlatform = async () => {
      const inTauri = isTauri();
      let platform: Platform;

      if (inTauri) {
        try {
          // Use Tauri OS plugin for accurate detection
          const os = await import("@tauri-apps/plugin-os");
          const tauriPlatform = os.platform();

          // Map Tauri platform values to our Platform type
          const platformMap: Record<string, Platform> = {
            windows: "windows",
            macos: "macos",
            linux: "linux",
            android: "android",
            ios: "ios",
          };
          platform = platformMap[tauriPlatform] ?? "web";
        } catch (error) {
          // Fallback to user agent if plugin fails
          if (import.meta.env.DEV) {
            console.warn("Failed to get platform from Tauri OS plugin:", error);
          }
          platform = detectPlatformFromUserAgent();
        }
      } else {
        platform = detectPlatformFromUserAgent();
      }

      if (isMounted) {
        const capabilities = getMediaCapabilities(platform, inTauri);
        setPlatformInfo({
          platform,
          isTauri: inTauri,
          isReady: true,
          ...capabilities,
        });
      }
    };

    detectPlatform();

    return () => {
      isMounted = false;
    };
  }, []);

  return platformInfo;
}

/**
 * Synchronous platform check (use for initial render, may not be accurate for Tauri)
 */
export function getPlatformSync(): { platform: Platform; isTauri: boolean } {
  const inTauri = isTauri();
  return {
    platform: detectPlatformFromUserAgent(),
    isTauri: inTauri,
  };
}
