import type en from "@/locales/en.json";

export type TranslationKey = keyof typeof en;

export type InterpolationValues = Record<string, string | number>;

export type TranslationFunction = (key: TranslationKey, values?: InterpolationValues) => string;
