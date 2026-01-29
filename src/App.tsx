import "./globals.css";
import { LoginScreen } from "@/screens/LoginScreen";
import { TitleBar } from "@/components/system";

function App() {
  return (
    <div className="h-screen flex flex-col bg-background select-none">
      <TitleBar />
      <div className="flex-1 sm:flex sm:items-center sm:justify-center overflow-auto">
        <LoginScreen onLogin={async () => {}} error="" isLoading={false} />
      </div>
    </div>
  );
}

export default App;
