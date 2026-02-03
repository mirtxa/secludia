import { useState, useCallback } from "react";

/**
 * Hook for managing a persisted setting with local state and storage sync.
 * Reduces boilerplate in settings sections by combining state + persistence.
 *
 * @param initialValue - Initial value (typically from config getter)
 * @param persist - Function to persist the value (e.g., updateVoiceConfig)
 */
export function usePersistedSetting<T>(
  initialValue: T,
  persist: (value: T) => void
): [T, (value: T) => void] {
  const [value, setValue] = useState(initialValue);

  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      persist(newValue);
    },
    [persist]
  );

  return [value, updateValue];
}
