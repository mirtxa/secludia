import { memo } from "react";
import { Card } from "@heroui/react";
import { useBreakpoint } from "@/hooks";
import type { ResponsiveCardProps } from "./ResponsiveCard.types";

export const ResponsiveCard = memo(function ResponsiveCard({
  header,
  content,
  footer,
  bottomBar,
}: ResponsiveCardProps) {
  const isDesktop = useBreakpoint("sm");

  if (isDesktop) {
    return (
      <div>
        <Card className="w-full max-w-md">
          <Card.Header>{header}</Card.Header>
          <Card.Content>{content}</Card.Content>
          <Card.Footer className="mt-4 flex flex-col gap-2">{footer}</Card.Footer>
        </Card>
        {bottomBar && <div className="mt-4">{bottomBar}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-surface">
      <div className="flex-1 flex flex-col justify-center p-6">
        {header}
        <div className="mt-6">{content}</div>
      </div>
      <div className="p-6 pt-0">
        {bottomBar && <div className="mb-4">{bottomBar}</div>}
        {footer}
      </div>
    </div>
  );
});
