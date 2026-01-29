import { Card, CardHeader, CardContent, Button } from "@heroui/react";
import { useAppContext } from "@/context/AppContext";
import type { SecludiaLanguage } from "@/config/configTypes";

const LANGUAGES: SecludiaLanguage[] = ["en", "es"];

export function LanguageSwitcher() {
  const { config, setLanguage, t } = useAppContext();

  return (
    <Card className="max-w-md mx-auto mt-4">
      <CardHeader className="text-center">
        <h2 className="text-xl font-semibold">{t("language")}</h2>
      </CardHeader>

      <CardContent className="flex gap-2 justify-center">
        {LANGUAGES.map((lang) => (
          <Button
            key={lang}
            size="sm"
            variant={config.language === lang ? "primary" : "outline"}
            onPress={() => setLanguage(lang)}
          >
            {lang === "en" ? t("english") : t("spanish")}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
