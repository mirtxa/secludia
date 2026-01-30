import "./globals.css";
import { useState, useCallback } from "react";
import { AppLayout } from "@/components/layouts";
import { LoginScreen } from "@/screens/LoginScreen";
import { MainScreen } from "@/screens/MainScreen";

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
    <AppLayout>
      {screen === "login" ? (
        <div className="h-full flex items-center justify-center">
          <LoginScreen onLogin={handleLogin} error="" isLoading={false} />
        </div>
      ) : (
        <MainScreen homeserver={homeserver} onLogout={handleLogout} />
      )}
    </AppLayout>
  );
}

export default App;
