import { memo, type ReactNode } from "react";
import { TitleBar } from "@/components/system";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-background select-none">
      <TitleBar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
});
