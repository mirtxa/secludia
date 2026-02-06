export interface LoadingStateProps {
  /** Optional message to display below spinner */
  message?: string;
  /** Fill entire screen with background */
  fullscreen?: boolean;
  /** If provided, shows a cancel button that calls this handler */
  onCancel?: () => void;
}
