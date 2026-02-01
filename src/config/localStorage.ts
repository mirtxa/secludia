import type {
  SecludiaConfig,
  SecludiaTheme,
  SecludiaLanguage,
  NotificationPermissionStatus,
} from "./configTypes";
import { THEME_OPTIONS } from "./configTypes";
import { DEFAULT_CONFIG } from "./defaultConfig";
import { AVAILABLE_LANGUAGES } from "@/i18n";

const STORAGE_KEY = "secludia.config";

/** Valid notification permission values */
const VALID_NOTIFICATION_PERMISSIONS: NotificationPermissionStatus[] = [
  "pending",
  "granted",
  "dismissed",
];

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
    notificationPermission: VALID_NOTIFICATION_PERMISSIONS.includes(
      config.notificationPermission as NotificationPermissionStatus
    )
      ? (config.notificationPermission as NotificationPermissionStatus)
      : DEFAULT_CONFIG.notificationPermission,
    toastDuration:
      typeof config.toastDuration === "number" &&
      config.toastDuration >= 1 &&
      config.toastDuration <= 15
        ? config.toastDuration
        : DEFAULT_CONFIG.toastDuration,
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

export function updateNotificationPermission(status: NotificationPermissionStatus): void {
  updateConfig("notificationPermission", status);
}

export function getNotificationPermission(): NotificationPermissionStatus {
  return loadConfig().notificationPermission;
}

export function updateToastDuration(duration: number): void {
  updateConfig("toastDuration", duration);
}

export function getToastDuration(): number {
  return loadConfig().toastDuration ?? 5;
}
