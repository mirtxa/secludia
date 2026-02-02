import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppContextProvider, MediaRegistryProvider, UserContextProvider } from "@/context";
import { ErrorBoundary } from "@/components/layouts";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found. Ensure index.html has an element with id='root'.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppContextProvider>
        <UserContextProvider>
          <MediaRegistryProvider>
            <App />
          </MediaRegistryProvider>
        </UserContextProvider>
      </AppContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
