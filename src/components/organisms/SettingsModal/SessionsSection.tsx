import { memo, useCallback } from "react";
import { useAppContext } from "@/context";
import { MOCK_CURRENT_SESSION, MOCK_OTHER_SESSIONS } from "@/mocks";
import { SessionItem } from "./SessionItem";

export const SessionsSection = memo(function SessionsSection() {
  const { t } = useAppContext();

  const handleRemoveSession = useCallback((_sessionId: string) => {
    // TODO: Implement session removal
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t("SETTINGS_CURRENT_SESSION")}
        </h3>
        <SessionItem
          sessionId={MOCK_CURRENT_SESSION.id}
          deviceName={MOCK_CURRENT_SESSION.deviceName}
          deviceType={MOCK_CURRENT_SESSION.deviceType}
          lastActive={MOCK_CURRENT_SESSION.lastActive}
          location={MOCK_CURRENT_SESSION.location}
          currentBadgeLabel={t("SETTINGS_CURRENT_SESSION_BADGE")}
        />
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t("SETTINGS_OTHER_SESSIONS")}
        </h3>
        {MOCK_OTHER_SESSIONS.length > 0 ? (
          MOCK_OTHER_SESSIONS.map((session) => (
            <SessionItem
              key={session.id}
              sessionId={session.id}
              deviceName={session.deviceName}
              deviceType={session.deviceType}
              lastActive={session.lastActive}
              location={session.location}
              onRemove={handleRemoveSession}
            />
          ))
        ) : (
          <p className="text-sm text-muted">{t("SETTINGS_NO_OTHER_SESSIONS")}</p>
        )}
      </div>
    </div>
  );
});
