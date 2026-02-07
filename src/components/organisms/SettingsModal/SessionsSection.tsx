import { memo, useState, useEffect, useCallback, useMemo } from "react";
import {
  ArrowRotateLeft,
  ChevronDown,
  Smartphone,
  Display,
  Globe,
  ArrowUpRightFromSquare,
  ShieldCheck,
  ShieldExclamation,
} from "@gravity-ui/icons";
import { Accordion, Alert, Button, Chip, Skeleton, cn } from "@heroui/react";
import { useAppContext, useAuthContext } from "@/context";
import {
  getMatrixClient,
  getDevices,
  getSessionMetadata,
  inferDeviceType,
  type Device,
  type DeviceType,
} from "@/lib/matrix";
import { SectionHeader } from "@/components/molecules";
import { safeOpenUrl } from "@/utils";
import type { TranslationFunction } from "@/i18n/types";

/**
 * Get the icon for a device type.
 */
function getDeviceIcon(type: DeviceType) {
  switch (type) {
    case "mobile":
      return <Smartphone className="size-5" />;
    case "web":
      return <Globe className="size-5" />;
    case "desktop":
    default:
      return <Display className="size-5" />;
  }
}

/**
 * Format a timestamp to a relative time string.
 */
function formatRelativeTime(ts: number | undefined, t: TranslationFunction): string {
  if (!ts) return t("SETTINGS_SESSION_NEVER");

  const now = Date.now();
  const diff = now - ts;

  if (diff < 60 * 1000) {
    return t("SETTINGS_SESSION_ACTIVE_NOW");
  }
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return t("SETTINGS_SESSION_MINUTES_AGO", { n: minutes });
  }
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return t("SETTINGS_SESSION_HOURS_AGO", { n: hours });
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return t("SETTINGS_SESSION_DAYS_AGO", { n: days });
  }

  return new Date(ts).toLocaleDateString();
}

/**
 * Format a timestamp to a full date string.
 */
function formatFullDate(ts: number | undefined): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface DeviceDetailRowProps {
  label: string;
  value: string | undefined;
  isMono?: boolean;
}

function DeviceDetailRow({ label, value, isMono }: DeviceDetailRowProps) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted">{label}</span>
      <span className={cn("text-sm", isMono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

interface DeviceAccordionItemProps {
  device: Device;
  accountManagementUrl?: string;
  t: TranslationFunction;
}

const DeviceAccordionItem = memo(function DeviceAccordionItem({
  device,
  accountManagementUrl,
  t,
}: DeviceAccordionItemProps) {
  const deviceType = inferDeviceType(device);
  const displayName = device.displayName || device.deviceId;
  const lastSeen = formatRelativeTime(device.lastSeenTs, t);

  // Build device-specific management URL
  const deviceManagementUrl = useMemo(() => {
    if (!accountManagementUrl) return null;
    // MAS uses /account/sessions/{device_id} pattern
    const baseUrl = accountManagementUrl.replace(/\/$/, "");
    return `${baseUrl}/sessions/${encodeURIComponent(device.deviceId)}`;
  }, [accountManagementUrl, device.deviceId]);

  const handleManageDevice = useCallback(() => {
    if (deviceManagementUrl) {
      safeOpenUrl(deviceManagementUrl);
    }
  }, [deviceManagementUrl]);

  return (
    <Accordion.Item
      id={device.deviceId}
      className={cn(
        "group/item",
        "first:[&_[data-slot=accordion-trigger]]:rounded-t-xl",
        "last:[&:not(:has([data-slot=accordion-trigger][aria-expanded='true']))_[data-slot=accordion-trigger]]:rounded-b-xl"
      )}
    >
      <Accordion.Heading>
        <Accordion.Trigger className="group flex items-center gap-3 transition-none hover:bg-surface-secondary">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-[10px]",
              device.isCurrent ? "bg-accent text-accent-foreground" : "bg-default text-foreground"
            )}
          >
            {getDeviceIcon(deviceType)}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium leading-5">{displayName}</span>
              {device.verificationStatus === "verified" && (
                <Chip
                  size="sm"
                  className="shrink-0 gap-1 bg-success-soft px-2 text-[11px] font-semibold text-success-soft-foreground"
                >
                  <ShieldCheck className="size-3" />
                  {t("SETTINGS_SESSION_VERIFIED")}
                </Chip>
              )}
              {device.verificationStatus === "unverified" && (
                <Chip
                  size="sm"
                  className="shrink-0 gap-1 bg-warning-soft px-2 text-[11px] font-semibold text-warning-soft-foreground"
                >
                  <ShieldExclamation className="size-3" />
                  {t("SETTINGS_SESSION_UNVERIFIED")}
                </Chip>
              )}
            </div>
            <span className="text-[13px] leading-5 text-muted">{lastSeen}</span>
          </div>
          <Accordion.Indicator className="text-muted [&>svg]:size-4">
            <ChevronDown />
          </Accordion.Indicator>
        </Accordion.Trigger>
      </Accordion.Heading>
      <Accordion.Panel>
        <Accordion.Body className="flex flex-col gap-4 pt-2">
          {/* Device details */}
          <div className="grid grid-cols-2 gap-4">
            <DeviceDetailRow label={t("SETTINGS_SESSION_LAST_ACTIVE")} value={lastSeen} />
            <DeviceDetailRow
              label={t("SETTINGS_SESSION_SIGNED_IN")}
              value={formatFullDate(device.lastSeenTs)}
            />
            <DeviceDetailRow
              label={t("SETTINGS_SESSION_DEVICE_ID")}
              value={device.deviceId}
              isMono
            />
            <DeviceDetailRow
              label={t("SETTINGS_SESSION_IP_ADDRESS")}
              value={device.lastSeenIp}
              isMono
            />
          </div>

          {device.userAgent && (
            <DeviceDetailRow label={t("SETTINGS_SESSION_USER_AGENT")} value={device.userAgent} />
          )}

          {/* Manage device button */}
          {deviceManagementUrl && (
            <Button variant="secondary" className="w-full" onPress={handleManageDevice}>
              <ArrowUpRightFromSquare className="size-4" />
              {t("SETTINGS_SESSION_MANAGE_DEVICE")}
            </Button>
          )}
        </Accordion.Body>
      </Accordion.Panel>
    </Accordion.Item>
  );
});

export const SessionsSection = memo(function SessionsSection() {
  const { t } = useAppContext();
  const { session } = useAuthContext();

  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get account management URL from stored session
  const accountManagementUrl = useMemo(() => {
    const storedSession = getSessionMetadata();
    return storedSession?.accountManagementUrl;
  }, []);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    const client = getMatrixClient();
    if (!client || !session) {
      setError(t("SETTINGS_SESSION_NOT_AUTHENTICATED"));
      setIsLoading(false);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const deviceList = await getDevices(client, session.deviceId);
      // Sort: current device first, then by last seen (most recent first)
      deviceList.sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return (b.lastSeenTs || 0) - (a.lastSeenTs || 0);
      });
      setDevices(deviceList);
    } catch {
      setError(t("SETTINGS_SESSION_FETCH_ERROR"));
    } finally {
      setIsLoading(false);
    }
  }, [session, t]);

  // Fetch on mount
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Separate current device from others
  const { currentDevice, otherDevices } = useMemo(() => {
    const current = devices.find((d) => d.isCurrent);
    const others = devices.filter((d) => !d.isCurrent);
    return { currentDevice: current, otherDevices: others };
  }, [devices]);

  // Loading state - skeleton matching the actual layout
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        {/* Current session skeleton */}
        <section className="flex flex-col gap-5">
          <SectionHeader icon={<Smartphone />} title={t("SETTINGS_CURRENT_SESSION")} />
          <div className="rounded-xl bg-surface p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-[10px]" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          </div>
        </section>

        {/* Other sessions skeleton */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <SectionHeader icon={<Smartphone />} title={t("SETTINGS_OTHER_SESSIONS")} />
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              isDisabled
              aria-label={t("SETTINGS_SESSION_REFRESH")}
            >
              <ArrowRotateLeft className="size-4" />
            </Button>
          </div>
          <div className="rounded-xl bg-surface">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-default p-4 last:border-b-0"
              >
                <Skeleton className="size-10 shrink-0 rounded-[10px]" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <span className="text-sm text-danger">{error}</span>
        <Button variant="secondary" onPress={fetchDevices}>
          <ArrowRotateLeft className="size-4" />
          {t("SETTINGS_SESSION_RETRY")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Unverified device alert */}
      {currentDevice && currentDevice.verificationStatus !== "verified" && (
        <Alert status="warning">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("SETTINGS_SESSION_UNVERIFIED_ALERT_TITLE")}</Alert.Title>
            <Alert.Description>{t("SETTINGS_SESSION_UNVERIFIED_ALERT_DESC")}</Alert.Description>
            <Button className="mt-2 sm:hidden" size="sm" variant="primary">
              {t("SETTINGS_SESSION_VERIFY_BUTTON")}
            </Button>
          </Alert.Content>
          <Button className="hidden sm:block" size="sm" variant="primary">
            {t("SETTINGS_SESSION_VERIFY_BUTTON")}
          </Button>
        </Alert>
      )}

      {/* Current session */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={<Smartphone />} title={t("SETTINGS_CURRENT_SESSION")} />
        {currentDevice ? (
          <Accordion className="w-full rounded-xl" variant="surface">
            <DeviceAccordionItem
              device={currentDevice}
              accountManagementUrl={accountManagementUrl}
              t={t}
            />
          </Accordion>
        ) : (
          <p className="text-sm text-muted">{t("SETTINGS_SESSION_NOT_FOUND")}</p>
        )}
      </section>

      {/* Other sessions */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <SectionHeader icon={<Smartphone />} title={t("SETTINGS_OTHER_SESSIONS")} />
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label={t("SETTINGS_SESSION_REFRESH")}
            onPress={fetchDevices}
          >
            <ArrowRotateLeft className="size-4" />
          </Button>
        </div>
        {otherDevices.length > 0 ? (
          <Accordion className="w-full rounded-xl" variant="surface">
            {otherDevices.map((device) => (
              <DeviceAccordionItem
                key={device.deviceId}
                device={device}
                accountManagementUrl={accountManagementUrl}
                t={t}
              />
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted">{t("SETTINGS_NO_OTHER_SESSIONS")}</p>
        )}
      </section>
    </div>
  );
});
