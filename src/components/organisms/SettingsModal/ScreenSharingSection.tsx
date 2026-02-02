import { memo, useState } from "react";
import { Display, Gear, Speedometer } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { usePlatform, useTranslatedOptions } from "@/hooks";
import { SectionHeader, SettingSwitch, SettingSelect } from "@/components/molecules";
import type { TranslationKey } from "@/i18n/types";

type ScreenShareQuality = "720p30" | "1080p30" | "1080p60" | "1440p60" | "4k60";
type BandwidthMode = "conservative" | "balanced" | "aggressive";

const SCREEN_SHARE_QUALITY_OPTIONS: readonly {
  key: ScreenShareQuality;
  labelKey: TranslationKey;
}[] = [
  { key: "720p30", labelKey: "SETTINGS_SCREEN_QUALITY_720P30" },
  { key: "1080p30", labelKey: "SETTINGS_SCREEN_QUALITY_1080P30" },
  { key: "1080p60", labelKey: "SETTINGS_SCREEN_QUALITY_1080P60" },
  { key: "1440p60", labelKey: "SETTINGS_SCREEN_QUALITY_1440P60" },
  { key: "4k60", labelKey: "SETTINGS_SCREEN_QUALITY_4K60" },
] as const;

const BANDWIDTH_MODE_OPTIONS: readonly { key: BandwidthMode; labelKey: TranslationKey }[] = [
  { key: "conservative", labelKey: "SETTINGS_SCREEN_BW_CONSERVATIVE" },
  { key: "balanced", labelKey: "SETTINGS_SCREEN_BW_BALANCED" },
  { key: "aggressive", labelKey: "SETTINGS_SCREEN_BW_AGGRESSIVE" },
] as const;

export const ScreenSharingSection = memo(function ScreenSharingSection() {
  const { t } = useAppContext();
  const { supportsSystemAudioCapture } = usePlatform();

  // Screen sharing settings
  const [screenShareQuality, setScreenShareQuality] = useState<ScreenShareQuality>("1080p60");
  const [captureSystemAudio, setCaptureSystemAudio] = useState<boolean>(true);
  const [highlightCursor, setHighlightCursor] = useState<boolean>(true);
  const [showMouseClicks, setShowMouseClicks] = useState<boolean>(false);

  // Advanced settings
  const [bandwidthMode, setBandwidthMode] = useState<BandwidthMode>("balanced");

  const { options: qualityOptions } = useTranslatedOptions(SCREEN_SHARE_QUALITY_OPTIONS);
  const { options: bandwidthOptions } = useTranslatedOptions(BANDWIDTH_MODE_OPTIONS);

  return (
    <div className="flex flex-col gap-8">
      {/* Screen Sharing */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon={<Display />} title={t("SETTINGS_SCREEN_SECTION_CAPTURE")} />

        <SettingSelect
          icon={<Display />}
          label={t("SETTINGS_SCREEN_QUALITY")}
          options={qualityOptions}
          value={screenShareQuality}
          onChange={setScreenShareQuality}
        />

        {supportsSystemAudioCapture && (
          <SettingSwitch
            label={t("SETTINGS_SCREEN_CAPTURE_AUDIO")}
            description={t("SETTINGS_SCREEN_CAPTURE_AUDIO_DESC")}
            isSelected={captureSystemAudio}
            onChange={setCaptureSystemAudio}
          />
        )}

        <SettingSwitch
          label={t("SETTINGS_SCREEN_HIGHLIGHT_CURSOR")}
          description={t("SETTINGS_SCREEN_HIGHLIGHT_CURSOR_DESC")}
          isSelected={highlightCursor}
          onChange={setHighlightCursor}
        />

        <SettingSwitch
          label={t("SETTINGS_SCREEN_SHOW_CLICKS")}
          description={t("SETTINGS_SCREEN_SHOW_CLICKS_DESC")}
          isSelected={showMouseClicks}
          onChange={setShowMouseClicks}
        />
      </section>

      {/* Advanced */}
      <section className="flex flex-col gap-4">
        <SectionHeader icon={<Gear />} title={t("SETTINGS_SCREEN_SECTION_ADVANCED")} />

        <SettingSelect
          icon={<Speedometer />}
          label={t("SETTINGS_SCREEN_BANDWIDTH_MODE")}
          options={bandwidthOptions}
          value={bandwidthMode}
          onChange={setBandwidthMode}
        />
      </section>
    </div>
  );
});
