import type { SecludiaConfig, SecludiaTheme, SecludiaLanguage } from "./configTypes";
import { DEFAULT_CONFIG } from "./defaultConfig";

const STORAGE_KEY = "secludia.config";

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

export function updateTheme(theme: SecludiaTheme): void {
  const config = loadConfig();
  saveConfig({ ...config, theme });
}

export function updateLanguage(language: SecludiaLanguage): void {
  const config = loadConfig();
  saveConfig({ ...config, language });
}
