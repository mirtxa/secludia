import type { ReactNode } from "react";

import { Avatar, CloseButton, Toast } from "@heroui/react";
import { memo, useEffect, useRef, useState } from "react";
import { useBreakpoint } from "@/hooks";
import { getInitials } from "@/utils";
import { appToastQueue, type AppToastContent } from "./appToast";
import "./AppToast.css";

const handleClear = () => appToastQueue.clear();

interface AppToastContainerProps {
  placement?: "top" | "top start" | "top end" | "bottom" | "bottom start" | "bottom end";
}

function createRoundedRectPath(width: number, height: number, radius: number): string {
  // Start at top center, go counter-clockwise
  const r = Math.min(radius, width / 2, height / 2);
  const w = width;
  const h = height;

  return `
    M ${w / 2} 0
    L ${r} 0
    A ${r} ${r} 0 0 0 0 ${r}
    L 0 ${h - r}
    A ${r} ${r} 0 0 0 ${r} ${h}
    L ${w - r} ${h}
    A ${r} ${r} 0 0 0 ${w} ${h - r}
    L ${w} ${r}
    A ${r} ${r} 0 0 0 ${w - r} 0
    L ${w / 2} 0
  `;
}

export function AppToastContainer({ placement = "top end" }: AppToastContainerProps) {
  const isSmOrLarger = useBreakpoint("sm");
  const responsivePlacement = isSmOrLarger ? placement : "top";

  return (
    <Toast.Container placement={responsivePlacement} queue={appToastQueue}>
      {({ toast: toastItem }) => {
        const content = toastItem.content as AppToastContent;
        const timeout = content.timeout ?? 5000;

        return (
          <Toast
            toast={toastItem}
            variant={content.variant ?? "default"}
            className="app-toast !bg-transparent !p-0 !shadow-none"
            style={{ "--toast-timeout": `${timeout}ms` } as React.CSSProperties}
          >
            <ToastContent content={content} />
          </Toast>
        );
      }}
    </Toast.Container>
  );
}

const ToastContent = memo(function ToastContent({ content }: { content: AppToastContent }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [outline, setOutline] = useState<{ path: string; width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    if (!contentRef.current) return;

    const updateOutline = () => {
      const rect = contentRef.current!.getBoundingClientRect();
      const strokeWidth = 2;
      const width = rect.width + strokeWidth;
      const height = rect.height + strokeWidth;
      setOutline({
        path: createRoundedRectPath(width, height, 17),
        width,
        height,
      });
    };

    updateOutline();
    const observer = new ResizeObserver(updateOutline);
    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative">
      {outline && (
        <svg
          className="app-toast__outline absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible"
          width={outline.width}
          height={outline.height}
          viewBox={`0 0 ${outline.width} ${outline.height}`}
        >
          <path
            className="app-toast__outline-path"
            d={outline.path}
            fill="none"
            strokeWidth="2"
            pathLength="100"
          />
        </svg>
      )}
      <div
        ref={contentRef}
        className="bg-overlay border border-border rounded-2xl py-3 px-4 shadow-overlay max-w-[min(420px,calc(100vw-2rem))]"
      >
        <div className="flex w-full items-center gap-3">
          {content.avatarUrl && (
            <Avatar size="sm" className="shrink-0">
              <Avatar.Image src={content.avatarUrl} alt={content.title as string} />
              <Avatar.Fallback>{getInitials(content.title as string)}</Avatar.Fallback>
            </Avatar>
          )}
          <div className="flex min-w-0 flex-1 flex-col">
            {content.title && (
              <span className="truncate text-sm font-medium text-overlay-foreground">
                {content.title as ReactNode}
              </span>
            )}
            {content.description && (
              <span className="truncate text-sm text-muted">
                {content.description as ReactNode}
              </span>
            )}
          </div>
          <CloseButton
            aria-label="Dismiss notification"
            className="shrink-0"
            onPress={handleClear}
          />
        </div>
      </div>
    </div>
  );
});
