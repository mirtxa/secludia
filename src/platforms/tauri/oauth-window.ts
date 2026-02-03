/**
 * Tauri OAuth window
 * Opens a WebView window that intercepts navigation to the callback URL
 */

import type { OAuthWindow } from "../types";

export const oauth: OAuthWindow = {
  async open(url: string): Promise<string> {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke<string>("open_oauth_window", { url });
  },
};
