export type ControlButtonType = "minimize" | "maximize" | "close";

export interface ControlButtonProps {
  type: ControlButtonType;
  icon: React.ReactNode;
  onPress: () => void;
}
