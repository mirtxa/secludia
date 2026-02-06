import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {
  AppProvider,
  AuthProvider,
  CryptoProvider,
  MediaRegistryProvider,
  UserProvider,
} from "@/context";
import { ErrorBoundary } from "@/components/layouts";
import { PlatformProvider, loadPlatform } from "@/platforms";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Ensure index.html has an element with id='root'.");
}

// Load platform-specific implementations before rendering
loadPlatform().then((platform) => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <PlatformProvider platform={platform}>
          <AppProvider>
            <AuthProvider>
              <CryptoProvider>
                <UserProvider>
                  <MediaRegistryProvider>
                    <App />
                  </MediaRegistryProvider>
                </UserProvider>
              </CryptoProvider>
            </AuthProvider>
          </AppProvider>
        </PlatformProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
});
