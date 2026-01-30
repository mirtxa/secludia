import { Component, type ReactNode, type ErrorInfo } from "react";
import { Button } from "@heroui/react";
import { t } from "@/i18n";
import { loadConfig } from "@/config/localStorage";
import { TitleBar } from "@/components/system";
import { ResponsiveCard } from "@/components/layouts/ResponsiveCard";
import type { ErrorBoundaryProps, ErrorBoundaryState } from "./ErrorBoundary.types";

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const lang = loadConfig().language;

      const title = <h1 className="text-2xl font-bold text-center">{t(lang, "ERROR_TITLE")}</h1>;

      const description = (
        <p className="text-center card__description mt-2 text-muted">
          {t(lang, "ERROR_DESCRIPTION")}
        </p>
      );

      const errorDetails = import.meta.env.DEV && this.state.error && (
        <code className="mt-4 block overflow-auto rounded bg-default p-4 text-left text-sm text-danger">
          {this.state.error.message}
        </code>
      );

      const resetButton = (
        <Button className="w-full" onPress={this.handleReset}>
          {t(lang, "ERROR_TRY_AGAIN")}
        </Button>
      );

      return (
        <div className="h-screen flex flex-col bg-background select-none">
          <TitleBar />
          <div className="flex-1 overflow-auto">
            <div className="h-full flex items-center justify-center">
              <ResponsiveCard
                header={
                  <>
                    {title}
                    {description}
                  </>
                }
                content={errorDetails}
                footer={resetButton}
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
