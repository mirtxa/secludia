import { memo } from "react";
import { ThemeSelector } from "../ThemeSelector";
import { LanguageSelector } from "../LanguageSelector";

export const AuthSelectors = memo(function AuthSelectors() {
  return (
    <div className="flex justify-center gap-2">
      <ThemeSelector />
      <LanguageSelector />
    </div>
  );
});
