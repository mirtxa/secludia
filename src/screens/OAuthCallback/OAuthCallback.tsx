import { memo, useEffect } from "react";
import { LoadingState } from "@/components/atoms";
import { useAppContext } from "@/context";

/**
 * OAuth callback page for web.
 * This page is opened in a popup window and sends the callback URL back to the opener.
 */
export const OAuthCallback = memo(function OAuthCallback() {
  const { t } = useAppContext();

  useEffect(() => {
    // Parse the callback URL for any errors (fragment mode for web)
    const params = new URLSearchParams(window.location.hash.slice(1));
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    if (window.opener) {
      // Send callback to opener window
      window.opener.postMessage(
        {
          type: "oauth_callback",
          url: window.location.href,
          error: error ? (errorDescription ?? error) : undefined,
        },
        window.location.origin
      );

      // Clear auth code from history before closing
      window.history.replaceState({}, "", "/oauth/callback");

      // Close this window after a short delay
      setTimeout(() => {
        window.close();
      }, 100);
    } else {
      // No opener - redirect to main page
      // This handles the case where the user navigates directly to this URL
      window.location.href = "/";
    }
  }, []);

  return <LoadingState fullscreen message={t("AUTH_STATUS_COMPLETING")} />;
});
