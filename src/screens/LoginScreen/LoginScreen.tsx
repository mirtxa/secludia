import {
  Button,
  FieldError,
  InputGroup,
  Label,
  Spinner,
  Text,
  TextField,
} from "@heroui/react";
import { LoginScreenProps } from "./LoginScreen.types";
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  LanguageSelector,
  ThemeSelector,
  Typewriter,
} from "@/components/atoms";
import { ResponsiveCard } from "@/components/layouts";
import { CircleExclamationFill } from "@gravity-ui/icons";

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  error,
  isLoading,
}) => {
  const [homeserver, setHomeserver] = useState<string>("");
  const { t } = useAppContext();

  const handleLogin = () => {
    if (homeserver.trim()) {
      onLogin(homeserver.trim());
    }
  };

  const isFormValid = homeserver.trim().length > 0;

  const typewriterPhrases = [
    t("LOGIN_TYPEWRITERTEXT_1"),
    t("LOGIN_TYPEWRITERTEXT_2"),
    t("LOGIN_TYPEWRITERTEXT_3"),
    t("LOGIN_TYPEWRITERTEXT_4"),
  ];

  const title = <h1 className="text-2xl font-bold text-center">Secludia</h1>;

  const tagline = (
    <p className="text-center card__description mt-2">
      <Typewriter phrases={typewriterPhrases} />
    </p>
  );

  const homeserverField = (
    <TextField
      isInvalid={!!error}
      isRequired
      className="w-full"
      name="homeserver"
    >
      <Label>{t("LOGIN_HOMESERVER")}</Label>
      <InputGroup>
        <InputGroup.Prefix>https://</InputGroup.Prefix>
        <InputGroup.Input
          placeholder="matrix.org"
          type="url"
          onChange={(event) => setHomeserver(event.target.value)}
        />
      </InputGroup>
      <FieldError>
        <CircleExclamationFill className="inline" />{" "}
        {t("LOGIN_HOMESERVER_INVALID")}
      </FieldError>
    </TextField>
  );

  const disclaimer = (
    <div className="text-center mt-4 mx-6">
      <Text className="card__description">{t("LOGIN_DISCLAIMER")}</Text>
    </div>
  );

  const loginButton = (
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
  );

  const selectors = (
    <div className="flex justify-center gap-2">
      <ThemeSelector />
      <LanguageSelector />
    </div>
  );

  return (
    <ResponsiveCard
      header={
        <>
          {title}
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
      bottomBar={selectors}
    />
  );
};
