import { memo, useCallback } from "react";
import { Smartphone, Display, TrashBin } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useAppContext } from "@/context";
import "./SessionsSection.css";

// Mock data - will be replaced with actual Matrix client data
const MOCK_CURRENT_SESSION = {
  id: "current",
  deviceName: "Secludia Desktop",
  deviceType: "desktop" as const,
  lastActive: "Active now",
  location: "New York, US",
};

const MOCK_OTHER_SESSIONS = [
  {
    id: "session-1",
    deviceName: "iPhone 15",
    deviceType: "mobile" as const,
    lastActive: "2 hours ago",
    location: "New York, US",
  },
  {
    id: "session-2",
    deviceName: "Chrome on Windows",
    deviceType: "desktop" as const,
    lastActive: "Yesterday",
    location: "Boston, US",
  },
];

interface SessionItemProps {
  deviceName: string;
  deviceType: "mobile" | "desktop";
  lastActive: string;
  location: string;
  currentBadgeLabel?: string;
  onRemove?: () => void;
}

const SessionItem = memo(function SessionItem({
  deviceName,
  deviceType,
  lastActive,
  location,
  currentBadgeLabel,
  onRemove,
}: SessionItemProps) {
  return (
    <div className="session-item">
      <div className="session-item__icon">
        {deviceType === "mobile" ? <Smartphone /> : <Display />}
      </div>
      <div className="session-item__info">
        <div className="session-item__name">
          {deviceName}
          {currentBadgeLabel && (
            <span className="session-item__current-badge">{currentBadgeLabel}</span>
          )}
        </div>
        <div className="session-item__details">
          {lastActive} • {location}
        </div>
      </div>
      {!currentBadgeLabel && onRemove && (
        <Button isIconOnly variant="ghost" size="sm" aria-label="Remove session" onPress={onRemove}>
          <TrashBin />
        </Button>
      )}
    </div>
  );
});

export const SessionsSection = memo(function SessionsSection() {
  const { t } = useAppContext();

  const handleRemoveSession = useCallback((sessionId: string) => {
    // TODO: Implement session removal
    console.log("Remove session:", sessionId);
  }, []);

  return (
    <div className="sessions-section">
      <div className="sessions-section__group">
        <h3 className="sessions-section__group-title">{t("SETTINGS_CURRENT_SESSION")}</h3>
        <SessionItem
          deviceName={MOCK_CURRENT_SESSION.deviceName}
          deviceType={MOCK_CURRENT_SESSION.deviceType}
          lastActive={MOCK_CURRENT_SESSION.lastActive}
          location={MOCK_CURRENT_SESSION.location}
          currentBadgeLabel={t("SETTINGS_CURRENT_SESSION_BADGE")}
        />
      </div>

      <div className="sessions-section__group">
        <h3 className="sessions-section__group-title">{t("SETTINGS_OTHER_SESSIONS")}</h3>
        {MOCK_OTHER_SESSIONS.length > 0 ? (
          MOCK_OTHER_SESSIONS.map((session) => (
            <SessionItem
              key={session.id}
              deviceName={session.deviceName}
              deviceType={session.deviceType}
              lastActive={session.lastActive}
              location={session.location}
              onRemove={() => handleRemoveSession(session.id)}
            />
          ))
        ) : (
          <p className="sessions-section__empty">{t("SETTINGS_NO_OTHER_SESSIONS")}</p>
        )}
      </div>
    </div>
  );
});
