import { memo, useCallback } from "react";
import { Smartphone, Display, TrashBin } from "@gravity-ui/icons";
import { Button } from "@heroui/react";

export interface SessionItemProps {
  sessionId: string;
  deviceName: string;
  deviceType: "mobile" | "desktop";
  lastActive: string;
  location: string;
  currentBadgeLabel?: string;
  onRemove?: (sessionId: string) => void;
}

export const SessionItem = memo(function SessionItem({
  sessionId,
  deviceName,
  deviceType,
  lastActive,
  location,
  currentBadgeLabel,
  onRemove,
}: SessionItemProps) {
  const handleRemove = useCallback(() => {
    onRemove?.(sessionId);
  }, [onRemove, sessionId]);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-default text-foreground">
        {deviceType === "mobile" ? <Smartphone /> : <Display />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm font-medium">
          {deviceName}
          {currentBadgeLabel && (
            <span className="rounded-md bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
              {currentBadgeLabel}
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[13px] text-muted">
          {lastActive} • {location}
        </div>
      </div>
      {!currentBadgeLabel && onRemove && (
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          aria-label="Remove session"
          onPress={handleRemove}
        >
          <TrashBin />
        </Button>
      )}
    </div>
  );
});
