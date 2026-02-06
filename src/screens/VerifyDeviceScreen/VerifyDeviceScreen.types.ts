export interface VerifyDeviceScreenProps {
  /** Called when user successfully enters recovery key */
  onVerify: (recoveryKey: string) => void;
  /** Called when user chooses to continue without recovery key */
  onSkip: () => void;
  /** Called when user chooses to reset their identity */
  onResetIdentity: () => void;
  /** Whether verification is in progress */
  isVerifying?: boolean;
  /** Error message to display */
  error?: string;
}
