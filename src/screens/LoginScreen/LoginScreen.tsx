import { memo, useState, useMemo, useCallback } from "react";
import { Button, FieldError, InputGroup, Label, Spinner, Text, TextField } from "@heroui/react";
import { CircleExclamationFill } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { LanguageSelector, ThemeSelector, Typewriter } from "@/components/atoms";
import { ResponsiveCard } from "@/components/layouts";
import { validateHomeserver, buildHomeserverUrl } from "@/utils";
import type { LoginScreenProps } from "./LoginScreen.types";

const SELECTORS = (
  <div className="flex justify-center gap-2">
    <ThemeSelector />
    <LanguageSelector />
  </div>
);

export const LoginScreen = memo(function LoginScreen({
  onLogin,
  error,
  isLoading,
}: LoginScreenProps) {
  const [homeserver, setHomeserver] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const { t } = useAppContext();

  const validatedHomeserver = useMemo(() => validateHomeserver(homeserver), [homeserver]);
  const hasValidationError = hasAttemptedSubmit && validatedHomeserver === null;
  const fieldError = error || (hasValidationError ? t("LOGIN_HOMESERVER_INVALID") : "");
  const isFormValid = validatedHomeserver !== null;

  const handleLogin = useCallback(() => {
    setHasAttemptedSubmit(true);
    if (validatedHomeserver) {
      onLogin(buildHomeserverUrl(validatedHomeserver));
    }
  }, [validatedHomeserver, onLogin]);

  const handleHomeserverChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setHomeserver(event.target.value),
    []
  );

  const typewriterPhrases = useMemo(
    () => [
      t("LOGIN_TYPEWRITERTEXT_1"),
      t("LOGIN_TYPEWRITERTEXT_2"),
      t("LOGIN_TYPEWRITERTEXT_3"),
      t("LOGIN_TYPEWRITERTEXT_4"),
    ],
    [t]
  );

  return (
    <ResponsiveCard
      header={
        <>
          <h1 className="text-center text-2xl font-bold">{t("APP_TITLE")}</h1>
          <p className="card__description mt-2 text-center">
            <Typewriter phrases={typewriterPhrases} />
          </p>
        </>
      }
      content={
        <>
          <TextField isInvalid={!!fieldError} isRequired className="w-full" name="homeserver">
            <Label>{t("LOGIN_HOMESERVER")}</Label>
            <InputGroup>
              <InputGroup.Prefix>https://</InputGroup.Prefix>
              <InputGroup.Input
                placeholder="matrix.org"
                type="url"
                onChange={handleHomeserverChange}
              />
            </InputGroup>
            {fieldError && (
              <FieldError>
                <CircleExclamationFill className="inline" /> {fieldError}
              </FieldError>
            )}
          </TextField>
          <div className="text-center mt-4 mx-6">
            <Text className="card__description text-muted">{t("LOGIN_DISCLAIMER")}</Text>
          </div>
        </>
      }
      footer={
        <Button
          className="w-full"
          type="submit"
          isDisabled={!isFormValid || isLoading}
          isPending={isLoading}
          onPress={handleLogin}
        >
          {({ isPending }) =>
            isPending ? <Spinner color="current" size="sm" /> : t("LOGIN_SUBMIT")
          }
        </Button>
      }
      bottomBar={SELECTORS}
    />
  );
});
