import { memo, useCallback, useEffect, useState } from "react";
import { Alert, Button, Label, Slider } from "@heroui/react";
import { isTauri } from "@tauri-apps/api/core";
import { appToast } from "@/components/atoms";
import { useAppContext } from "@/context";
import { isWindowFocused, useNotification } from "@/hooks";
import type { NotificationOptions } from "@/hooks/useNotification";
import type { TranslationKey } from "@/i18n/types";

type PermissionStatus = "granted" | "denied" | "prompt" | "not-supported" | "unknown";
type NotificationType = "system" | "toast" | "auto";

interface TestNotification {
  options: NotificationOptions;
  avatarUrl?: string;
}

const TEST_NOTIFICATIONS: TestNotification[] = [
  { options: { title: "Secludia" } },
  {
    options: { title: "Alice Smith", body: "Hey! Are you free tonight?" },
    avatarUrl: "https://img.heroui.chat/image/avatar?w=64&h=64&u=1",
  },
  {
    options: {
      title: "Bob Johnson",
      body: "Just wanted to check in and see how the project is going.",
    },
    avatarUrl: "https://img.heroui.chat/image/avatar?w=64&h=64&u=2",
  },
  { options: { title: "Silent notification", body: "This should not play a sound", silent: true } },
  {
    options: { title: "Emma Davis", body: "Sure, let's meet at 7pm at the usual place" },
    avatarUrl: "https://img.heroui.chat/image/avatar?w=64&h=64&u=3",
  },
  {
    options: { title: "Project Team", body: "Frank: The deployment is complete!" },
    avatarUrl: "https://img.heroui.chat/image/avatar?w=64&h=64&u=4",
  },
];

const NOTIFICATION_TYPES: {
  type: NotificationType;
  labelKey: TranslationKey;
  descKey: TranslationKey;
}[] = [
  {
    type: "auto",
    labelKey: "SETTINGS_NOTIFICATIONS_TYPE_AUTO",
    descKey: "SETTINGS_NOTIFICATIONS_TYPE_AUTO_DESC",
  },
  {
    type: "toast",
    labelKey: "SETTINGS_NOTIFICATIONS_TYPE_TOAST",
    descKey: "SETTINGS_NOTIFICATIONS_TYPE_TOAST_DESC",
  },
  {
    type: "system",
    labelKey: "SETTINGS_NOTIFICATIONS_TYPE_SYSTEM",
    descKey: "SETTINGS_NOTIFICATIONS_TYPE_SYSTEM_DESC",
  },
];

const selectButtonClass = "h-auto flex-col items-start gap-0.5 rounded-lg border p-3 text-left";
const selectButtonActiveClass = "border-accent bg-accent/10";
const selectButtonInactiveClass = "border-border bg-surface hover:bg-default";

export const NotificationsSection = memo(function NotificationsSection() {
  const { t, toastDuration, setToastDuration } = useAppContext();
  const { isSupported, isPermissionGranted, requestPermission, sendNotification } =
    useNotification();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("unknown");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<NotificationType>("auto");

  useEffect(() => {
    const checkPermission = async () => {
      // Tauri uses native OS notifications - always considered granted
      if (isTauri()) {
        setPermissionStatus("granted");
        return;
      }

      const supported = await isSupported();
      if (!supported) {
        setPermissionStatus("not-supported");
        return;
      }
      const granted = await isPermissionGranted();
      if (granted) {
        setPermissionStatus("granted");
      } else {
        // Check if explicitly denied or just not asked yet
        // Web: Notification.permission is "denied" or "default"
        if (typeof Notification !== "undefined" && Notification.permission === "denied") {
          setPermissionStatus("denied");
        } else {
          setPermissionStatus("prompt");
        }
      }
    };
    checkPermission();
  }, [isSupported, isPermissionGranted]);

  const handleEnableNotifications = useCallback(async () => {
    setLoadingId("enable");
    const granted = await requestPermission();
    if (granted) {
      setPermissionStatus("granted");
    } else {
      // Check if explicitly denied
      if (typeof Notification !== "undefined" && Notification.permission === "denied") {
        setPermissionStatus("denied");
      } else {
        setPermissionStatus("prompt");
      }
    }
    setLoadingId(null);
  }, [requestPermission]);

  const handleTestNotification = useCallback(
    async (
      index: number,
      options: NotificationOptions,
      type: NotificationType,
      avatarUrl?: string
    ) => {
      setLoadingId(`test-${index}`);
      const shouldUseToast = type === "toast" || (type === "auto" && isWindowFocused());

      if (shouldUseToast) {
        appToast(options.title, { description: options.body, avatarUrl, silent: options.silent });
      } else {
        const success = await sendNotification(options);
        if (success) setPermissionStatus("granted");
      }
      setTimeout(() => setLoadingId(null), 2000);
    },
    [sendNotification]
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Permission Alert (web only - Tauri uses native OS notifications) */}
      {(permissionStatus === "prompt" || permissionStatus === "denied") && (
        <Alert status={permissionStatus === "denied" ? "danger" : "warning"}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("SETTINGS_NOTIFICATIONS_PERMISSION_TITLE")}</Alert.Title>
            <Alert.Description>
              {permissionStatus === "denied"
                ? t("SETTINGS_NOTIFICATIONS_PERMISSION_DENIED_DESC")
                : t("SETTINGS_NOTIFICATIONS_PERMISSION_PROMPT_DESC")}
            </Alert.Description>
            {permissionStatus === "prompt" && (
              <Button
                className="mt-2 sm:hidden"
                size="sm"
                variant="primary"
                onPress={handleEnableNotifications}
                isDisabled={loadingId === "enable"}
              >
                {t("SETTINGS_NOTIFICATIONS_PERMISSION_BUTTON")}
              </Button>
            )}
          </Alert.Content>
          {permissionStatus === "prompt" && (
            <Button
              className="hidden sm:block"
              size="sm"
              variant="primary"
              onPress={handleEnableNotifications}
              isDisabled={loadingId === "enable"}
            >
              {t("SETTINGS_NOTIFICATIONS_PERMISSION_BUTTON")}
            </Button>
          )}
        </Alert>
      )}

      {permissionStatus !== "not-supported" && (
        <>
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-foreground">
              {t("SETTINGS_NOTIFICATIONS_TYPE")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {NOTIFICATION_TYPES.map(({ type, labelKey, descKey }) => (
                <Button
                  key={type}
                  variant="ghost"
                  className={`${selectButtonClass} ${notificationType === type ? selectButtonActiveClass : selectButtonInactiveClass}`}
                  onPress={() => setNotificationType(type)}
                >
                  <span className="text-sm font-medium text-foreground">{t(labelKey)}</span>
                  <span className="text-xs text-muted">{t(descKey)}</span>
                </Button>
              ))}
            </div>
          </div>

          <Slider
            value={toastDuration}
            onChange={(value) => setToastDuration(value as number)}
            minValue={1}
            maxValue={15}
            step={1}
          >
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">
                {t("SETTINGS_NOTIFICATIONS_DURATION")}
              </Label>
              <Slider.Output className="text-sm text-muted">
                {({ state }) => `${state.values[0]}s`}
              </Slider.Output>
            </div>
            <Slider.Track>
              <Slider.Fill />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-foreground">
              {t("SETTINGS_NOTIFICATIONS_TEST_NOTIFICATIONS")}
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {TEST_NOTIFICATIONS.map(({ options, avatarUrl }, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  isDisabled={loadingId !== null}
                  className={`${selectButtonClass} ${selectButtonInactiveClass}`}
                  onPress={() =>
                    handleTestNotification(index, options, notificationType, avatarUrl)
                  }
                >
                  <span className="text-sm font-medium text-foreground">{options.title}</span>
                  {options.body && (
                    <span className="line-clamp-1 text-xs text-muted">{options.body}</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
});
