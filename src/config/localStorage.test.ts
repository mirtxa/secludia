import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadConfig, saveConfig, updateTheme, updateLanguage } from "./localStorage";
import { DEFAULT_CONFIG } from "./defaultConfig";
import type { SecludiaConfig, SecludiaTheme, SecludiaLanguage } from "./configTypes";

describe("localStorage config", () => {
  const STORAGE_KEY = "secludia.config";

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("loadConfig", () => {
    it("returns DEFAULT_CONFIG when localStorage is empty", () => {
      expect(loadConfig()).toEqual(DEFAULT_CONFIG);
    });

    it("returns stored config merged with defaults when present", () => {
      const partialConfig = {
        theme: "midnight",
        language: "es",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(partialConfig));

      const result = loadConfig();
      // Stored values override defaults
      expect(result.theme).toBe("midnight");
      expect(result.language).toBe("es");
      // Missing values filled from defaults
      expect(result.notificationPromptStatus).toBe("pending");
      expect(result.toastDuration).toBe(5);
      expect(result.voice).toEqual(DEFAULT_CONFIG.voice);
      expect(result.video).toEqual(DEFAULT_CONFIG.video);
    });

    it("returns DEFAULT_CONFIG when stored value is invalid JSON", () => {
      localStorage.setItem(STORAGE_KEY, "not valid json");

      expect(loadConfig()).toEqual(DEFAULT_CONFIG);
    });

    it("returns DEFAULT_CONFIG when localStorage throws", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      expect(loadConfig()).toEqual(DEFAULT_CONFIG);
    });
  });

  describe("saveConfig", () => {
    it("saves config to localStorage", () => {
      const config: SecludiaConfig = {
        theme: "familiar",
        language: "es",
      };

      saveConfig(config);

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(config);
    });

    it("overwrites existing config", () => {
      const oldConfig: SecludiaConfig = { theme: "default", language: "en" };
      const newConfig: SecludiaConfig = { theme: "midnight", language: "es" };

      saveConfig(oldConfig);
      saveConfig(newConfig);

      expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(newConfig);
    });
  });

  describe("updateTheme", () => {
    it("updates theme in localStorage", () => {
      const newTheme: SecludiaTheme = "sunset";

      updateTheme(newTheme);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.theme).toBe(newTheme);
    });

    it("preserves other config fields", () => {
      const initialConfig: SecludiaConfig = { theme: "default", language: "es" };
      saveConfig(initialConfig);

      updateTheme("mint");

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.language).toBe("es");
    });
  });

  describe("updateLanguage", () => {
    it("updates language in localStorage", () => {
      const newLanguage: SecludiaLanguage = "es";

      updateLanguage(newLanguage);

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.language).toBe(newLanguage);
    });

    it("preserves other config fields", () => {
      const initialConfig: SecludiaConfig = { theme: "familiar", language: "en" };
      saveConfig(initialConfig);

      updateLanguage("es");

      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.theme).toBe("familiar");
    });
  });
});
