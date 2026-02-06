import { memo, useState, useCallback } from "react";
import {
  Button,
  Description,
  FieldError,
  Label,
  Spinner,
  TextArea,
  TextField,
} from "@heroui/react";
import {
  ArrowsRotateRight,
  CircleExclamationFill,
  CommentSlash,
  Eye,
  ShieldKeyhole,
} from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { AuthSelectors, LabeledItem } from "@/components/atoms";
import { ResponsiveCard } from "@/components/layouts";
import { ScrollableAlertDialog } from "@/components/molecules";
import type { VerifyDeviceScreenProps } from "./VerifyDeviceScreen.types";

export const VerifyDeviceScreen = memo(function VerifyDeviceScreen({
  onVerify,
  onSkip,
  onResetIdentity,
  isVerifying = false,
  error,
}: VerifyDeviceScreenProps) {
  const { t } = useAppContext();
  const [recoveryKey, setRecoveryKey] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleRecoveryKeyChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRecoveryKey(e.target.value);
  }, []);

  const handleVerify = useCallback(() => {
    if (recoveryKey.trim()) {
      onVerify(recoveryKey.trim());
    }
  }, [recoveryKey, onVerify]);

  const handleNoRecoveryKey = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const handleConfirmIdentity = useCallback(() => {
    // User wants to go back and try to find their key
    // Dialog closes and they stay on the screen
  }, []);

  const isFormValid = recoveryKey.trim().length > 0;

  return (
    <>
      <ResponsiveCard
        header={
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-accent/10 p-4">
                <ShieldKeyhole className="size-8 text-accent" />
              </div>
            </div>
            <h1 className="text-center text-2xl font-bold">{t("VERIFY_DEVICE_TITLE")}</h1>
            <p className="mt-2 text-center">{t("VERIFY_DEVICE_DESCRIPTION")}</p>
          </>
        }
        content={
          <TextField isInvalid={!!error} className="w-full" name="recoveryKey">
            <Label>{t("VERIFY_RECOVERY_KEY_LABEL")}</Label>
            <TextArea
              placeholder={t("VERIFY_RECOVERY_KEY_PLACEHOLDER")}
              value={recoveryKey}
              onChange={handleRecoveryKeyChange}
              rows={3}
              className="font-mono text-sm"
            />
            {error && (
              <FieldError>
                <CircleExclamationFill className="inline" /> {error}
              </FieldError>
            )}
            <Description className="mt-2 text-xs">{t("VERIFY_RECOVERY_KEY_HINT")}</Description>
          </TextField>
        }
        footer={
          <div className="flex flex-col gap-2 w-full">
            <Button
              className="w-full"
              type="submit"
              isDisabled={!isFormValid || isVerifying}
              isPending={isVerifying}
              onPress={handleVerify}
            >
              {({ isPending }) =>
                isPending ? <Spinner color="current" size="sm" /> : t("VERIFY_CONFIRM")
              }
            </Button>
            <Button
              className="w-full"
              variant="ghost"
              isDisabled={isVerifying}
              onPress={handleNoRecoveryKey}
            >
              {t("VERIFY_NO_RECOVERY_KEY")}
            </Button>
          </div>
        }
        bottomBar={<AuthSelectors />}
      />

      <ScrollableAlertDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isDismissable
        isKeyboardDismissDisabled={false}
        variant="warning"
        title={t("VERIFY_NO_KEY_TITLE")}
        subtitle={t("VERIFY_NO_KEY_DESCRIPTION")}
        buttons={[
          {
            key: "confirm-identity",
            label: t("VERIFY_NO_KEY_CONFIRM_IDENTITY"),
            variant: "primary",
            onPress: handleConfirmIdentity,
          },
          {
            key: "reset-identity",
            label: t("VERIFY_NO_KEY_RESET_IDENTITY"),
            variant: "danger",
            onPress: onResetIdentity,
          },
          {
            key: "continue-without",
            label: t("VERIFY_NO_KEY_CONTINUE_WITHOUT"),
            variant: "ghost",
            onPress: onSkip,
          },
        ]}
      >
        <div className="space-y-3">
          <LabeledItem
            icon={<CommentSlash className="size-5" />}
            label={t("VERIFY_NO_KEY_CONSEQUENCE_1")}
            alwaysShowIcon
          />
          <LabeledItem
            icon={<Eye className="size-5" />}
            label={t("VERIFY_NO_KEY_CONSEQUENCE_2")}
            alwaysShowIcon
          />
          <LabeledItem
            icon={<ArrowsRotateRight className="size-5" />}
            label={t("VERIFY_NO_KEY_CONSEQUENCE_3")}
            alwaysShowIcon
          />
        </div>
      </ScrollableAlertDialog>
    </>
  );
});
