import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CircleCheck, CircleXmark } from "@gravity-ui/icons";
import { Button, Label, Slider } from "@heroui/react";
import { appToast } from "@/components/atoms";
import { useAppContext } from "@/context";
import { isWindowFocused, useNotification } from "@/hooks";
import type { NotificationOptions } from "@/hooks/useNotification";
import type { TranslationKey } from "@/i18n/types";

type PermissionStatus = "granted" | "not-granted" | "not-supported" | "unknown";
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

const PERMISSION_CONFIG: Record<
  PermissionStatus,
  { labelKey?: TranslationKey; icon: React.ReactNode }
> = {
  granted: {
    labelKey: "SETTINGS_NOTIFICATIONS_PERMISSION_GRANTED",
    icon: <CircleCheck className="text-success" />,
  },
  "not-supported": {
    labelKey: "SETTINGS_NOTIFICATIONS_PERMISSION_NOT_SUPPORTED",
    icon: <CircleXmark className="text-danger" />,
  },
  "not-granted": { labelKey: "SETTINGS_NOTIFICATIONS_PERMISSION_NOT_GRANTED", icon: null },
  unknown: { icon: null },
};

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

  const permissionLabel = useMemo(() => {
    const config = PERMISSION_CONFIG[permissionStatus];
    return config.labelKey ? t(config.labelKey) : "...";
  }, [permissionStatus, t]);

  const permissionIcon = PERMISSION_CONFIG[permissionStatus].icon;

  useEffect(() => {
    const checkPermission = async () => {
      const supported = await isSupported();
      if (!supported) {
        setPermissionStatus("not-supported");
        return;
      }
      const granted = await isPermissionGranted();
      setPermissionStatus(granted ? "granted" : "not-granted");
    };
    checkPermission();
  }, [isSupported, isPermissionGranted]);

  const handleEnableNotifications = useCallback(async () => {
    setLoadingId("enable");
    const granted = await requestPermission();
    setPermissionStatus(granted ? "granted" : "not-granted");
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
      <div className="flex w-full items-center gap-3 rounded-xl bg-surface p-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-default text-foreground">
          <Bell />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <span className="text-sm font-medium text-foreground">
            {t("SETTINGS_NOTIFICATIONS_PERMISSION")}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-muted">
            {permissionIcon}
            {permissionLabel}
          </span>
        </div>
      </div>

      {permissionStatus === "not-granted" && (
        <Button isPending={loadingId === "enable"} onPress={handleEnableNotifications}>
          {t("SETTINGS_NOTIFICATIONS_ENABLE")}
        </Button>
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
