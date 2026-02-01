import { useMemo } from "react";
import { useAppContext } from "@/context";
import type { TranslationKey } from "@/i18n/types";

interface OptionConfig<T extends string> {
  key: T;
  labelKey: TranslationKey;
}

interface TranslatedOptions<T extends string> {
  options: { key: T; label: string }[];
  getDisplayValue: (value: T) => string;
}

/**
 * Hook to create translated dropdown options from a config array.
 * Eliminates duplication of options mapping and display value logic.
 */
export function useTranslatedOptions<T extends string>(
  config: readonly OptionConfig<T>[]
): TranslatedOptions<T> {
  const { t } = useAppContext();

  const options = useMemo(
    () => config.map((item) => ({ key: item.key, label: t(item.labelKey) })),
    [config, t]
  );

  const getDisplayValue = useMemo(() => {
    const labelMap = new Map(config.map((item) => [item.key, item.labelKey]));
    return (value: T): string => {
      const labelKey = labelMap.get(value);
      return labelKey ? t(labelKey) : value;
    };
  }, [config, t]);

  return { options, getDisplayValue };
}
