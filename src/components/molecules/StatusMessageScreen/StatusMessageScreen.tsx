import { memo } from "react";
import { cn } from "@/utils";
import type { StatusMessageScreenProps } from "./StatusMessageScreen.types";

export const StatusMessageScreen = memo(function StatusMessageScreen({
  icon,
  iconColor,
  title,
  message,
  hint,
}: StatusMessageScreenProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="max-w-md space-y-4 p-6 text-center">
        <div className={cn("mb-4 text-5xl", iconColor)}>{icon}</div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-muted">{message}</p>
        <p className="text-sm text-muted/70">{hint}</p>
      </div>
    </div>
  );
});
