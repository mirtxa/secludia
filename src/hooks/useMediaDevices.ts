import { useState, useEffect, useCallback } from "react";

export interface MediaDevice {
  key: string;
  label: string;
}

type DeviceKind = "audioinput" | "audiooutput" | "videoinput";

interface UseMediaDevicesOptions {
  kind: DeviceKind;
  defaultLabel: string;
}

interface UseMediaDevicesResult {
  devices: MediaDevice[];
  getDisplayValue: (selectedId: string) => string;
}

/**
 * Hook to enumerate and manage media devices
 * Automatically updates when devices change
 */
export function useMediaDevices({
  kind,
  defaultLabel,
}: UseMediaDevicesOptions): UseMediaDevicesResult {
  const [devices, setDevices] = useState<MediaDevice[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadDevices = async () => {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();

        if (!isMounted) return;

        const filteredDevices: MediaDevice[] = [{ key: "default", label: defaultLabel }];

        allDevices.forEach((device) => {
          if (device.kind === kind && device.deviceId !== "default") {
            const labelPrefix =
              kind === "audioinput" ? "Microphone" : kind === "audiooutput" ? "Speaker" : "Camera";
            filteredDevices.push({
              key: device.deviceId,
              label: device.label || `${labelPrefix} (${device.deviceId.slice(0, 8)}...)`,
            });
          }
        });

        setDevices(filteredDevices);
      } catch (error) {
        if (import.meta.env.DEV) console.error("Failed to enumerate media devices:", error);
      }
    };

    loadDevices();

    navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    return () => {
      isMounted = false;
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
    };
  }, [kind, defaultLabel]);

  const getDisplayValue = useCallback(
    (selectedId: string): string => {
      const device = devices.find((d) => d.key === selectedId);
      return device?.label ?? defaultLabel;
    },
    [devices, defaultLabel]
  );

  return { devices, getDisplayValue };
}
