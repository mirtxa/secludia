import "./globals.css";
import { LoginScreen } from "@/screens/LoginScreen";

function App() {
  return (
    <div className="min-h-screen bg-background select-none sm:flex sm:items-center sm:justify-center">
      <LoginScreen onLogin={async () => {}} error="" isLoading={false} />
    </div>
  );
}

export default App;
