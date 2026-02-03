import { memo } from "react";
import { Alert, Button } from "@heroui/react";
import { usePlatform } from "@/platforms";
import type { MediaPermissionState } from "@/hooks/useMediaPermission";

interface PermissionAlertProps {
  permission: MediaPermissionState;
  isRequesting: boolean;
  onRequestPermission: () => void;
  onResetPermissions: () => void;
  titlePrompt: string;
  titleDenied: string;
  descriptionPrompt: string;
  descriptionDenied: string;
  allowButtonLabel: string;
  resetButtonLabel: string;
}

export const PermissionAlert = memo(function PermissionAlert({
  permission,
  isRequesting,
  onRequestPermission,
  onResetPermissions,
  titlePrompt,
  titleDenied,
  descriptionPrompt,
  descriptionDenied,
  allowButtonLabel,
  resetButtonLabel,
}: PermissionAlertProps) {
  const platform = usePlatform();

  if (permission === "granted") return null;

  const isDenied = permission === "denied";
  const title = isDenied ? titleDenied : titlePrompt;
  const description = isDenied ? descriptionDenied : descriptionPrompt;

  // Render action button (shown in both mobile/desktop positions)
  const renderActionButton = (className: string) => {
    if (isDenied) {
      // Only show reset button in Tauri (desktop app)
      if (!platform.isTauri) return null;
      return (
        <Button className={className} size="sm" variant="danger" onPress={onResetPermissions}>
          {resetButtonLabel}
        </Button>
      );
    }
    return (
      <Button
        className={className}
        size="sm"
        variant="primary"
        onPress={onRequestPermission}
        isDisabled={isRequesting}
      >
        {allowButtonLabel}
      </Button>
    );
  };

  return (
    <Alert status={isDenied ? "danger" : "warning"}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{description}</Alert.Description>
        {renderActionButton("mt-2 sm:hidden")}
      </Alert.Content>
      {renderActionButton("hidden sm:block")}
    </Alert>
  );
});
