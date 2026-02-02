import { useState, useCallback, useEffect } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";

export type MediaPermissionState = "granted" | "denied" | "prompt";
export type MediaPermissionType = "microphone" | "camera";

interface UseMediaPermissionResult {
  permission: MediaPermissionState;
  isRequesting: boolean;
  requestPermission: () => Promise<void>;
  resetPermissions: () => Promise<void>;
  isDisabled: boolean;
}

/**
 * Hook for managing media permissions (microphone, camera)
 * Handles permission checking, requesting, and resetting (Tauri only)
 */
export function useMediaPermission(type: MediaPermissionType): UseMediaPermissionResult {
  const [permission, setPermission] = useState<MediaPermissionState>("prompt");
  const [isRequesting, setIsRequesting] = useState(false);

  // Check and listen to permission status
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    let mounted = true;
    let handleChange: (() => void) | null = null;

    const checkPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({
          name: type as PermissionName,
        });

        if (mounted) {
          setPermission(permissionStatus.state as MediaPermissionState);
        }

        // Listen for changes
        handleChange = () => {
          if (mounted) {
            setPermission(permissionStatus!.state as MediaPermissionState);
          }
        };
        permissionStatus.addEventListener("change", handleChange);
      } catch {
        // Permissions API not supported - try getUserMedia to detect actual state
        try {
          const constraints = type === "microphone" ? { audio: true } : { video: true };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          stream.getTracks().forEach((track) => track.stop());
          if (mounted) setPermission("granted");
        } catch (err) {
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            // Could be denied or prompt - we can't tell without trying
            if (mounted) setPermission("prompt");
          }
        }
      }
    };

    checkPermission();

    return () => {
      mounted = false;
      if (permissionStatus && handleChange) {
        permissionStatus.removeEventListener("change", handleChange);
      }
    };
  }, [type]);

  // Request permission
  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const constraints = type === "microphone" ? { audio: true } : { video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Permission granted - stop the stream immediately
      stream.getTracks().forEach((track) => track.stop());
      setPermission("granted");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        // Check actual permission state - dismissed (X) stays "prompt", Block becomes "denied"
        try {
          const status = await navigator.permissions.query({
            name: type as PermissionName,
          });
          setPermission(status.state as MediaPermissionState);
        } catch {
          // Fallback if Permissions API not supported
          setPermission("denied");
        }
      }
    } finally {
      setIsRequesting(false);
    }
  }, [type]);

  // Reset WebView permissions (Tauri only)
  const resetPermissions = useCallback(async () => {
    if (!isTauri()) return;
    try {
      await invoke("reset_webview_permissions");
      // App will close, so we won't reach here
    } catch (err) {
      console.error("Failed to reset permissions:", err);
    }
  }, []);

  return {
    permission,
    isRequesting,
    requestPermission,
    resetPermissions,
    isDisabled: permission !== "granted",
  };
}
