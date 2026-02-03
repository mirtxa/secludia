/**
 * Platform context type definition
 */

import { createContext } from "react";
import type { Platform } from "./types";

export const PlatformContext = createContext<Platform | null>(null);
