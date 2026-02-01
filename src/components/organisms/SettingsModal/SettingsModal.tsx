import { memo, useState, useCallback, useMemo } from "react";
import { Bell, Key, Lock, Palette, Person, Smartphone } from "@gravity-ui/icons";
import { Button, Modal, Tooltip } from "@heroui/react";
import { Scrollbar } from "@/components/atoms";
import { useAppContext } from "@/context";
import { useBreakpoint } from "@/hooks";
import { AccountSection } from "./AccountSection";
import { AppearanceSection } from "./AppearanceSection";
import { NotificationsSection } from "./NotificationsSection";
import { SessionsSection } from "./SessionsSection";
import type { SettingsModalProps, SettingsSection } from "./SettingsModal.types";
import "./SettingsModal.css";

const SECTIONS: { key: SettingsSection; labelKey: string; icon: React.ReactNode }[] = [
  { key: "account", labelKey: "SETTINGS_ACCOUNT", icon: <Person /> },
  { key: "sessions", labelKey: "SETTINGS_SESSIONS", icon: <Smartphone /> },
  { key: "appearance", labelKey: "SETTINGS_APPEARANCE", icon: <Palette /> },
  { key: "notifications", labelKey: "SETTINGS_NOTIFICATIONS", icon: <Bell /> },
  { key: "security", labelKey: "SETTINGS_SECURITY", icon: <Lock /> },
  { key: "encryption", labelKey: "SETTINGS_ENCRYPTION", icon: <Key /> },
];

export const SettingsModal = memo(function SettingsModal({ state }: SettingsModalProps) {
  const { t } = useAppContext();
  const isDesktop = useBreakpoint("md");
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");

  const handleSectionChange = useCallback((section: SettingsSection) => {
    setActiveSection(section);
  }, []);

  const activeSectionLabel = useMemo(() => {
    const section = SECTIONS.find((s) => s.key === activeSection);
    return section ? t(section.labelKey as Parameters<typeof t>[0]) : "";
  }, [activeSection, t]);

  return (
    <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen} variant="opaque">
      <Modal.Container size={isDesktop ? "lg" : "full"}>
        <Modal.Dialog className="settings-modal h-full max-h-full overflow-hidden p-0 md:max-w-6xl">
          <Modal.CloseTrigger className="z-10" />
          <div className="flex h-full">
            <nav className="settings-modal__nav flex shrink-0 flex-col gap-1 border-r border-border bg-surface p-4">
              {SECTIONS.map((section) => {
                const label = t(section.labelKey as Parameters<typeof t>[0]);
                const isActive = activeSection === section.key;

                const button = (
                  <Button
                    aria-label={label}
                    variant="ghost"
                    className={`settings-modal__nav-item justify-start gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-default"
                    }`}
                    onPress={() => handleSectionChange(section.key)}
                  >
                    {section.icon}
                    <span>{label}</span>
                  </Button>
                );

                if (isDesktop) {
                  return <div key={section.key}>{button}</div>;
                }

                return (
                  <Tooltip key={section.key} delay={0}>
                    {button}
                    <Tooltip.Content placement="right" offset={12} className="rounded-lg">
                      {label}
                    </Tooltip.Content>
                  </Tooltip>
                );
              })}
            </nav>
            <Scrollbar className="flex min-w-0 flex-1 flex-col">
              <div className="p-4 md:p-6">
                <h2 className="mb-6 text-xl font-semibold">{activeSectionLabel}</h2>
                <div className="flex-1">
                  {activeSection === "account" && <AccountSection />}
                  {activeSection === "sessions" && <SessionsSection />}
                  {activeSection === "appearance" && <AppearanceSection />}
                  {activeSection === "notifications" && <NotificationsSection />}
                </div>
              </div>
            </Scrollbar>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
});
