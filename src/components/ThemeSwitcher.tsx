import { Card, CardHeader, CardContent, Button } from "@heroui/react";
import { useAppContext } from "@/context/AppContext";
import type { SecludiaTheme } from "@/config/configTypes";

const THEMES: SecludiaTheme[] = [
  "ocean",
  "ocean-dark",
  "forest",
  "forest-dark",
];

export function ThemeSwitcher() {
  const { config, setTheme, t } = useAppContext();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <h2 className="text-xl font-semibold">{t("theme")}</h2>
        <p className="text-sm text-foreground/60">
          {t("currentTheme")}: <strong>{config.theme}</strong>
        </p>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-2 justify-center">
        {THEMES.map((theme) => (
          <Button
            key={theme}
            size="sm"
            variant={config.theme === theme ? "primary" : "outline"}
            onPress={() => setTheme(theme)}
          >
            {theme}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
