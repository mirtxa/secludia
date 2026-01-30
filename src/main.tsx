import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppContextProvider, UserContextProvider } from "@/context";
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
          <App />
        </UserContextProvider>
      </AppContextProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
