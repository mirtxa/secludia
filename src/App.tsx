import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import "./globals.css";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LanguageSwitcher />
      <ThemeSwitcher />
    </div>
  );
}

export default App;
