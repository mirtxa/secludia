# Secludia - Claude Session Context

## Project Overview

**Secludia** is a privacy-focused Matrix client built with:
- **React 19** + **TypeScript**
- **Tauri 2** (desktop app for Windows, Mac, Linux)
- **HeroUI v3 Beta** (UI component library)
- **Tailwind CSS v4**
- **Vite** (bundler)
- **Vitest** (testing)

The app should work both as a **web application** and as a **desktop app** via Tauri.

---

## Architecture

### Folder Structure
```
src/
├── components/
│   ├── atoms/          # Basic UI (NavBarButton, PresenceAvatar, ProfileAvatar, EncryptionChip, Scrollbar, SelectDropdown, AppToast, VoiceRecorderButton, etc.)
│   ├── molecules/      # Composed components (GhostEmptyState, InputSensitivityMeter, PermissionAlert, PrivacyIndicatorModal, SettingsControls)
│   ├── layouts/        # Layout wrappers (ErrorBoundary, ResponsiveCard)
│   ├── organisms/      # Complex components (DirectMessagesSection, SettingsModal, NotificationsSection)
│   └── system/         # Tauri-specific (TitleBar, ControlActions, ControlButton)
├── config/             # App configuration and localStorage persistence
├── constants/          # App constants (PRESENCE_RING_COLORS, SIDEBAR_WIDTH, SIMULATED_LOADING_DELAY)
├── context/            # React Context (AppContext, UserContext)
├── hooks/              # Custom hooks (useBreakpoint, useResizable, useSidebar, useMediaDevices, etc.)
├── i18n/               # Internationalization with auto-loading locales
├── lib/                # Library code
│   └── audio/          # Audio processing (RNNoise noise suppression)
├── locales/            # Translation files (en.json, es.json)
├── mocks/              # Mock data for development (conversations, rooms, sessions, user)
├── screens/            # Full-page screens (LoginScreen, MainScreen)
├── themes/             # CSS theme files (default, familiar, midnight, sunset, mint)
├── utils/              # Utility functions (validation, string helpers)
└── test/               # Test setup
```

### Key Patterns
- **Atomic Design**: Components organized as atoms/molecules/layouts/organisms/system
- **Barrel Exports**: Every folder has `index.ts` for clean imports
- **Colocation**: Types, styles, tests colocated with components
- **Memoization**: All components use `memo()`, callbacks use `useCallback`
- **BEM CSS**: Class naming follows BEM convention (e.g., `sidebar__content--open`)
- **Platform Detection**: `isTauri()` from `@tauri-apps/api/core` for desktop-specific features
- **DRY Settings Controls**: `SettingSwitch`, `SettingSlider`, `SettingSelect<T>` in molecules
- **Generic Components**: Type-safe with `<T extends string>` for dropdowns/selectors
- **Centralized Media Access**: All media access through `useMediaStream` hook (privacy)

---

## Current State

### Completed Features
1. **Login Screen** - Homeserver input with validation, theme/language selectors
2. **Main Screen** - Responsive layout with:
   - Sidebar (nav + resizable content area)
   - Main content area (header + body)
   - Mobile: Hamburger menu with staggered slide-in animation
   - Tablet (640-768px): Navbar visible, content panel as overlay when opened
   - Desktop (768px+): Full sidebar + main content side by side
3. **Sidebar Navigation** - Room list with:
   - Direct Messages button (rounded square with chat icon)
   - Rooms/Spaces (avatars with initials fallback)
   - Space badge (hashtag icon indicator for spaces vs groups)
   - Add Room button
   - Settings button
   - User profile avatar with presence ring (PresenceAvatar component)
   - Skeleton loading states for rooms and profile
4. **Direct Messages Section** - Conversation list with:
   - SearchField for filtering by username/displayName
   - HeroUI ListBox for accessible keyboard navigation
   - ConversationItem components with presence avatars
   - Active conversation highlighting (accent background)
   - Auto-select first conversation on initial load
   - Empty state with ghost icon and wave text animation (opens "New chat" modal on click)
   - Skeleton loading states
   - Encryption status chip in header
   - On mobile/tablet with no conversations: sidebar stays visible, main content hidden
5. **Room Types** - Three types with visual differentiation:
   - `dm` - Direct messages (rounded square)
   - `space` - Spaces with hashtag badge indicator
   - `group` - Group chats (rounded square, no badge)
6. **Settings Modal** - Sections for Account, Sessions, Appearance with:
   - Profile avatar with edit button
   - Presence status selector (online/offline/unavailable)
   - Theme and language selectors
   - Session management display
7. **User Context** - Current user state with presence support
8. **Theme System** - 6 themes with localStorage persistence
9. **i18n** - Auto-loading locales with interpolation support (en, es)
10. **Error Boundary** - Catches React errors with retry button
11. **Title Bar** - Custom Tauri title bar with window controls (only renders in desktop)
12. **System Tray** - Minimize to tray on close (Rust-side)
13. **Custom Scrollbar** - OverlayScrollbars with scroll shadow detection
14. **Toast Notifications** - Custom toast system with:
    - SVG countdown animation (stroke outline that depletes counter-clockwise)
    - Configurable duration (1-15 seconds via slider in settings)
    - Optional avatar display
    - Notification sound (with silent option)
    - Responsive placement (centered on mobile, top-right on larger screens)
    - Auto-dismiss with manual close button
15. **Notification Settings** - Full settings section with:
    - Permission status display and enable button
    - Notification type selector (Auto/Toast/System)
    - Toast duration slider
    - Test notification buttons
16. **Media Privacy System** - Centralized media access with visual indicator:
    - MediaRegistry context tracks all active streams globally
    - `useMediaStream` hook is the ONLY way to access media (enforces registration)
    - Profile avatar presence ring pulses red when any media is active
    - Clicking pulsing avatar opens modal showing what's active and where
    - Race condition protection prevents orphaned streams

### MainScreen Responsive Behavior
- **Mobile (<640px)**: Sidebar hidden, hamburger button opens full-screen sidebar overlay
- **Tablet (640-768px)**: 72px navbar always visible, sidebar content opens as overlay when DM/Space selected
- **Desktop (768px+)**: Full sidebar (nav 72px + resizable content 180-348px) + main content
- **Empty DM state (mobile/tablet)**: When DMs selected with no conversations, sidebar stays visible with ghost empty state, main content is hidden (CSS class `sidebar--dm-empty`)

### MainScreen Animation
When opening sidebar on mobile:
1. Nav slides in from left (0.3s ease-out)
2. Content fades in + slides slightly (0.25s ease-out, 0.2s delay)
Closing reverses with content fading first, then nav sliding out.

---

## Key Files

### Components (Atoms)
- `NavBarButton.tsx` - Navigation button with selection indicator, tooltip, and `rounded` prop for circular focus outline
- `NavBarButton.css` - Styles for indicator animation, avatar/badge hover states, focus styles
- `PresenceAvatar.tsx` - Avatar with presence ring (sm/md/lg sizes with scaling ring thickness)
- `ProfileAvatar.tsx` - Current user's avatar (uses PresenceAvatar internally, adds edit button)
- `EncryptionChip.tsx` - Chip showing encryption status (lock icon)
- `Scrollbar.tsx` - Custom scrollbar with OverlayScrollbars and shadow detection
- `SelectDropdown.tsx` - Compact dropdown for toolbars (button trigger, used in ThemeSelector, LanguageSelector)
- `VoiceRecorderButton/` - Self-contained voice recorder with 3 states:
  - **Idle**: Simple mic button (accent background)
  - **Recording**: Animated waveform + timer + voice indicator + discard + send buttons
  - **Stopped**: Full waveform visualization + play/pause + discard + send buttons
  - Props: `onSend`, `onError`, `orientation`, `isDisabled`, `hideSendButton`, `maxDuration` (default 60s)
  - Features:
    - Direct send while recording (stops, processes, and sends in one action)
    - Click-to-seek in playback waveform (only while playing)
    - Auto-stop when `maxDuration` reached
    - VAD disabled for voice messages (preserves natural pauses)
    - RNNoise processing applied on stop (if enabled in settings)
  - Timer display logic:
    - Recording → elapsed time
    - Playing → current position
    - Paused → keeps current position
    - Stopped/finished → total duration
  - Subcomponents (all memoized):
    - `VoiceIndicator` - Pac-man style mouth that opens based on audio level (0-60°)
    - `RecordingWaveform` - Real-time waveform bars moving towards indicator
    - `PlaybackWaveform` - Full recorded waveform with progress tracking and click-to-seek
    - `WaveformBar` / `PlaybackBar` - Individual bar components (centered, grow equally up/down)
    - `TimeDisplay` - Memoized time display with position-based margin
  - Orientation support: `left` or `right` - indicator always faces timer
  - Performance optimizations:
    - All components use `memo()` with function syntax
    - `useRef` instead of `useState` for bars array and container width (avoids re-renders)
    - Single `forceRender` state trigger for batch updates
    - `FLIP_STYLE` constant defined outside component (avoids object creation)
    - `will-change: left` CSS hint for waveform bar transitions
    - `ResizeObserver` for responsive bar count
  - CSS file: `VoiceRecorderButton.css` with pulse-fade animation for indicator (100% to 35% opacity)
- `AppToast/` - Toast notification system:
  - `appToast.ts` - Queue, `appToast()` function, and `AppToastContent` type
  - `AppToastContainer.tsx` - React component with SVG countdown animation
  - `AppToast.css` - Animation keyframes and HeroUI overrides

### Components (Molecules)
- `GhostEmptyState.tsx` - Empty state with ghost icon and wave text animation
  - Wave animation on both ghost and text (per-word delay)
  - Clickable ghost triggers action (e.g., opens new chat modal)
  - CSS animation in `GhostEmptyState.css`
- `InputSensitivityMeter/` - Discord-like microphone sensitivity control:
  - Real-time audio level visualization with HeroUI Slider
  - VAD threshold control in dB (-100 to 0)
  - Color-coded: yellow (below threshold/ignored), green (above threshold/transmitted)
  - Audio level shown as dark overlay filling from left
  - Uses GainNode for input volume control
- `SettingsControls/` - Reusable settings components (DRY extraction):
  - `SectionHeader` - Section title with icon
  - `SettingSwitch` - Toggle switch with label and description (uses HeroUI Label isDisabled + Description)
  - `SettingSlider` - Slider with label, description, and value formatter (uses HeroUI Label isDisabled + Description)
  - `SettingSelect<T>` - Generic select dropdown for settings (icon + label + select on right, disabled styling on icon/label)
- `PrivacyIndicatorModal/` - Modal showing active media sources:
  - Lists each active stream with type icon and source description
  - Triggered by clicking the pulsing presence avatar
- `PermissionAlert/` - Reusable permission alert component:
  - Warning alert for "prompt" state, danger alert for "denied" state
  - "Allow" button triggers permission request, "Reset & close" for denied (Tauri only)
  - Responsive: buttons in content on mobile, alongside on desktop
  - Props: permission state, handlers, translated strings for title/description/buttons

### Components (Organisms)
- `DirectMessagesSection.tsx` - DM list with search, skeleton loading, conversation items
  - Uses HeroUI ListBox for accessible list navigation
  - GhostEmptyState shown when no conversations
  - New chat modal with user search
- `ConversationItem.tsx` - Individual conversation row with:
  - PresenceAvatar with outer border on active state
  - Active highlighting (accent background)
  - Muted text by default, normal on hover/active/selected
- `SettingsModal.tsx` - Settings dialog with tabbed sections
- `AccountSection.tsx` - Profile editing with avatar upload trigger
- `AppearanceSection.tsx` - Theme, language, font size settings
- `SessionsSection.tsx` - Current and other sessions display
- `NotificationsSection.tsx` - Notification settings:
  - **Permission management**: Alert for prompt/denied states (web only, Tauri uses OS-level permissions)
  - Notification type selector (Auto/Toast/System)
  - Toast duration slider
  - Test notification buttons
- `VoiceSection.tsx` - Voice/microphone settings (persisted to localStorage):
  - **Permission management**: PermissionAlert for prompt/denied states, useMediaPermission hook
  - Device selection and input volume (GainNode-based, 0-100%)
  - Echo cancellation toggle (browser WebRTC, disabled by default)
  - Input sensitivity meter with VAD threshold (-100 to 0 dB, default -70)
  - Noise suppression toggle (RNNoise)
  - Audio bitrate slider (TODO: not yet used, for future WebRTC/MatrixRTC)
  - VoiceRecorderButton for testing microphone settings (maxDuration=30s, hideSendButton)
  - Lazy state initializer for config (reads localStorage once on mount)
- `AudioSection.tsx` - Audio output settings (speaker selection, volume, test tone)
- `VideoSection.tsx` - Camera settings with live preview (persisted to localStorage):
  - **Permission management**: PermissionAlert for prompt/denied states, useMediaPermission hook
  - Device selection, resolution (480p-4K), frame rate (15/24/30/60fps)
  - CameraPreview component using HeroUI Card:
    - Uses `useMediaStream` hook (fixes privacy indicator - tracks active camera)
    - Centered start button with video icon (explicit activation for privacy)
    - HeroUI Chips with icons showing actual resolution and fps when active
    - Resolution uses `ideal` constraints - camera provides best it can support
    - Stop button with tertiary variant for visibility
  - Advanced settings (disabled until video calls implemented): codec, bitrate, hardware acceleration, simulcast
  - Lazy state initializer for config (reads localStorage once on mount)
  - Controls disabled when permission not granted
  - **Removed**: Mirror setting (video is never mirrored - shows exactly what others see)
  - **Removed**: Low light adjustment (was placeholder, not implemented)
  - **Removed**: Background blur (was decorative, not implemented)
- `ScreenSharingSection.tsx` - Screen share settings (persisted to localStorage):
  - Resolution (720p-4K), frame rate (15/30/60/120/144 fps with bandwidth hints)
  - System audio capture toggle (Windows only - uses `usePlatform` for detection)
  - ScreenSharePreview component using HeroUI Card:
    - Uses `useMediaStream` hook with `type: "screen"` for `getDisplayMedia()`
    - HeroUI Chips showing actual resolution and fps
    - Fullscreen button (tertiary variant, bottom-right corner)
    - Smart audio toggle: disable = instant (stop tracks), enable = restart stream
  - Advanced settings (disabled until screen sharing in calls implemented): bandwidth mode, codec
  - Lazy state initializer for config
  - Uses shared `VIDEO_CODEC_OPTIONS` from configTypes.ts
  - Uses shared `getStreamInfo()` from utils/media.ts

### Hooks
- `useMediaQuery.ts` - Media query hook with Tailwind breakpoints (sm, md, lg, xl, 2xl)
- `useBreakpoint.ts` - Shorthand for common breakpoints
- `useSidebar.ts` - Sidebar open/close state, auto-closes at sm breakpoint
- `useResizable.ts` - Drag-to-resize functionality with min/max constraints
- `useTauriWindow.ts` - Tauri window operations (minimize, maximize, close)
- `useNotification.ts` - System notification API (permission, send) + `playNotificationSound()` export
- `useTranslatedOptions.ts` - Hook to create translated dropdown options from config arrays (DRY helper)
- `useMediaDevices.ts` - Enumerate audio/video devices with auto-refresh on device changes
- `useMediaStream.ts` - **CRITICAL: Centralized media stream access** (see Media Privacy System below)
  - Supports `type: "microphone" | "camera" | "screen"`
  - Screen type uses `getDisplayMedia()` instead of `getUserMedia()`
- `usePlatform.ts` - Platform detection and media capabilities:
  - Platform detection via Tauri plugin-os (macos/windows/linux/ios/android/web)
  - Media capability flags: `supportsAudioOutputSelection`, `supportsSystemAudioCapture`, `supportsHardwareH264`, `supportsHardwareVP9`, `supportsAV1`
  - Accounts for Tauri WebView differences (Windows=Chromium, macOS/Linux=WebKit)
- `useMediaPermission.ts` - Media permission management (camera/microphone):
  - Checks permission via Permissions API with getUserMedia fallback
  - Listens for real-time permission changes with proper cleanup
  - `requestPermission()` triggers browser permission prompt
  - `resetPermissions()` creates marker file and exits app (Tauri only)
  - Returns `permission`, `isRequesting`, `requestPermission`, `resetPermissions`, `isDisabled`
- `isWindowFocused.ts` - Utility to check if window is focused (for auto notification type)

### Lib (Audio)
- `rnnoise.ts` - RNNoise noise suppression (offline processing):
  - `RnnoiseProcessor` class - WASM memory management and frame processing
  - `processRawSamplesWithRNNoise()` - Process samples and return WAV blob
  - `samplesToWav()` - Convert samples to WAV without processing
  - `processAudioSamples()` - Low-level 480-sample frame processing
- `rnnoise-worklet.ts` - Real-time RNNoise AudioWorklet wrapper:
  - `createRnnoiseNode()` - Create AudioWorklet node for real-time noise suppression
  - `createRnnoiseStream()` - Create processed MediaStream from input stream
- `audio-recorder.ts` - AudioWorklet-based audio recorder:
  - `createAudioRecorder()` - Create recorder with VAD support and input volume control
  - Returns `AudioRecorder` with start/stop/clear/setVadThreshold/setInputVolume methods
- `worklet/rnnoise-processor.worklet.ts` - AudioWorklet processor for RNNoise:
  - Buffers 128-sample chunks into 480-sample frames for RNNoise
  - Uses circular buffer (LCM of 128 and 480 = 1920 samples)
  - WASM loaded synchronously with inlined binary
- `worklet/recorder-processor.worklet.ts` - AudioWorklet processor for recording:
  - Voice Activity Detection (VAD) with configurable threshold (dB)
  - 300ms hang time to avoid cutting off speech
  - Accumulates samples and sends to main thread on stop

### Context
- `AppContext.tsx` - Provides theme, language, selectedRoom, toastDuration, and `t()` translation function
- `AppContext.types.ts` - Types including `RoomType` ("dm" | "space" | "group")
- `UserContext.tsx` - Current user state and presence
- `MediaRegistryContext.tsx` - Tracks active media streams for privacy indicator (see Media Privacy System below)
- `MediaRegistryContext.types.ts` - Types for MediaRegistry (MediaType, MediaUsage, context value)
- `useAppContext.ts` / `useUserContext.ts` / `useMediaRegistry.ts` - Hooks to access context safely

### Config
- `localStorage.ts` - Config persistence with generic `updateConfig<K>()` helper and schema validation
  - `getVoiceConfig()` / `updateVoiceConfig()` for voice settings
  - `getVideoConfig()` / `updateVideoConfig()` for video settings
  - `getScreenConfig()` / `updateScreenConfig()` for screen sharing settings
- `configTypes.ts` - `SecludiaConfig` type (theme, language, notificationPromptStatus, toastDuration, voice, video, screen)
  - `NotificationPromptStatus` type - Tracks if notification prompt was shown ("not_asked" | "asked")
  - `VoiceConfig` type (audioInputDevice, inputVolume, echoCancellation, inputSensitivity, noiseSuppressionEnabled, audioBitrate)
  - `VideoConfig` type (videoInputDevice, resolution, frameRate, codec, maxBitrate, hardwareAcceleration, simulcast)
  - `ScreenConfig` type (resolution, frameRate, captureSystemAudio, bandwidthMode, codec)
  - `VideoResolution` type ("480p" | "720p" | "1080p" | "1440p" | "4k")
  - `FrameRate` type ("15" | "24" | "30" | "60")
  - `ScreenShareResolution` type ("720p" | "1080p" | "1440p" | "4k")
  - `ScreenShareFrameRate` type ("15" | "30" | "60" | "120" | "144")
  - `BandwidthMode` type ("conservative" | "balanced" | "aggressive")
  - `VideoCodec` type ("vp8" | "vp9" | "h264" | "av1")
  - `VIDEO_CODEC_OPTIONS` constant - Shared between VideoSection and ScreenSharingSection
- `defaultConfig.ts` - Default config values including `DEFAULT_VOICE_CONFIG`, `DEFAULT_VIDEO_CONFIG`, `DEFAULT_SCREEN_CONFIG`

### Constants
- `presence.ts` - `PRESENCE_RING_COLORS` mapping for online/offline/unavailable
- `layout.ts` - `SIDEBAR_WIDTH` (min/max/default) and `SIMULATED_LOADING_DELAY`

### Screens
- `LoginScreen.tsx` - Login form with homeserver validation
- `MainScreen.tsx` - Main app screen with sidebar + content layout
- `MainScreen.css` - Responsive styles with CSS custom properties and media query ranges

### Mocks
- `conversations.ts` - Mock conversation data with presence, encryption status
- `rooms.ts` - Mock rooms/spaces data
- `sessions.ts` - Mock session data (current + other devices)
- `user.ts` - Mock current user profile

---

## Important Conventions

### Imports Order
1. React imports
2. External libraries (@heroui/react, @gravity-ui/icons)
3. Internal imports (@/components, @/constants, @/context, @/hooks)
4. Mocks (@/mocks)
5. Utils (@/utils)
6. Types (import type)
7. CSS

### Component Structure
```tsx
import { memo, useCallback } from "react";
// ... other imports

export const ComponentName = memo(function ComponentName(props: Props) {
  // hooks
  // callbacks (memoized with useCallback)
  // derived state (memoized with useMemo if expensive)
  // render
});
```

### CSS Approach
- **Tailwind first**: Use Tailwind classes for styling whenever possible
- **CSS for**: Media queries, CSS custom properties, complex selectors, animations, platform-specific properties (-webkit-app-region)
- **Media query ranges**: Use scoped ranges like `@media (min-width: 640px) and (max-width: 767px)` instead of cascading min-width queries

### HeroUI v3 Patterns
- **Tooltip with Button**: Put HeroUI `Button` directly as child of `Tooltip` (no `Tooltip.Trigger` needed)
- **Tooltip with non-interactive elements**: Use `Tooltip.Trigger` wrapper
- **Compound components**: Use dot notation (e.g., `Avatar.Image`, `Modal.Dialog`)

### Utilities
- `cn(...classes)` - Class name combiner, filters falsy values
- `getInitials(name)` - Returns first 2 characters trimmed and uppercased
- `validateHomeserver(input)` - Validates homeserver hostname with IP/port validation
- `isValidImageUrl(url)` - Validates image URLs (http/https only, blocks suspicious patterns)
- `safeOpenUrl(url)` - Safely opens URLs in new tab with noopener/noreferrer

---

## Pending Work / Next Steps

1. **Main Content Area** - Currently empty placeholder:
   - `main-content__header` - Shows active conversation info (avatar, name, encryption status)
   - `main-content__body` - Chat messages and input field

2. **Matrix Integration** - Connect to Matrix homeserver:
   - OAuth 2.0 authentication flow
   - Matrix SDK integration
   - Room sync, message sending/receiving
   - Replace mock data with real conversations

3. **VoIP/Video Calls** - MatrixRTC integration:
   - **1:1 DM calls**: P2P WebRTC (full-mesh transport) - direct connection, no server
   - **3+ participants**: LiveKit SFU - self-hosted or hosted instance
   - Both use MatrixRTC protocol with different transports
   - **Screen sharing**: Supported in P2P, with quality options up to 4K 60fps for power users

4. **Space Content** - When a space is selected, show space-specific content:
   - Channels list within the space
   - Space settings/info

5. **Group Chat** - When a group is selected:
   - Show chat directly in main content (no sidebar panel)

6. **Settings Expansion** - Implement remaining settings sections:
   - Security
   - Encryption

7. **Additional Translations** - More languages beyond en/es

8. **Permission Management System** - Media and notification permissions with cross-platform support:
   - **useMediaPermission hook** - Handles camera/microphone permission checking, requesting, and reset
     - Uses Permissions API with getUserMedia fallback for unsupported browsers
     - Listens for real-time permission changes
     - Returns: `permission`, `isRequesting`, `requestPermission`, `resetPermissions`, `isDisabled`
   - **PermissionAlert component** - Reusable molecule for permission UI:
     - Warning alert for "prompt" state with "Allow" button
     - Danger alert for "denied" state with "Reset & close" button (Tauri only)
     - Responsive: action buttons in content on mobile, alongside content on desktop
   - **Tauri permission reset** (marker file pattern):
     1. "Reset & close" button creates `.reset_permissions` marker file in app data
     2. App exits via `std::process::exit(0)`
     3. On next startup, *before* WebView initializes, Rust checks for marker
     4. If marker exists: delete WebView data folder, delete marker, continue startup
   - **Platform-specific WebView data locations** (Local AppData):
     - Windows: `%LOCALAPPDATA%\{identifier}\EBWebView\` (WebView2)
     - macOS: `~/Library/Application Support/{identifier}/WebKit\` (WebKitGTK)
     - Linux: `~/.local/share/{identifier}/WebKit\` (WebKitGTK)
   - **App identifier**: Read from tauri.conf.json at compile time via `include_str!`
   - **Web browsers**: No programmatic reset - users must use browser settings

---

## Audio Processing - RNNoise Noise Suppression

### Overview

The app uses **RNNoise** for real-time noise suppression in voice chat. RNNoise is a hybrid DSP/deep learning approach developed by Jean-Marc Valin (Xiph.Org/Mozilla).

**Key resources:**
- [Original Demo](https://jmvalin.ca/demo/rnnoise/) - Interactive demo with samples
- [Paper](https://arxiv.org/abs/1709.08243) - "A Hybrid DSP/Deep Learning Approach to Real-Time Full-Band Speech Enhancement"
- [GitHub](https://github.com/xiph/rnnoise) - Original C implementation

### How RNNoise Works

RNNoise uses a **GRU-based neural network** (3 layers) to compute ideal critical band gains across 22 Bark-scale frequency bands. Key characteristics:

1. **Frame size**: 480 samples (10ms at 48kHz) - non-negotiable
2. **Sample rate**: 48kHz only - resample if needed
3. **Sample format**: Float scaled to int16 range (multiply by 32768)
4. **Processing**: In-place (same buffer for input/output)
5. **State**: GRU hidden state MUST persist across frames for temporal context
6. **Pitch filtering**: Attenuates noise between pitch harmonics (handled internally)

### Implementation (`src/lib/audio/rnnoise.ts`)

**Package**: `@jitsi/rnnoise-wasm` (BSD-3-Clause + Apache-2.0)
- Actively maintained by Jitsi team (8x8)
- Used in production by Jitsi Meet

**RnnoiseProcessor class** (based on Jitsi's reference implementation):
```typescript
class RnnoiseProcessor {
  private _context: number;           // WASM RNNoise state
  private _wasmPcmInput: number;      // Allocated WASM buffer
  private _wasmPcmInputF32Index: number; // Float32 index into HEAPF32

  processAudioFrame(pcmFrame: Float32Array, shouldDenoise = false): number {
    // 1. Scale float [-1,1] to int16 [-32768,32767]
    for (let i = 0; i < 480; i++) {
      this._wasmInterface.HEAPF32[this._wasmPcmInputF32Index + i] =
        pcmFrame[i] * 32768;
    }

    // 2. Process in-place (output = input buffer)
    const vadScore = this._wasmInterface._rnnoise_process_frame(
      this._context,
      this._wasmPcmInput,  // output
      this._wasmPcmInput   // input (same buffer)
    );

    // 3. Scale back to float range
    if (shouldDenoise) {
      for (let i = 0; i < 480; i++) {
        pcmFrame[i] = this._wasmInterface.HEAPF32[...] / 32768;
      }
    }

    return vadScore; // VAD probability 0-1
  }
}
```

**Critical implementation details:**
- Processor is cached globally (`processorPromise`) - state persists across all audio
- WASM URL loaded via Vite's `?url` suffix: `import rnnoiseWasmUrl from "@jitsi/rnnoise-wasm/dist/rnnoise.wasm?url"`
- `locateFile` callback tells Emscripten where to find the WASM binary
- VAD (Voice Activity Detection) score is returned but not currently used

### API Functions

```typescript
// Process audio and return WAV blob (handles resampling)
processRawSamplesWithRNNoise(samples: Float32Array, sampleRate: number): Promise<Blob>

// Convert samples to WAV without processing
samplesToWav(samples: Float32Array, sampleRate: number): Blob

// Low-level processing (48kHz only)
processAudioSamples(samples: Float32Array): Promise<Float32Array>
```

### Real-Time AudioWorklet (Implemented)

Both RNNoise processing and audio recording now use AudioWorklets:

**RNNoise Worklet** (`worklet/rnnoise-processor.worklet.ts`):
- Runs on separate audio thread (not main thread)
- Receives 128-sample chunks from Web Audio API
- Buffers into 480-sample frames for RNNoise (circular buffer, size 1920 = LCM)
- WASM loaded synchronously using `createRNNWasmModuleSync` (inlined binary)
- Outputs denoised audio as 128-sample chunks
- Enable/disable via message port

**Recorder Worklet** (`worklet/recorder-processor.worklet.ts`):
- Accumulates audio samples in pre-allocated buffer (max 60 seconds)
- Voice Activity Detection (VAD) with configurable dB threshold
- 300ms hang time - continues recording briefly after level drops
- Sends recorded samples to main thread on stop (transferred, not copied)

### Package Comparison

| Package | Maintenance | Exports | Use Case |
|---------|-------------|---------|----------|
| `@jitsi/rnnoise-wasm` | Active (Feb 2025) | Flexible | Both offline & real-time ✅ |
| `@timephy/rnnoise-wasm` | Aug 2024 | Strict (worklet only) | Ready-made AudioWorklet |

We use `@jitsi/rnnoise-wasm` because it's more flexible and actively maintained.

### Settings UI

Voice settings (`VoiceSection.tsx`) include:
- **Microphone device selection** - Dropdown with available audio input devices
- **Input volume slider** (0-100%) - GainNode-based, affects both level meter and recording
- **Echo cancellation toggle** - Browser WebRTC feature, disabled by default
- **Input sensitivity meter** - Discord-like control:
  - HeroUI Slider with custom styling (yellow left = ignored, green right = transmitted)
  - Real-time audio level shown as dark overlay
  - Threshold in dB (-100 to 0, default -70)
  - Level calculation: RMS → dB with smoothing
- **Noise suppression toggle** - Enables/disables RNNoise processing
- **VoiceRecorderButton** - Test microphone with recording/playback

---

## Testing

Run tests: `pnpm test`
Run lint: `pnpm lint`
Type check: `npx tsc --noEmit`
Build: `pnpm build`
Dev server: `pnpm dev`
Tauri dev: `pnpm tauri dev`

---

## Git State

Branch: `init`

---

## Notes for Next Session

- The `homeserver` and `onLogout` props in MainScreen are passed but not yet used - they'll be needed for Matrix integration
- Mock data is centralized in `/src/mocks/` - replace with real Matrix data
- HeroUI v3 is in **beta** - check for breaking changes if updating
- Tauri system tray logic is in Rust (`src-tauri/src/lib.rs`), not TypeScript
- Presence system is mocked - will need Matrix presence integration
- Space badge uses Hashtag icon from @gravity-ui/icons, turns accent color on hover/selected
- Tablet breakpoint (640-768px) has special behavior: sidebar content appears as overlay, clicking conversation closes it
- NavBarButton uses HeroUI Button internally for proper Tooltip integration
- PresenceAvatar has size-dependent ring thickness (sm: ring-2, md: ring-3, lg: ring-4)
- ConversationItem has outer border on avatar that appears only when conversation is active
- Toast system uses `appToast(title, options)` - options include `description`, `avatarUrl`, `silent`, `variant`
- Toast duration is stored in localStorage config (`toastDuration` in seconds, default 5)
- SVG countdown uses `pathLength="100"` with `stroke-dashoffset` animation for uniform speed
- AppToast files are split: `appToast.ts` (queue/function) and `AppToastContainer.tsx` (component) to avoid ESLint fast-refresh warnings
- Notification type "auto" uses toast when window focused, system notification when not
- RNNoise processor is cached globally - state persists across all audio (correct for real-time voice chat)
- RNNoise requires exactly 480 samples at 48kHz - resample and pad as needed
- AudioWorklets implemented for both RNNoise (real-time) and recording (with VAD)
- VAD threshold is in dB (-100 to 0), default -70 dB, with 300ms hang time
- Input volume uses GainNode - changing it affects VAD threshold behavior (may need recalibration)
- Auto Gain Control removed from settings (interfered with VAD threshold consistency)
- Echo cancellation disabled by default (only useful without headphones)
- **CRITICAL**: Never call `navigator.mediaDevices.getUserMedia()` directly - always use `useMediaStream` hook
- MediaRegistry tracks active streams - orphaned streams are a privacy violation
- Race condition in useMediaStream was fixed with `startingRef` and post-await stream check
- All settings sections use `SettingSelect` for row-style dropdowns (generic, type-safe)
- `SelectDropdown` is now compact-only (removed row variant after DRY consolidation)
- CSS files are kept for animations Tailwind can't handle (keyframes, mask-image, webkit-app-region)
- VoiceRecorderButton: VAD is disabled for voice messages (unlike real-time calls) to preserve natural pauses
- VoiceRecorderButton: `maxDuration` prop controls auto-stop (30s in settings, 60s default for chat)
- VoiceRecorderButton: Click-to-seek only works while audio is playing (not when paused)
- VoiceRecorderButton: Waveform bars use `left` positioning (not `translateX`) for proper vertical centering
- Permission reset only works in Tauri (desktop) - web browsers require manual settings access
- useMediaPermission uses lazy initializer pattern to avoid repeated localStorage reads
- Tauri notification permissions are handled by OS natively, not web-style prompts
- NotificationPromptStatus renamed from NotificationPermissionStatus for clarity (it tracks prompt shown, not granted/denied)
- Use `cn()` utility from `@/utils` for conditional class concatenation (cleaner than template literals)
- SettingsControls use HeroUI v3 `Label` with `isDisabled` prop and `Description` component for proper disabled styling
- PresenceAvatar CSS pulse animation uses box-shadow instead of ring classes (avoids !important overrides)
- Always use translation keys for user-visible strings - never hardcode text (e.g., APP_TITLE for app name)
- Screen sharing uses `getDisplayMedia()` (not `getUserMedia()`) - settings are "hints", browser may not honor them
- System audio capture only works on Windows + Chromium (OS-level limitation on macOS/Linux)
- Screen sharing FPS options include bandwidth hints (e.g., "60 fps (~4-10 Mbps)") for user guidance
- High FPS (120/144) is valid for game streaming at lower resolutions
- `VIDEO_CODEC_OPTIONS` is shared between VideoSection and ScreenSharingSection (DRY)
- `getStreamInfo()` extracts actual resolution/fps from MediaStream (DRY utility)

---

## Media Privacy System

### Overview

The app has a **centralized media access system** that ensures users always know when their microphone, camera, or screen is being accessed. The privacy indicator (presence avatar ring) pulses red when any media is active.

### Architecture

**MediaRegistry Context** (`src/context/MediaRegistryContext.tsx`):
- Tracks all active media streams globally
- Provides `registerMedia(id, type, source)` and `unregisterMedia(id)` functions
- `activeMedia` array contains `{ id, type, source }` for each active stream
- Types: `microphone`, `camera`, `screen`

**useMediaStream Hook** (`src/hooks/useMediaStream.ts`):
- **THIS IS THE ONLY APPROVED WAY TO ACCESS MEDIA IN THE APP**
- Automatically registers/unregisters with MediaRegistry
- Handles cleanup on unmount
- Prevents race conditions with concurrent calls

**Privacy Indicator** (`src/components/atoms/PresenceAvatar/`):
- Presence ring pulses between red and presence color when `mediaActive` prop is true
- Animation uses CSS `box-shadow` (not ring class) because CSS variables don't interpolate
- 3-second ease-in-out infinite animation
- Clicking avatar opens `PrivacyIndicatorModal` showing what's active and where

### Critical Bug Fix (Race Condition)

A critical privacy bug was fixed where the microphone could stay active while the indicator showed inactive:

**The Bug**: In React Strict Mode or rapid remounts:
1. First `start()` calls `getUserMedia()` (async, pending)
2. Component unmounts, cleanup runs (`streamRef.current` is still null)
3. Component remounts, second `start()` calls `getUserMedia()` (another pending)
4. First `getUserMedia()` resolves → sets `streamRef.current = stream1`
5. Second `getUserMedia()` resolves → **overwrites** `streamRef.current = stream2`
6. `stream1` is now orphaned - never stopped, never tracked!

Result: Mic stays on, but indicator shows inactive (false sense of security).

**The Fix** (in `useMediaStream.ts`):
1. **`startingRef`** - Prevents concurrent `getUserMedia()` calls
2. **Post-await check** - After `getUserMedia()` resolves, check if another stream was already acquired:
```typescript
// Check if another stream was acquired while we were waiting (race condition)
if (streamRef.current) {
  mediaStream.getTracks().forEach((track) => track.stop());
  return streamRef.current;
}
```

### Usage

```typescript
// CORRECT: Use the centralized hook
const { stream, start, stop, isActive } = useMediaStream({
  type: "microphone",
  source: "Voice Message",  // Human-readable, shown in privacy modal
  constraints: { audio: true },
});

// WRONG: Never call getUserMedia directly!
// const stream = await navigator.mediaDevices.getUserMedia(...); // BAD!
```

### Files

- `src/context/MediaRegistryContext.tsx` - Provider with register/unregister
- `src/context/MediaRegistryContext.types.ts` - Types (avoids fast-refresh warning)
- `src/context/useMediaRegistry.ts` - Hook to access registry
- `src/hooks/useMediaStream.ts` - Centralized media access hook
- `src/components/atoms/PresenceAvatar/PresenceAvatar.tsx` - Avatar with `mediaActive` prop
- `src/components/atoms/PresenceAvatar/PresenceAvatar.css` - Pulse animation keyframes
- `src/components/molecules/PrivacyIndicatorModal/` - Modal showing active media sources
- `src/utils/media.ts` - DRY utilities: `stopMediaStream()`, `closeAudioContext()`, `heightToResolutionLabel()`, `getStreamInfo()`

---

## Video Settings Implementation Notes

### CameraPreview Component

The `CameraPreview` component in `VideoSection.tsx` demonstrates the privacy-first approach:

1. **Explicit activation**: Camera is NOT started automatically. User must click the start button.
2. **Privacy indicator**: Uses `useMediaStream` hook which registers with MediaRegistry (avatar pulses red when active)
3. **Actual resolution display**: Shows what the camera is actually providing, not what was requested:
   - Uses `MediaStreamTrack.getSettings()` to get actual width/height/frameRate
   - Converts height to label (480p, 720p, 1080p, etc.) for consistency with dropdown
   - If camera can't provide requested resolution, shows what it actually provides
4. **HeroUI Chips**: Resolution and FPS displayed as separate Chips with icons (Display icon, CirclePlay icon)

### Resolution Constraints

Video settings use `ideal` constraints, meaning the browser will provide the closest match the camera supports:
```typescript
const RESOLUTION_CONSTRAINTS = {
  "480p": { width: { ideal: 640 }, height: { ideal: 480 } },
  "720p": { width: { ideal: 1280 }, height: { ideal: 720 } },
  "1080p": { width: { ideal: 1920 }, height: { ideal: 1080 } },
  // etc.
};
```

If a user's camera only supports 720p but they select 1080p, the camera will provide 720p and the Chips will show "720p" (actual), not "1080p" (requested).

### Advanced Settings

Advanced video settings (codec, bitrate, hardware acceleration, simulcast) are stored in config but disabled in the UI with a "coming soon" tooltip. These will take effect when video calls are implemented via MatrixRTC.

### Why No Mirror Setting

The mirror setting was removed because:
- CSS `scaleX(-1)` only affects the local preview, not what others see
- This creates confusion - users expect to see what others see
- Secludia's privacy-first approach: WYSIWYG (What You See Is What You Get)
- Video is never mirrored - shows exactly what will be transmitted

### Why No Background Blur

Background blur was removed because:
- It was decorative (stored in config but never applied to video stream)
- Real implementation requires ML-based segmentation (TensorFlow.js or similar)
- Will be implemented properly when video calls are built

---

## Screen Sharing Settings Implementation Notes

### ScreenSharePreview Component

The `ScreenSharePreview` component in `ScreenSharingSection.tsx` follows the same privacy-first approach as video:

1. **Explicit activation**: Screen sharing NOT started automatically. User clicks start button.
2. **Privacy indicator**: Uses `useMediaStream` hook with `type: "screen"` for `getDisplayMedia()`
3. **Actual resolution display**: Shows what the stream is actually providing (may differ from requested)
4. **Fullscreen button**: Tertiary variant button in bottom-right corner for full-screen preview

### Screen vs Camera Differences

| Aspect | Camera (`getUserMedia`) | Screen (`getDisplayMedia`) |
|--------|-------------------------|---------------------------|
| API | `getUserMedia()` | `getDisplayMedia()` |
| Device selection | Programmatic via `deviceId` | Browser picker UI |
| Constraints | Respected | "Hints" only |
| Audio | Separate permission | Optional, Windows only |
| Restart needed | On device/settings change | On any constraint change |

### System Audio Capture

System audio capture (including audio from the computer in screen share) only works on:
- **Windows + Chromium**: Full support via WebView2
- **macOS**: OS-level restriction - apps can't capture system audio without kernel extension
- **Linux/WebKitGTK**: Not supported

The `usePlatform` hook detects this capability via `supportsSystemAudioCapture`:
```typescript
const supportsSystemAudioCapture = platform === "windows" && effectiveBrowser === "chromium";
```

The switch is disabled and OFF on non-Windows platforms.

### Smart Audio Toggle

When toggling system audio capture:
- **Disable audio**: Just stop audio tracks instantly (no restart needed)
- **Enable audio**: Must restart stream (shows picker again) because `getDisplayMedia()` must be called with new constraints

### High FPS Options

Screen sharing includes higher FPS options than video (up to 144 fps) because:
- Game streaming benefits from high frame rates at lower resolutions
- 144 fps at 720p is reasonable (~10-20 Mbps)
- FPS options include bandwidth hints to help users choose appropriately

### DRY Refactoring

Shared between VideoSection and ScreenSharingSection:
- `VIDEO_CODEC_OPTIONS` constant in `configTypes.ts`
- `getStreamInfo()` utility in `utils/media.ts` - extracts resolution/fps from stream
- `heightToResolutionLabel()` utility - converts height to "720p", "1080p", etc.
