import { Component, type ReactNode, type ErrorInfo } from "react";
import type { ErrorBoundaryProps, ErrorBoundaryState } from "./ErrorBoundary.types";
import { t } from "@/i18n";
import { loadConfig } from "@/config/localStorage";
import { Button } from "@heroui/react";

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

      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
          <div className="max-w-md text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">{t(lang, "ERROR_TITLE")}</h1>
            <p className="mb-6 text-muted">{t(lang, "ERROR_DESCRIPTION")}</p>
            {import.meta.env.DEV && this.state.error && (
              <code className="mb-6 block overflow-auto rounded bg-content1 p-4 text-left text-sm text-danger">
                {this.state.error.message}
              </code>
            )}
            <Button onPress={this.handleReset}>{t(lang, "ERROR_TRY_AGAIN")}</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
