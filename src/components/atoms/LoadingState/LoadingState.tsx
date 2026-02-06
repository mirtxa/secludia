import { memo } from "react";
import { Button, Spinner, cn } from "@heroui/react";
import { useAppContext } from "@/context";
import type { LoadingStateProps } from "./LoadingState.types";

export const LoadingState = memo(function LoadingState({
  message,
  fullscreen,
  onCancel,
}: LoadingStateProps) {
  const { t } = useAppContext();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullscreen ? "h-screen w-screen bg-surface" : "py-8"
      )}
    >
      <Spinner size="lg" />
      {message && <p className="text-muted">{message}</p>}
      {onCancel && (
        <Button variant="ghost" size="sm" onPress={onCancel}>
          {t("CANCEL")}
        </Button>
      )}
    </div>
  );
});
