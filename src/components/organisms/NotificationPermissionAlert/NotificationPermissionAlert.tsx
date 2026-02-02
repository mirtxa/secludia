import { memo, useCallback, useEffect, useState } from "react";
import { Bell } from "@gravity-ui/icons";
import { AlertDialog, Button } from "@heroui/react";
import { isTauri } from "@tauri-apps/api/core";
import { getNotificationPromptStatus, updateNotificationPromptStatus } from "@/config/localStorage";
import { useAppContext } from "@/context";
import { useNotification } from "@/hooks";

export const NotificationPermissionAlert = memo(function NotificationPermissionAlert() {
  const { t } = useAppContext();
  const { isSupported, isPermissionGranted, requestPermission } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkShouldShow = async () => {
      // Tauri uses native OS notifications - no permission prompt needed
      if (isTauri()) {
        return;
      }

      const storedStatus = getNotificationPromptStatus();

      if (storedStatus === "granted" || storedStatus === "dismissed") {
        return;
      }

      const supported = await isSupported();
      if (!supported) {
        return;
      }

      const granted = await isPermissionGranted();
      if (!granted) {
        setIsOpen(true);
      } else {
        updateNotificationPromptStatus("granted");
      }
    };

    checkShouldShow();
  }, [isSupported, isPermissionGranted]);

  const handleEnable = useCallback(async () => {
    setIsLoading(true);
    const granted = await requestPermission();
    setIsLoading(false);

    if (granted) {
      updateNotificationPromptStatus("granted");
      setIsOpen(false);
    }
  }, [requestPermission]);

  const handleDismiss = useCallback(() => {
    updateNotificationPromptStatus("dismissed");
    setIsOpen(false);
  }, []);

  return (
    <AlertDialog.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Container placement="center">
        <AlertDialog.Dialog className="md:max-w-[400px]">
          <AlertDialog.Header>
            <AlertDialog.Icon status="accent">
              <Bell className="size-5" />
            </AlertDialog.Icon>
            <AlertDialog.Heading>{t("NOTIFICATION_PERMISSION_TITLE")}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>{t("NOTIFICATION_PERMISSION_DESCRIPTION")}</p>
          </AlertDialog.Body>
          <AlertDialog.Footer className="flex-col-reverse gap-2 md:flex-row md:gap-3">
            <Button className="w-full md:w-auto" variant="tertiary" onPress={handleDismiss}>
              {t("NOTIFICATION_PERMISSION_DISMISS")}
            </Button>
            <Button className="w-full md:w-auto" isPending={isLoading} onPress={handleEnable}>
              {t("NOTIFICATION_PERMISSION_ENABLE")}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
});
