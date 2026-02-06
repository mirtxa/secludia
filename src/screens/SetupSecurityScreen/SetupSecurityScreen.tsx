import { memo } from "react";
import { Button, FieldError, Spinner } from "@heroui/react";
import {
  CircleExclamationFill,
  Key,
  ShieldKeyhole,
  Lock,
  ArrowRotateRight,
} from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { AuthSelectors, LabeledItem } from "@/components/atoms";
import { ResponsiveCard } from "@/components/layouts";
import type { SetupSecurityScreenProps } from "./SetupSecurityScreen.types";

export const SetupSecurityScreen = memo(function SetupSecurityScreen({
  onCreateRecoveryKey,
  isSettingUp = false,
  error,
}: SetupSecurityScreenProps) {
  const { t } = useAppContext();

  return (
    <ResponsiveCard
      header={
        <>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-accent/10 p-4">
              <ShieldKeyhole className="size-8 text-accent" />
            </div>
          </div>
          <h1 className="text-center text-2xl font-bold">{t("SETUP_SECURITY_TITLE")}</h1>
          <p className="mt-2 text-center">{t("SETUP_SECURITY_DESCRIPTION")}</p>
        </>
      }
      content={
        <div className="space-y-4">
          <div className="space-y-4">
            <LabeledItem
              icon={<Key className="size-5" />}
              label={t("SETUP_STEP_1_TITLE")}
              description={t("SETUP_STEP_1_DESCRIPTION")}
              alwaysShowIcon
            />
            <LabeledItem
              icon={<Lock className="size-5" />}
              label={t("SETUP_STEP_2_TITLE")}
              description={t("SETUP_STEP_2_DESCRIPTION")}
              alwaysShowIcon
            />
            <LabeledItem
              icon={<ArrowRotateRight className="size-5" />}
              label={t("SETUP_STEP_3_TITLE")}
              description={t("SETUP_STEP_3_DESCRIPTION")}
              alwaysShowIcon
            />
          </div>

          {error && (
            <FieldError>
              <CircleExclamationFill className="inline" /> {error}
            </FieldError>
          )}
        </div>
      }
      footer={
        <Button
          className="w-full"
          isDisabled={isSettingUp}
          isPending={isSettingUp}
          onPress={onCreateRecoveryKey}
        >
          {({ isPending }) =>
            isPending ? <Spinner color="current" size="sm" /> : t("SETUP_CREATE_RECOVERY_KEY")
          }
        </Button>
      }
      bottomBar={<AuthSelectors />}
    />
  );
});
