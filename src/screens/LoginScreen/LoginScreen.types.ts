export interface LoginScreenProps {
  onLogin: (homeserver: string) => Promise<void>;
  error: string;
  isLoading: boolean;
}