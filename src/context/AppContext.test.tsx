import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AppContextProvider, useAppContext } from ".";

// Test component that uses the context
function TestConsumer() {
  const { t, theme, language, setTheme, setLanguage } = useAppContext();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="language">{language}</span>
      <span data-testid="translation">{t("LOGIN_SUBMIT")}</span>
      <button data-testid="change-theme" onClick={() => setTheme("midnight")}>
        Change Theme
      </button>
      <button data-testid="change-language" onClick={() => setLanguage("es")}>
        Change Language
      </button>
    </div>
  );
}

describe("AppContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dataset.theme = "";
    document.documentElement.lang = "";
  });

  it("provides default values", () => {
    render(
      <AppContextProvider>
        <TestConsumer />
      </AppContextProvider>
    );

    expect(screen.getByTestId("theme").textContent).toBe("default");
    expect(screen.getByTestId("language").textContent).toBe("en");
  });

  it("provides translation function", () => {
    render(
      <AppContextProvider>
        <TestConsumer />
      </AppContextProvider>
    );

    expect(screen.getByTestId("translation").textContent).toBe("Log in");
  });

  it("updates theme when setTheme is called", () => {
    render(
      <AppContextProvider>
        <TestConsumer />
      </AppContextProvider>
    );

    act(() => {
      screen.getByTestId("change-theme").click();
    });

    expect(screen.getByTestId("theme").textContent).toBe("midnight");
    expect(document.documentElement.dataset.theme).toBe("midnight");
  });

  it("updates language when setLanguage is called", () => {
    render(
      <AppContextProvider>
        <TestConsumer />
      </AppContextProvider>
    );

    act(() => {
      screen.getByTestId("change-language").click();
    });

    expect(screen.getByTestId("language").textContent).toBe("es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("throws when useAppContext is used outside provider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestConsumer />);
    }).toThrow("useAppContext must be used inside AppContextProvider");

    consoleSpy.mockRestore();
  });

  it("persists theme to localStorage", () => {
    render(
      <AppContextProvider>
        <TestConsumer />
      </AppContextProvider>
    );

    act(() => {
      screen.getByTestId("change-theme").click();
    });

    const stored = JSON.parse(localStorage.getItem("secludia.config")!);
    expect(stored.theme).toBe("midnight");
  });

  it("persists language to localStorage", () => {
    render(
      <AppContextProvider>
        <TestConsumer />
      </AppContextProvider>
    );

    act(() => {
      screen.getByTestId("change-language").click();
    });

    const stored = JSON.parse(localStorage.getItem("secludia.config")!);
    expect(stored.language).toBe("es");
  });
});
