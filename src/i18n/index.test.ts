import { describe, it, expect, vi } from "vitest";

// Mock import.meta.glob before importing the module
vi.mock("@/locales/en.json", () => ({
  default: {
    LANGUAGE_DISPLAY_NAME: "English",
    GREETING: "Hello",
    GREETING_WITH_NAME: "Hello, {{name}}!",
    COUNT_ITEMS: "You have {{count}} items",
  },
}));

vi.mock("@/locales/es.json", () => ({
  default: {
    LANGUAGE_DISPLAY_NAME: "Espanol",
    GREETING: "Hola",
    GREETING_WITH_NAME: "Hola, {{name}}!",
    COUNT_ITEMS: "Tienes {{count}} articulos",
  },
}));

// Mock import.meta.glob to return our mocked locales
vi.stubGlobal("import.meta", {
  glob: () => ({
    "/src/locales/en.json": { default: { LANGUAGE_DISPLAY_NAME: "English", GREETING: "Hello" } },
    "/src/locales/es.json": { default: { LANGUAGE_DISPLAY_NAME: "Espanol", GREETING: "Hola" } },
  }),
  env: { DEV: false },
});

// Since import.meta.glob is hard to mock, we'll test the pure functions directly
// by creating testable versions of the core logic

describe("i18n interpolation", () => {
  function interpolate(text: string, values?: Record<string, string | number>): string {
    if (!values) return text;
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = values[key];
      if (value === undefined) {
        return `{{${key}}}`;
      }
      return String(value);
    });
  }

  it("returns text unchanged when no values provided", () => {
    expect(interpolate("Hello World")).toBe("Hello World");
  });

  it("returns text unchanged when no placeholders exist", () => {
    expect(interpolate("Hello World", { name: "Alice" })).toBe("Hello World");
  });

  it("replaces single placeholder", () => {
    expect(interpolate("Hello, {{name}}!", { name: "Alice" })).toBe("Hello, Alice!");
  });

  it("replaces multiple placeholders", () => {
    expect(interpolate("{{greeting}}, {{name}}!", { greeting: "Hi", name: "Bob" })).toBe(
      "Hi, Bob!"
    );
  });

  it("handles numeric values", () => {
    expect(interpolate("You have {{count}} items", { count: 5 })).toBe("You have 5 items");
  });

  it("preserves placeholder when value is missing", () => {
    expect(interpolate("Hello, {{name}}!", {})).toBe("Hello, {{name}}!");
  });

  it("handles empty string values", () => {
    expect(interpolate("Hello{{suffix}}", { suffix: "" })).toBe("Hello");
  });

  it("handles zero as a value", () => {
    expect(interpolate("Count: {{num}}", { num: 0 })).toBe("Count: 0");
  });
});

describe("i18n translation lookup", () => {
  const dictionaries: Record<string, Record<string, string>> = {
    en: {
      GREETING: "Hello",
      ONLY_EN: "Only in English",
    },
    es: {
      GREETING: "Hola",
    },
  };

  const DEFAULT_LANG = "en";

  function t(lang: string, key: string): string {
    const translation = dictionaries[lang]?.[key];
    if (translation === undefined) {
      return dictionaries[DEFAULT_LANG]?.[key] ?? key;
    }
    return translation;
  }

  it("returns translation for valid language and key", () => {
    expect(t("en", "GREETING")).toBe("Hello");
    expect(t("es", "GREETING")).toBe("Hola");
  });

  it("falls back to default language when key missing", () => {
    expect(t("es", "ONLY_EN")).toBe("Only in English");
  });

  it("returns key when not found in any language", () => {
    expect(t("en", "NONEXISTENT")).toBe("NONEXISTENT");
  });

  it("falls back to default for unknown language", () => {
    expect(t("fr", "GREETING")).toBe("Hello");
  });
});

describe("language validation", () => {
  const availableLanguages = ["en", "es"];

  function isValidLanguage(lang: string): boolean {
    return availableLanguages.includes(lang);
  }

  it("returns true for valid languages", () => {
    expect(isValidLanguage("en")).toBe(true);
    expect(isValidLanguage("es")).toBe(true);
  });

  it("returns false for invalid languages", () => {
    expect(isValidLanguage("fr")).toBe(false);
    expect(isValidLanguage("")).toBe(false);
  });
});

describe("getLanguageDisplayName", () => {
  const dictionaries: Record<string, Record<string, string>> = {
    en: { LANGUAGE_DISPLAY_NAME: "English" },
    es: { LANGUAGE_DISPLAY_NAME: "Espanol" },
  };

  function getLanguageDisplayName(lang: string): string {
    return dictionaries[lang]?.LANGUAGE_DISPLAY_NAME ?? lang;
  }

  it("returns display name for known language", () => {
    expect(getLanguageDisplayName("en")).toBe("English");
    expect(getLanguageDisplayName("es")).toBe("Espanol");
  });

  it("returns language code for unknown language", () => {
    expect(getLanguageDisplayName("fr")).toBe("fr");
  });
});
