import type { SecludiaConfig, SecludiaTheme, SecludiaLanguage } from "./configTypes";
import { DEFAULT_CONFIG } from "./defaultConfig";

const STORAGE_KEY = "secludia.config";

const CONFIG_KEYS = {
  THEME: "theme",
  LANGUAGE: "language",
} as const satisfies Record<string, keyof SecludiaConfig>;

export function loadConfig(): SecludiaConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(config: SecludiaConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

function updateConfigField<K extends keyof SecludiaConfig>(key: K, value: SecludiaConfig[K]): void {
  const config = loadConfig();
  saveConfig({ ...config, [key]: value });
}

export function updateTheme(theme: SecludiaTheme): void {
  updateConfigField(CONFIG_KEYS.THEME, theme);
  document.documentElement.dataset.theme = theme;
}

export function updateLanguage(language: SecludiaLanguage): void {
  updateConfigField(CONFIG_KEYS.LANGUAGE, language);
  document.documentElement.lang = language;
}
