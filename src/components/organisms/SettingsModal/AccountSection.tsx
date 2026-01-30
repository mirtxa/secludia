import { memo, useCallback, useRef } from "react";
import { ArrowUpRightFromSquare } from "@gravity-ui/icons";
import { Button, Input, Label, Tabs, TextField } from "@heroui/react";
import { useAppContext, useUserContext, type Presence } from "@/context";
import { UserAvatar } from "@/components/atoms";

export const AccountSection = memo(function AccountSection() {
  const { t } = useAppContext();
  const { user, presence, setPresence } = useUserContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAvatarChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // TODO: Implement avatar upload
      console.log("Avatar file selected:", file.name);
    }
  }, []);

  const handleManageAccount = useCallback(() => {
    if (user) {
      window.open(`${user.homeserverUrl}/_matrix/client/v3/account`, "_blank");
    }
  }, [user]);

  const handleLogout = useCallback(() => {
    // TODO: Implement logout
    console.log("Logout clicked");
  }, []);

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <div className="flex flex-col items-center gap-3">
          <UserAvatar size="lg" showPresenceRing showEditButton onEditClick={handleAvatarClick} />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/apng,image/gif,image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleAvatarChange}
          />
          <Tabs selectedKey={presence} onSelectionChange={(key) => setPresence(key as Presence)}>
            <Tabs.ListContainer>
              <Tabs.List aria-label={t("SETTINGS_PRESENCE")}>
                <Tabs.Tab id="online">
                  {t("SETTINGS_PRESENCE_ONLINE")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="offline">
                  {t("SETTINGS_PRESENCE_OFFLINE")}
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="unavailable">
                  {t("SETTINGS_PRESENCE_UNAVAILABLE")}
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        <div className="flex flex-1 flex-col gap-4 w-full">
          <TextField className="w-full">
            <Label>{t("SETTINGS_DISPLAY_NAME")}</Label>
            <Input value={user.displayName} />
          </TextField>

          <TextField className="w-full" isReadOnly>
            <Label>{t("SETTINGS_USERNAME")}</Label>
            <Input value={user.username} />
          </TextField>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Button variant="secondary" onPress={handleManageAccount}>
          <ArrowUpRightFromSquare />
          {t("SETTINGS_MANAGE_ACCOUNT")}
        </Button>
        <Button variant="danger" onPress={handleLogout}>
          {t("SETTINGS_LOGOUT")}
        </Button>
      </div>
    </div>
  );
});
