export interface SetupSecurityScreenProps {
  /** Called when user initiates recovery key creation */
  onCreateRecoveryKey: () => void;
  /** Whether setup is in progress */
  isSettingUp?: boolean;
  /** Error message to display */
  error?: string;
}

export interface RecoveryKeyDisplayProps {
  /** The generated recovery key to display */
  recoveryKey: string;
  /** Called when user confirms they've saved the key */
  onConfirm: () => void;
  /** Whether confirmation is in progress */
  isConfirming?: boolean;
}
