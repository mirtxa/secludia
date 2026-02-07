import { memo, useState, useCallback } from "react";
import { Alert, Button, Checkbox, Label, Spinner } from "@heroui/react";
import { Copy, Check, Key } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { ResponsiveCard } from "@/components/layouts";
import { AuthSelectors } from "@/components/atoms";
import type { RecoveryKeyDisplayProps } from "./SetupSecurityScreen.types";

export const RecoveryKeyDisplay = memo(function RecoveryKeyDisplay({
  recoveryKey,
  onConfirm,
  isConfirming = false,
}: RecoveryKeyDisplayProps) {
  const { t } = useAppContext();
  const [hasCopied, setHasCopied] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      // Clipboard API not available in this environment
    }
  }, [recoveryKey]);

  const handleSavedChange = useCallback((isSelected: boolean) => {
    setHasSaved(isSelected);
  }, []);

  return (
    <ResponsiveCard
      header={
        <>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-accent/10 p-4">
              <Key className="size-8 text-accent" />
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold">{t("SETUP_KEY_GENERATED_TITLE")}</h1>
          <p className="mt-2 text-center">{t("SETUP_KEY_GENERATED_DESCRIPTION")}</p>
        </>
      }
      content={
        <div className="space-y-4">
          <div className="relative">
            <div className="rounded-lg bg-surface-alt p-4 font-mono text-sm break-all select-all border border-default">
              {recoveryKey}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onPress={handleCopy}
              aria-label={t("SETUP_COPY_KEY")}
            >
              {hasCopied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
            </Button>
          </div>

          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{t("SETUP_KEY_WARNING")}</Alert.Description>
            </Alert.Content>
          </Alert>

          <Checkbox isSelected={hasSaved} onChange={handleSavedChange}>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label>{t("SETUP_KEY_SAVED_CHECKBOX")}</Label>
            </Checkbox.Content>
          </Checkbox>
        </div>
      }
      footer={
        <Button
          className="w-full"
          isDisabled={!hasSaved || isConfirming}
          isPending={isConfirming}
          onPress={onConfirm}
        >
          {({ isPending }) =>
            isPending ? <Spinner color="current" size="sm" /> : t("SETUP_CONTINUE")
          }
        </Button>
      }
      bottomBar={<AuthSelectors />}
    />
  );
});
