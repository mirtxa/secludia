/**
 * Web platform implementation
 */

import type { Platform, PlatformPermissions } from "../types";
import { storage } from "./storage";
import { oauth } from "./oauth-popup";

const permissions: PlatformPermissions = {
  async resetWebViewPermissions(): Promise<void> {
    // No-op on web - browser permissions are managed by the browser
  },
};

const platform: Platform = {
  isTauri: false,
  isWeb: true,
  storage,
  oauth,
  permissions,
};

export default platform;
