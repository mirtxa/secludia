import { memo, useState, useMemo, useCallback } from "react";
import { Button, FieldError, InputGroup, Label, Spinner, Text, TextField } from "@heroui/react";
import { CircleExclamationFill } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { LanguageSelector, ThemeSelector, Typewriter } from "@/components/atoms";
import { ResponsiveCard } from "@/components/layouts";
import { validateHomeserver, buildHomeserverUrl } from "@/utils";
import type { LoginScreenProps } from "./LoginScreen.types";

const TITLE = <h1 className="text-2xl font-bold text-center">Secludia</h1>;

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
  const { t } = useAppContext();

  const validatedHomeserver = useMemo(() => validateHomeserver(homeserver), [homeserver]);
  const hasValidationError = homeserver.length > 0 && validatedHomeserver === null;
  const fieldError = error || (hasValidationError ? t("LOGIN_HOMESERVER_INVALID") : "");

  const handleLogin = useCallback(() => {
    if (validatedHomeserver) {
      onLogin(buildHomeserverUrl(validatedHomeserver));
    }
  }, [validatedHomeserver, onLogin]);

  const handleHomeserverChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setHomeserver(event.target.value),
    []
  );

  const isFormValid = validatedHomeserver !== null;

  const typewriterPhrases = useMemo(
    () => [
      t("LOGIN_TYPEWRITERTEXT_1"),
      t("LOGIN_TYPEWRITERTEXT_2"),
      t("LOGIN_TYPEWRITERTEXT_3"),
      t("LOGIN_TYPEWRITERTEXT_4"),
    ],
    [t]
  );

  const tagline = useMemo(
    () => (
      <p className="text-center card__description mt-2">
        <Typewriter phrases={typewriterPhrases} />
      </p>
    ),
    [typewriterPhrases]
  );

  const homeserverField = useMemo(
    () => (
      <TextField isInvalid={!!fieldError} isRequired className="w-full" name="homeserver">
        <Label>{t("LOGIN_HOMESERVER")}</Label>
        <InputGroup>
          <InputGroup.Prefix>https://</InputGroup.Prefix>
          <InputGroup.Input placeholder="matrix.org" type="url" onChange={handleHomeserverChange} />
        </InputGroup>
        {fieldError && (
          <FieldError>
            <CircleExclamationFill className="inline" /> {fieldError}
          </FieldError>
        )}
      </TextField>
    ),
    [fieldError, t, handleHomeserverChange]
  );

  const disclaimer = useMemo(
    () => (
      <div className="text-center mt-4 mx-6">
        <Text className="card__description text-muted">{t("LOGIN_DISCLAIMER")}</Text>
      </div>
    ),
    [t]
  );

  const loginButton = useMemo(
    () => (
      <Button
        className="w-full"
        type="submit"
        isDisabled={!isFormValid || isLoading}
        isPending={isLoading}
        onPress={handleLogin}
      >
        {({ isPending }) => (isPending ? <Spinner color="current" size="sm" /> : t("LOGIN_SUBMIT"))}
      </Button>
    ),
    [isFormValid, isLoading, handleLogin, t]
  );

  return (
    <ResponsiveCard
      header={
        <>
          {TITLE}
          {tagline}
        </>
      }
      content={
        <>
          {homeserverField}
          {disclaimer}
        </>
      }
      footer={loginButton}
      bottomBar={SELECTORS}
    />
  );
});
