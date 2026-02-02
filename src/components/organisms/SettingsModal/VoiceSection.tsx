import { memo, useState, useCallback, useEffect } from "react";
import { Microphone, Sliders, Volume } from "@gravity-ui/icons";
import { Alert, Button } from "@heroui/react";
import { isTauri } from "@tauri-apps/api/core";
import { invoke } from "@tauri-apps/api/core";
import { useAppContext } from "@/context";
import { useMediaDevices } from "@/hooks";
import { getVoiceConfig, updateVoiceConfig } from "@/config/localStorage";
import { VoiceRecorderButton } from "@/components/atoms";
import {
  InputSensitivityMeter,
  SectionHeader,
  SettingSelect,
  SettingSwitch,
  SettingSlider,
} from "@/components/molecules";

type MicrophonePermission = "granted" | "denied" | "prompt";

export const VoiceSection = memo(function VoiceSection() {
  const { t } = useAppContext();

  // Microphone permission state
  const [micPermission, setMicPermission] = useState<MicrophonePermission>("prompt");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  // Check and listen to microphone permission status
  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    let mounted = true;

    const checkPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        if (mounted) {
          setMicPermission(permissionStatus.state as MicrophonePermission);
        }

        // Listen for changes
        const handleChange = () => {
          if (mounted) {
            setMicPermission(permissionStatus!.state as MicrophonePermission);
          }
        };
        permissionStatus.addEventListener("change", handleChange);

        return () => permissionStatus?.removeEventListener("change", handleChange);
      } catch {
        // Permissions API not supported - try getUserMedia to detect actual state
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          if (mounted) setMicPermission("granted");
        } catch (err) {
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            // Could be denied or prompt - we can't tell without trying
            if (mounted) setMicPermission("prompt");
          }
        }
      }
    };

    checkPermission();

    return () => {
      mounted = false;
    };
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async () => {
    setIsRequestingPermission(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted - stop the stream immediately
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission("granted");
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        // Check actual permission state - dismissed (X) stays "prompt", Block becomes "denied"
        try {
          const status = await navigator.permissions.query({
            name: "microphone" as PermissionName,
          });
          setMicPermission(status.state as MicrophonePermission);
        } catch {
          // Fallback if Permissions API not supported
          setMicPermission("denied");
        }
      }
    } finally {
      setIsRequestingPermission(false);
    }
  }, []);

  // Reset WebView permissions (Tauri only) - deletes permission data and restarts app
  const resetPermissions = useCallback(async () => {
    if (!isTauri()) return;
    try {
      await invoke("reset_webview_permissions");
      // App will restart, so we won't reach here
    } catch (err) {
      console.error("Failed to reset permissions:", err);
    }
  }, []);

  const isDisabled = micPermission !== "granted";

  const { devices: audioInputDevices } = useMediaDevices({
    kind: "audioinput",
    defaultLabel: t("SETTINGS_VOICE_DEFAULT_DEVICE"),
  });

  // Load initial values from localStorage
  const initialConfig = getVoiceConfig();

  // Microphone settings
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>(
    initialConfig.audioInputDevice
  );
  const [inputVolume, setInputVolume] = useState<number>(initialConfig.inputVolume);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(initialConfig.echoCancellation);
  const [inputSensitivity, setInputSensitivity] = useState<number>(initialConfig.inputSensitivity);

  // Noise suppression settings
  const [rnnoiseEnabled, setRnnoiseEnabled] = useState<boolean>(
    initialConfig.noiseSuppressionEnabled
  );

  // Advanced audio settings
  // TODO: audioBitrate is not yet used in actual voice encoding - will be needed for WebRTC/MatrixRTC
  const [audioBitrate, setAudioBitrate] = useState<number>(initialConfig.audioBitrate);

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
      {isDisabled && (
        <Alert status={micPermission === "denied" ? "danger" : "warning"}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t("SETTINGS_VOICE_PERMISSION_TITLE")}</Alert.Title>
            <Alert.Description>
              {micPermission === "denied"
                ? t("SETTINGS_VOICE_PERMISSION_DENIED_DESC")
                : t("SETTINGS_VOICE_PERMISSION_PROMPT_DESC")}
            </Alert.Description>
            {micPermission === "denied" ? (
              isTauri() && (
                <Button
                  className="mt-2 sm:hidden"
                  size="sm"
                  variant="danger"
                  onPress={resetPermissions}
                >
                  {t("SETTINGS_VOICE_PERMISSION_RESET")}
                </Button>
              )
            ) : (
              <Button
                className="mt-2 sm:hidden"
                size="sm"
                variant="primary"
                onPress={requestPermission}
                isDisabled={isRequestingPermission}
              >
                {t("SETTINGS_VOICE_PERMISSION_BUTTON")}
              </Button>
            )}
          </Alert.Content>
          {micPermission === "denied" ? (
            isTauri() && (
              <Button
                className="hidden sm:block"
                size="sm"
                variant="danger"
                onPress={resetPermissions}
              >
                {t("SETTINGS_VOICE_PERMISSION_RESET")}
              </Button>
            )
          ) : (
            <Button
              className="hidden sm:block"
              size="sm"
              variant="primary"
              onPress={requestPermission}
              isDisabled={isRequestingPermission}
            >
              {t("SETTINGS_VOICE_PERMISSION_BUTTON")}
            </Button>
          )}
        </Alert>
      )}

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
