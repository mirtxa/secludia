import { memo, useCallback, type ReactNode } from "react";
import { AlertDialog, Button, Spinner } from "@heroui/react";
import {
  CircleInfo,
  CircleCheckFill,
  TriangleExclamationFill,
  CircleExclamationFill,
} from "@gravity-ui/icons";
import { Scrollbar } from "@/components/atoms";
import { cn } from "@/utils";
import type {
  ScrollableAlertDialogProps,
  ScrollableAlertDialogVariant,
} from "./ScrollableAlertDialog.types";

const ICON_VARIANT_CLASSES: Record<ScrollableAlertDialogVariant, string> = {
  default: "bg-default/15 text-foreground",
  accent: "bg-accent/15 text-accent",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

const DEFAULT_ICONS: Record<ScrollableAlertDialogVariant, ReactNode> = {
  default: <CircleInfo className="size-5" />,
  accent: <CircleInfo className="size-5" />,
  success: <CircleCheckFill className="size-5" />,
  warning: <TriangleExclamationFill className="size-5" />,
  danger: <CircleExclamationFill className="size-5" />,
};

export const ScrollableAlertDialog = memo(function ScrollableAlertDialog({
  isOpen,
  onOpenChange,
  onClose,
  variant = "default",
  icon,
  title,
  subtitle,
  buttons,
  children,
  size = "lg",
  isDismissable = false,
  isKeyboardDismissDisabled = true,
}: ScrollableAlertDialogProps) {
  const resolvedIcon = icon ?? DEFAULT_ICONS[variant];

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange(open);
      if (!open) {
        onClose?.();
      }
    },
    [onOpenChange, onClose]
  );

  const handleButtonPress = useCallback(
    (buttonOnPress: () => void) => {
      onOpenChange(false);
      onClose?.();
      buttonOnPress();
    },
    [onOpenChange, onClose]
  );

  return (
    <AlertDialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialog.Backdrop
        isDismissable={isDismissable}
        isKeyboardDismissDisabled={isKeyboardDismissDisabled}
      >
        <AlertDialog.Container placement="center" size={size}>
          <AlertDialog.Dialog className="flex max-h-[90vh] flex-col">
            <AlertDialog.Header className="mb-8 shrink-0">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full",
                    ICON_VARIANT_CLASSES[variant]
                  )}
                >
                  {resolvedIcon}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium">{title}</span>
                  {subtitle && <span className="text-sm text-muted">{subtitle}</span>}
                </div>
              </div>
            </AlertDialog.Header>
            <div className="mb-8 min-h-0 flex-1">
              <Scrollbar className="h-full">{children}</Scrollbar>
            </div>
            {buttons && buttons.length > 0 && (
              <AlertDialog.Footer className="shrink-0 flex-col gap-2">
                {buttons.map((button) => (
                  <Button
                    key={button.key}
                    className="w-full"
                    variant={button.variant ?? "primary"}
                    isDisabled={button.isDisabled || button.isLoading}
                    isPending={button.isLoading}
                    onPress={() => handleButtonPress(button.onPress)}
                  >
                    {({ isPending }) =>
                      isPending ? <Spinner color="current" size="sm" /> : button.label
                    }
                  </Button>
                ))}
              </AlertDialog.Footer>
            )}
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
});
