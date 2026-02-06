import { memo, useState, useCallback } from "react";
import { LoadingState } from "@/components/atoms";
import { useAppContext, useCryptoContext } from "@/context";
import { VerifyDeviceScreen } from "@/screens/VerifyDeviceScreen";
import { SetupSecurityScreen, RecoveryKeyDisplay } from "@/screens/SetupSecurityScreen";
import type { SecuritySetupGateProps } from "./SecuritySetupGate.types";

/**
 * Gate component that handles security setup flow after authentication.
 * Uses CryptoContext to manage E2EE setup and verification.
 *
 * Flow:
 * 1. CryptoContext checks cross-signing status
 * 2. If has keys → Show VerifyDeviceScreen (enter recovery key)
 * 3. If no keys → Show SetupSecurityScreen (create recovery key)
 * 4. Once complete → Render children (main app)
 */
export const SecuritySetupGate = memo(function SecuritySetupGate({
  children,
}: SecuritySetupGateProps) {
  const { t } = useAppContext();
  const {
    status: cryptoStatus,
    error: cryptoError,
    bootstrapSecurity,
    verifyWithRecoveryKey,
    resetIdentity,
    skipVerification,
    cancelReset,
    clearError,
  } = useCryptoContext();

  const [isProcessing, setIsProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | undefined>();
  const [generatedKey, setGeneratedKey] = useState<string | undefined>();
  const [showingKey, setShowingKey] = useState(false);

  // Handle recovery key verification
  const handleVerify = useCallback(
    async (recoveryKey: string) => {
      setIsProcessing(true);
      setLocalError(undefined);
      clearError();

      try {
        const result = await verifyWithRecoveryKey(recoveryKey);

        if (!result.success && result.error) {
          // Try to translate the error code, fallback to message
          const errorKey = `CRYPTO_${result.error.code}` as Parameters<typeof t>[0];
          const translated = t(errorKey);
          setLocalError(translated !== errorKey ? translated : result.error.message);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [verifyWithRecoveryKey, clearError, t]
  );

  // Shared handler for crypto actions that produce a recovery key
  const handleCryptoAction = useCallback(
    async (
      action: () => Promise<{
        success: boolean;
        recoveryKey?: string;
        error?: { code: string; message: string };
      }>
    ) => {
      setIsProcessing(true);
      setLocalError(undefined);
      clearError();

      try {
        const result = await action();

        if (result.success && result.recoveryKey) {
          setGeneratedKey(result.recoveryKey);
          setShowingKey(true);
        } else if (!result.success && result.error) {
          const errorKey = `CRYPTO_${result.error.code}` as Parameters<typeof t>[0];
          const translated = t(errorKey);
          setLocalError(translated !== errorKey ? translated : result.error.message);
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [clearError, t]
  );

  // Handle identity reset
  const handleResetIdentity = useCallback(
    () => handleCryptoAction(resetIdentity),
    [handleCryptoAction, resetIdentity]
  );

  // Handle create recovery key
  const handleCreateRecoveryKey = useCallback(
    () => handleCryptoAction(bootstrapSecurity),
    [handleCryptoAction, bootstrapSecurity]
  );

  // Handle confirm key saved — user has saved recovery key, now mark as ready
  const handleConfirmKeySaved = useCallback(() => {
    setShowingKey(false);
    setGeneratedKey(undefined);
    skipVerification(); // Sets status to "ready", triggering full sync
  }, [skipVerification]);

  // Get error message from local error or crypto error
  const errorMessage =
    localError ??
    (cryptoError ? t(`CRYPTO_${cryptoError.code}` as Parameters<typeof t>[0]) : undefined);

  // Determine inner content based on crypto status
  let content: React.ReactNode;

  // Recovery key display takes priority — user must save their key before proceeding
  if (showingKey && generatedKey) {
    content = (
      <RecoveryKeyDisplay
        recoveryKey={generatedKey}
        onConfirm={handleConfirmKeySaved}
        isConfirming={false}
      />
    );
  } else if (cryptoStatus === "ready") {
    return <>{children}</>;
  } else {
    switch (cryptoStatus) {
      case "idle":
      case "initializing":
      case "checking_status":
        content = <LoadingState />;
        break;

      case "needs_verification":
      case "verifying":
        content = (
          <VerifyDeviceScreen
            onVerify={handleVerify}
            onSkip={skipVerification}
            onResetIdentity={handleResetIdentity}
            isVerifying={isProcessing || cryptoStatus === "verifying"}
            error={errorMessage}
          />
        );
        break;

      case "awaiting_approval":
        content = <LoadingState message={t("CRYPTO_AWAITING_APPROVAL")} onCancel={cancelReset} />;
        break;

      case "needs_setup":
      case "bootstrapping":
        content = (
          <SetupSecurityScreen
            onCreateRecoveryKey={handleCreateRecoveryKey}
            isSettingUp={isProcessing || cryptoStatus === "bootstrapping"}
            error={errorMessage}
          />
        );
        break;

      case "error":
        content = (
          <SetupSecurityScreen
            onCreateRecoveryKey={handleCreateRecoveryKey}
            isSettingUp={isProcessing}
            error={errorMessage}
          />
        );
        break;
    }
  }

  return <div className="flex h-full items-center justify-center">{content}</div>;
});
