import { memo } from "react";
import { Microphone, Video, Display } from "@gravity-ui/icons";
import { Popover, Button } from "@heroui/react";
import { useAppContext, useMediaRegistryContext, type MediaType } from "@/context";

export interface PrivacyIndicatorModalProps {
  children: React.ReactNode;
}

const MEDIA_ICONS: Record<MediaType, React.ReactNode> = {
  microphone: <Microphone className="size-4" />,
  camera: <Video className="size-4" />,
  screen: <Display className="size-4" />,
};

const MEDIA_LABEL_KEYS: Record<MediaType, string> = {
  microphone: "PRIVACY_INDICATOR_MICROPHONE",
  camera: "PRIVACY_INDICATOR_CAMERA",
  screen: "PRIVACY_INDICATOR_SCREEN",
};

export const PrivacyIndicatorModal = memo(function PrivacyIndicatorModal({
  children,
}: PrivacyIndicatorModalProps) {
  const { t } = useAppContext();
  const { activeMedia, hasActiveMedia } = useMediaRegistryContext();

  return (
    <Popover>
      <Popover.Trigger>
        <Button
          variant="ghost"
          className="rounded-full p-0"
          aria-label={hasActiveMedia ? t("PRIVACY_INDICATOR_TITLE") : undefined}
        >
          {children}
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="top" offset={8} className="max-w-64 rounded-lg p-3">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">{t("PRIVACY_INDICATOR_TITLE")}</h3>
          {activeMedia.length === 0 ? (
            <p className="text-xs text-muted">{t("PRIVACY_INDICATOR_NO_ACTIVE")}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {activeMedia.map((media) => (
                <li key={media.id} className="flex items-center gap-2 text-sm">
                  <span className="text-danger">{MEDIA_ICONS[media.type]}</span>
                  <span className="font-medium">
                    {t(MEDIA_LABEL_KEYS[media.type] as Parameters<typeof t>[0])}
                  </span>
                  <span className="text-xs text-muted">- {media.source}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
});
