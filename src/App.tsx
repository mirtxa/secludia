import "./globals.css";
import { useState, useCallback } from "react";
import { LoginScreen } from "@/screens/LoginScreen";
import { MainScreen } from "@/screens/MainScreen";
import { TitleBar } from "@/components/system";

type Screen = "login" | "main";

function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [homeserver, setHomeserver] = useState("");

  const handleLogin = useCallback(async (server: string) => {
    setHomeserver(server);
    setScreen("main");
  }, []);

  const handleLogout = useCallback(() => {
    setHomeserver("");
    setScreen("login");
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background select-none">
      <TitleBar />
      <div className="flex-1 overflow-auto">
        {screen === "login" ? (
          <div className="h-full flex items-center justify-center">
            <LoginScreen onLogin={handleLogin} error="" isLoading={false} />
          </div>
        ) : (
          <MainScreen homeserver={homeserver} onLogout={handleLogout} />
        )}
      </div>
    </div>
  );
}

export default App;
