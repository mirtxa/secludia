import { memo } from "react";
import { Ghost } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import "./GhostEmptyState.css";

export interface GhostEmptyStateProps {
  text: string;
  actionLabel: string;
  onAction?: () => void;
}

export const GhostEmptyState = memo(function GhostEmptyState({
  text,
  actionLabel,
  onAction,
}: GhostEmptyStateProps) {
  const words = text.split(" ");

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-3 text-muted">
      <Button
        isIconOnly
        variant="ghost"
        onPress={onAction}
        className="ghost-wave size-16 opacity-50 hover:opacity-100"
        aria-label={actionLabel}
      >
        <Ghost className="size-12" />
      </Button>
      <p className="ghost-wave-text px-4 text-center text-sm">
        {words.map((word, index) => (
          <span key={index} className="inline-block" style={{ animationDelay: `${index * 0.15}s` }}>
            {word}
            {index < words.length - 1 && "\u00A0"}
          </span>
        ))}
      </p>
    </div>
  );
});
