/**
 * Tauri platform implementation
 */

import type { Platform, PlatformPermissions } from "../types";
import { storage } from "./storage";
import { oauth } from "./oauth-window";

const permissions: PlatformPermissions = {
  async resetWebViewPermissions(): Promise<void> {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("reset_webview_permissions");
  },
};

const platform: Platform = {
  isTauri: true,
  isWeb: false,
  storage,
  oauth,
  permissions,
};

export default platform;
