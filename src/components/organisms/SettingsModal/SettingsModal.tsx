import { memo, useState, useCallback, useMemo } from "react";
import { Bell, Key, Lock, Palette, Person, Smartphone } from "@gravity-ui/icons";
import { Modal, Tooltip } from "@heroui/react";
import { useAppContext } from "@/context";
import { useBreakpoint } from "@/hooks";
import { AccountSection } from "./AccountSection";
import { AppearanceSection } from "./AppearanceSection";
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

export const SettingsModal = memo(function SettingsModal({
  isOpen,
  onOpenChange,
}: SettingsModalProps) {
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
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      variant="opaque"
      className="settings-modal-backdrop"
    >
      <Modal.Container size={isDesktop ? "lg" : "full"}>
        <Modal.Dialog className="settings-modal md:max-w-6xl">
          <Modal.CloseTrigger />
          <div className="settings-modal__layout">
            <nav className="settings-modal__nav">
              {SECTIONS.map((section) => {
                const label = t(section.labelKey as Parameters<typeof t>[0]);
                const buttonClass =
                  activeSection === section.key
                    ? "settings-modal__nav-item settings-modal__nav-item--active"
                    : "settings-modal__nav-item";

                const button = (
                  <button
                    type="button"
                    className={buttonClass}
                    onClick={() => handleSectionChange(section.key)}
                  >
                    {section.icon}
                    <span>{label}</span>
                  </button>
                );

                if (isDesktop) {
                  return <div key={section.key}>{button}</div>;
                }

                return (
                  <Tooltip key={section.key} delay={0}>
                    <Tooltip.Trigger aria-label={label}>{button}</Tooltip.Trigger>
                    <Tooltip.Content placement="right" offset={12} className="rounded-lg">
                      {label}
                    </Tooltip.Content>
                  </Tooltip>
                );
              })}
            </nav>
            <div className="settings-modal__content">
              <h2 className="settings-modal__title">{activeSectionLabel}</h2>
              <div className="settings-modal__body">
                {activeSection === "account" && <AccountSection />}
                {activeSection === "sessions" && <SessionsSection />}
                {activeSection === "appearance" && <AppearanceSection />}
              </div>
            </div>
          </div>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
});
