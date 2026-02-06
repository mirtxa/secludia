import { memo, useState, useMemo, useCallback } from "react";
import { Button, FieldError, InputGroup, Label, Spinner, TextField } from "@heroui/react";
import { CircleExclamationFill } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { AuthSelectors, LoadingState, Typewriter } from "@/components/atoms";
import { ResponsiveCard } from "@/components/layouts";
import { validateHomeserver, buildHomeserverUrl } from "@/utils";
import type { LoginScreenProps } from "./LoginScreen.types";

export const LoginScreen = memo(function LoginScreen({
  onLogin,
  error,
  isLoading,
  loadingMessage,
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

  const handleHomeserverChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setHomeserver(event.target.value);
  }, []);

  const typewriterPhrases = useMemo(
    () => [
      t("LOGIN_TYPEWRITERTEXT_1"),
      t("LOGIN_TYPEWRITERTEXT_2"),
      t("LOGIN_TYPEWRITERTEXT_3"),
      t("LOGIN_TYPEWRITERTEXT_4"),
    ],
    [t]
  );

  // Show loading state without card
  if (isLoading && loadingMessage) {
    return <LoadingState message={loadingMessage} fullscreen />;
  }

  return (
    <ResponsiveCard
      header={
        <>
          <h1 className="text-center text-2xl font-bold">{t("APP_TITLE")}</h1>
          <p className="mt-2 text-center">
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
          <p className="mx-6 mt-4 text-center text-muted">{t("LOGIN_DISCLAIMER")}</p>
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
      bottomBar={<AuthSelectors />}
    />
  );
});
