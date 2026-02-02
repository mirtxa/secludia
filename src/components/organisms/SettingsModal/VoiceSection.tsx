import { memo, useState, useCallback } from "react";
import { Microphone, Sliders, Volume } from "@gravity-ui/icons";
import { useAppContext } from "@/context";
import { useMediaDevices, useMediaPermission } from "@/hooks";
import { getVoiceConfig, updateVoiceConfig } from "@/config/localStorage";
import { VoiceRecorderButton } from "@/components/atoms";
import {
  InputSensitivityMeter,
  PermissionAlert,
  SectionHeader,
  SettingSelect,
  SettingSwitch,
  SettingSlider,
} from "@/components/molecules";

export const VoiceSection = memo(function VoiceSection() {
  const { t } = useAppContext();

  // Microphone permission
  const {
    permission: micPermission,
    isRequesting: isRequestingPermission,
    requestPermission,
    resetPermissions,
    isDisabled,
  } = useMediaPermission("microphone");

  const { devices: audioInputDevices } = useMediaDevices({
    kind: "audioinput",
    defaultLabel: t("SETTINGS_VOICE_DEFAULT_DEVICE"),
  });

  // Load initial config once (lazy initializer reads localStorage only on mount)
  const [initialConfig] = useState(getVoiceConfig);

  // Microphone settings
  const [selectedAudioInput, setSelectedAudioInput] = useState(initialConfig.audioInputDevice);
  const [inputVolume, setInputVolume] = useState(initialConfig.inputVolume);
  const [echoCancellation, setEchoCancellation] = useState(initialConfig.echoCancellation);
  const [inputSensitivity, setInputSensitivity] = useState(initialConfig.inputSensitivity);

  // Noise suppression settings
  const [rnnoiseEnabled, setRnnoiseEnabled] = useState(initialConfig.noiseSuppressionEnabled);

  // Advanced audio settings
  // TODO: audioBitrate is not yet used in actual voice encoding - will be needed for WebRTC/MatrixRTC
  const [audioBitrate, setAudioBitrate] = useState(initialConfig.audioBitrate);

  // Persist settings to localStorage
  const handleAudioInputChange = useCallback((value: string) => {
    setSelectedAudioInput(value);
    updateVoiceConfig("audioInputDevice", value);
  }, []);

  const handleInputVolumeChange = useCallback((value: number) => {
    setInputVolume(value);
    updateVoiceConfig("inputVolume", value);
  }, []);

  const handleEchoCancellationChange = useCallback((value: boolean) => {
    setEchoCancellation(value);
    updateVoiceConfig("echoCancellation", value);
  }, []);

  const handleInputSensitivityChange = useCallback((value: number) => {
    setInputSensitivity(value);
    updateVoiceConfig("inputSensitivity", value);
  }, []);

  const handleRnnoiseEnabledChange = useCallback((value: boolean) => {
    setRnnoiseEnabled(value);
    updateVoiceConfig("noiseSuppressionEnabled", value);
  }, []);

  const handleAudioBitrateChange = useCallback((value: number) => {
    setAudioBitrate(value);
    updateVoiceConfig("audioBitrate", value);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {/* Permission Alert */}
      <PermissionAlert
        permission={micPermission}
        isRequesting={isRequestingPermission}
        onRequestPermission={requestPermission}
        onResetPermissions={resetPermissions}
        titlePrompt={t("SETTINGS_VOICE_PERMISSION_TITLE")}
        titleDenied={t("SETTINGS_VOICE_PERMISSION_TITLE")}
        descriptionPrompt={t("SETTINGS_VOICE_PERMISSION_PROMPT_DESC")}
        descriptionDenied={t("SETTINGS_VOICE_PERMISSION_DENIED_DESC")}
        allowButtonLabel={t("SETTINGS_VOICE_PERMISSION_BUTTON")}
        resetButtonLabel={t("SETTINGS_VOICE_PERMISSION_RESET")}
      />

      {/* Microphone */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={<Microphone />} title={t("SETTINGS_VOICE_SECTION_MICROPHONE")} />

        <SettingSelect
          icon={<Microphone />}
          label={t("SETTINGS_VOICE_INPUT_DEVICE")}
          description={t("SETTINGS_VOICE_INPUT_DEVICE_DESC")}
          options={audioInputDevices}
          value={selectedAudioInput}
          onChange={handleAudioInputChange}
          isDisabled={isDisabled}
        />

        <SettingSlider
          label={t("SETTINGS_VOICE_INPUT_VOLUME")}
          value={inputVolume}
          onChange={handleInputVolumeChange}
          minValue={0}
          maxValue={100}
          step={1}
          formatValue={(v) => `${v}%`}
          isDisabled={isDisabled}
        />

        {!isDisabled && (
          <InputSensitivityMeter
            label={t("SETTINGS_VOICE_INPUT_SENSITIVITY")}
            description={t("SETTINGS_VOICE_INPUT_SENSITIVITY_DESC")}
            threshold={inputSensitivity}
            onThresholdChange={handleInputSensitivityChange}
            minDb={-100}
            maxDb={0}
            deviceId={selectedAudioInput}
            echoCancellation={echoCancellation}
            inputVolume={inputVolume}
          />
        )}

        <SettingSwitch
          label={t("SETTINGS_VOICE_ECHO_CANCELLATION")}
          description={t("SETTINGS_VOICE_ECHO_CANCELLATION_DESC")}
          isSelected={echoCancellation}
          onChange={handleEchoCancellationChange}
          isDisabled={isDisabled}
        />

        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-sm font-medium text-foreground">
              {t("SETTINGS_VOICE_TRY_IT_OUT")}
            </span>
            <span className="text-xs text-muted">{t("SETTINGS_VOICE_TRY_IT_OUT_DESC")}</span>
          </div>
          <div className="w-1/2">
            <VoiceRecorderButton hideSendButton isDisabled={isDisabled} maxDuration={30} />
          </div>
        </div>
      </section>

      {/* Noise Suppression */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={<Volume />} title={t("SETTINGS_VOICE_SECTION_NOISE_SUPPRESSION")} />

        <SettingSwitch
          label={t("SETTINGS_VOICE_RNNOISE_ENABLE")}
          description={t("SETTINGS_VOICE_RNNOISE_ENABLE_DESC")}
          isSelected={rnnoiseEnabled}
          onChange={handleRnnoiseEnabledChange}
          isDisabled={isDisabled}
        />
      </section>

      {/* Advanced */}
      <section className="flex flex-col gap-5">
        <SectionHeader icon={<Sliders />} title={t("SETTINGS_VOICE_SECTION_ADVANCED")} />

        {/* TODO: audioBitrate will be used for WebRTC/MatrixRTC voice encoding */}
        <SettingSlider
          label={t("SETTINGS_VOICE_AUDIO_BITRATE")}
          description={t("SETTINGS_VOICE_AUDIO_BITRATE_DESC")}
          value={audioBitrate}
          onChange={handleAudioBitrateChange}
          minValue={32}
          maxValue={256}
          step={16}
          formatValue={(v) => `${v} kbps`}
          isDisabled={isDisabled}
        />
      </section>
    </div>
  );
});
