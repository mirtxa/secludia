import { memo } from "react";
import { Spinner } from "@heroui/react";
import type { LoadingStateProps } from "./LoadingState.types";

export const LoadingState = memo(function LoadingState({ message, fullscreen }: LoadingStateProps) {
  if (fullscreen) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Spinner size="lg" />
          {message && <p className="mt-4 text-muted">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <Spinner size="lg" />
      {message && <p className="text-muted">{message}</p>}
    </div>
  );
});
