/**
 * Web OAuth popup window
 * Opens a popup that communicates via postMessage
 */

import type { OAuthWindow } from "../types";

export const oauth: OAuthWindow = {
  open(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        url,
        "matrix-auth",
        `popup,width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        reject(new Error("Failed to open popup window. Please allow popups for this site."));
        return;
      }

      let settled = false;

      const handleMessage = (event: MessageEvent) => {
        if (settled) return;
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== "oauth_callback") return;

        cleanup();
        popup.close();

        if (event.data.error) {
          reject(new Error(event.data.error));
        } else if (event.data.url) {
          resolve(event.data.url);
        } else {
          reject(new Error("Invalid OAuth callback response"));
        }
      };

      // Check if popup was closed without completing
      const checkClosedInterval = setInterval(() => {
        if (popup.closed && !settled) {
          cleanup();
          reject(new Error("OAUTH_CANCELLED"));
        }
      }, 500);

      // Timeout after 5 minutes
      const timeoutId = setTimeout(() => {
        if (settled) return;
        cleanup();
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error("OAUTH_TIMEOUT"));
      }, 300_000);

      const cleanup = () => {
        settled = true;
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosedInterval);
        clearTimeout(timeoutId);
      };

      window.addEventListener("message", handleMessage);
    });
  },
};
