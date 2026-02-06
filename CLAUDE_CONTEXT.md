# Secludia - Claude Session Context

## Project Overview

**Secludia** is a privacy-focused Matrix client built with:
- **React 19** + **TypeScript**
- **Tauri 2** (desktop app for Windows, Mac, Linux) - *Electron migration planned*
- **HeroUI v3 Beta** (UI component library)
- **Tailwind CSS v4**
- **Vite** (bundler)
- **Vitest** (testing)

The app should work both as a **web application** and as a **desktop app** via Tauri (Electron migration planned for better Linux support - see "Platform Limitations and Future Migration" section).

---

## Architecture

### Folder Structure
```
src/
├── components/
│   ├── atoms/          # Basic UI (NavBarButton, PresenceAvatar, ProfileAvatar, EncryptionChip, Scrollbar, SelectDropdown, AppToast, VoiceRecorderButton, LoadingState, etc.)
│   ├── molecules/      # Composed components (GhostEmptyState, InputSensitivityMeter, MediaPreview, PermissionAlert, PrivacyIndicatorModal, ScrollableAlertDialog, SettingsControls, StatusMessageScreen)
│   ├── layouts/        # Layout wrappers (ErrorBoundary, ResponsiveCard)
│   ├── organisms/      # Complex components (DirectMessagesSection, SettingsModal, NotificationsSection)
│   └── system/         # Tauri-specific (TitleBar, ControlActions, ControlButton)
├── config/             # App configuration and localStorage persistence
├── constants/          # App constants (PRESENCE_RING_COLORS, SIDEBAR_WIDTH, SIMULATED_LOADING_DELAY)
├── context/            # React Context (AppContext, UserContext, AuthContext, CryptoContext)
├── hooks/              # Custom hooks (useBreakpoint, useResizable, useSidebar, useMediaDevices, etc.)
├── i18n/               # Internationalization with auto-loading locales
├── lib/                # Library code
│   ├── audio/          # Audio processing (RNNoise noise suppression)
│   └── matrix/         # Matrix/OAuth (platform-agnostic)
├── locales/            # Translation files (en.json, es.json)
├── mocks/              # Mock data for development (conversations, rooms, sessions, user)
├── platforms/          # Platform abstraction layer
│   ├── tauri/          # Tauri-specific (Stronghold storage, OAuth webview)
│   └── web/            # Web-specific (memory storage, OAuth popup)
├── screens/            # Full-page screens (LoginScreen, MainScreen, SetupSecurityScreen, VerifyDeviceScreen)
├── themes/             # CSS theme files (default, familiar, midnight, sunset, mint, ien, nanel)
├── utils/              # Utility functions (validation, string helpers)
└── test/               # Test setup
```

### Key Patterns
- **Atomic Design**: Components organized as atoms/molecules/layouts/organisms/system
- **Barrel Exports**: Every folder has `index.ts` for clean imports
- **Colocation**: Types, styles, tests colocated with components
- **Memoization**: All components use `memo()`, callbacks use `useCallback`
- **BEM CSS**: Class naming follows BEM convention (e.g., `sidebar__content--open`)
- **Platform Abstraction**: Platform-specific code isolated in `src/platforms/` (see below)
- **DRY Settings Controls**: `SettingSwitch`, `SettingSlider`, `SettingSelect<T>` in molecules
- **Generic Components**: Type-safe with `<T extends string>` for dropdowns/selectors
- **Centralized Media Access**: All media access through `useMediaStream` hook (privacy)

### Platform Architecture

Platform-specific code is isolated from the app logic:

```
src/platforms/
├── types.ts              # Platform interface (TokenStorage, OAuthWindow)
├── loader.ts             # Dynamic platform loading
├── PlatformContext.tsx   # React context provider
├── index.ts              # Barrel exports
│
├── tauri/                # Tauri desktop platform
│   ├── storage.ts        # Stronghold encrypted storage
│   ├── oauth-window.ts   # WebView OAuth window
│   └── index.ts          # Platform implementation
│
└── web/                  # Web browser platform
    ├── storage.ts        # Memory-only storage
    ├── oauth-popup.ts    # Popup OAuth window
    └── index.ts          # Platform implementation
```

**Key Interfaces:**
```typescript
interface Platform {
  isTauri: boolean;       // true for desktop app
  isWeb: boolean;         // true for browser
  storage: TokenStorage;  // store/get/clear tokens
  oauth: OAuthWindow;     // open OAuth URL, return callback
  permissions: PlatformPermissions;  // WebView permission reset
}
```

**Usage in Components:**
```typescript
const platform = usePlatform();
if (platform.isTauri) { /* desktop-specific */ }
await platform.storage.store(tokens);
const callbackUrl = await platform.oauth.open(authUrl);
```

**Benefits:**
- Boolean flags (`isTauri`/`isWeb`) instead of string comparisons
- Matrix/OAuth code is platform-agnostic (`src/lib/matrix/`)
- Easy to add new platforms (React Native, Electron)
- Testable with mock platform implementations

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
8. **Theme System** - 8 themes with localStorage persistence (includes Ien for protanopia/deuteranopia, Nanel for tritanopia)
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
- `Scrollbar.tsx` - Custom scrollbar with OverlayScrollbars and shadow detection (options extracted to `SCROLLBAR_OPTIONS` module-level constant)
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
    - `FLIP_CLASS` uses Tailwind `-scale-x-100` (no inline style object creation)
    - `will-change: left` CSS hint for waveform bar transitions
    - `ResizeObserver` for responsive bar count
  - CSS file: `VoiceRecorderButton.css` with pulse-fade animation for indicator (100% to 35% opacity)
- `AppToast/` - Toast notification system:
  - `appToast.ts` - Queue, `appToast()` function, and `AppToastContent` type
  - `AppToastContainer.tsx` - React component with SVG countdown animation
  - `AppToast.css` - Animation keyframes and HeroUI overrides
- `LoadingState/` - Reusable loading indicator:
  - Shows HeroUI Spinner with optional message
  - `fullscreen` prop: fills entire screen with background (for standalone pages)
  - Non-fullscreen: centered with padding (for inline use in cards)
  - Optional `onCancel` prop: shows ghost "Cancel" button when provided (used by awaiting_approval state)
  - Used in: App.tsx (initializing), LoginScreen (loading), OAuthCallback (completing auth), SecuritySetupGate (awaiting approval)

### Components (Molecules)
- `GhostEmptyState.tsx` - Empty state with ghost icon and wave text animation
  - Wave animation on both ghost and text (per-word delay)
  - Clickable ghost triggers action (e.g., opens new chat modal)
  - CSS animation in `GhostEmptyState.css`
- `MediaPreview/` - Reusable media preview for camera and screen sharing:
  - Handles stream management, preview display, resolution/FPS chips, error states
  - Props: `type`, `source`, `constraints`, `restartDeps`, `startLabel`, `stopLabel`, `startIcon`
  - Optional: `objectFit` (cover/contain), `showFullscreenButton`, `onAudioTrackChange`
  - Used by VideoSection (camera) and ScreenSharingSection (screen share)
  - Consolidates ~200 lines of duplicate preview logic
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
- `StatusMessageScreen/` - Full-page status display:
  - Centered layout with icon, title, message, and hint text
  - Uses HeroUI Text components for consistent typography
  - Props: `icon` (ReactNode), `iconColor` (Tailwind class), `title`, `message`, `hint`
  - Used for: locked accounts, suspended accounts, and similar status pages
- `ScrollableAlertDialog/` - Reusable scrollable alert dialog:
  - Variant-based styling with default icons (default, accent, success, warning, danger)
  - Custom Scrollbar for content, header/footer always visible
  - Flexible button array with loading/disabled states
  - Props: `isOpen`, `onOpenChange`, `variant`, `title`, `subtitle?`, `icon?`, `buttons?`, `children`
  - Size options: xs, sm, md, lg, cover
  - Dismissable options: `isDismissable`, `isKeyboardDismissDisabled`
  - Used for: recovery key dialogs, confirmation dialogs
- `AuthSelectors/` - Theme and language selector pair for auth/security screens
- `SettingItem/` - Reusable `LabeledItem` component with icon, label, description, and optional control slot

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
- `SessionsSection.tsx` - Current and other sessions display:
  - Accordion-based expandable device list with HeroUI components
  - Device details: last active, signed in date, device ID, IP, user agent
  - Verification status chips (verified/unverified) using CryptoApi
  - Current device highlighted with accent-colored icon
  - "Manage this device" button links to external account management portal
  - Uses `getUserDeviceInfo()` for batch verification status fetch (efficient single query)
  - Note: Device deletion not supported with OAuth tokens - users redirected to account portal
- `SecuritySetupGate/` - Gate component for E2EE setup flow after authentication:
  - Uses CryptoContext to determine screen: loading, verify device, setup security, recovery key display
  - Handles `awaiting_approval` status: shows LoadingState with cancel button during UIA polling
  - Renders children (main app) when crypto status is `ready`
  - Error translation: tries `CRYPTO_{code}` key, falls back to raw message
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
  - Uses `MediaPreview` molecule with `type="camera"` for live preview
  - Advanced settings (disabled until video calls implemented): codec, bitrate, hardware acceleration, simulcast
  - Lazy state initializer for config (reads localStorage once on mount)
  - Controls disabled when permission not granted
  - **Removed**: Mirror setting (video is never mirrored - shows exactly what others see)
  - **Removed**: Low light adjustment (was placeholder, not implemented)
  - **Removed**: Background blur (was decorative, not implemented)
- `ScreenSharingSection.tsx` - Screen share settings (persisted to localStorage):
  - Resolution (720p-4K), frame rate (15/30/60/120/144 fps with bandwidth hints)
  - System audio capture toggle (Windows only - uses `usePlatform` for detection)
  - Uses `MediaPreview` molecule with `type="screen"` and `showFullscreenButton`
  - Smart audio toggle via `onAudioTrackChange`: disable = instant (stop tracks), enable = restart stream
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
  - Track "ended" event listeners stored in ref and properly removed on `stop()` and unmount (prevents memory leaks)
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
- `usePersistedSetting.ts` - DRY helper for settings with localStorage sync:
  - Combines local state with automatic persistence
  - Usage: `const [value, setValue] = usePersistedSetting(initialValue, persistFn)`
  - Used throughout settings sections to reduce boilerplate
- `useMatrixClient.ts` - Access the Matrix client instance:
  - Returns client, isSyncing, error, start(opts?), stop()
  - `start()` accepts optional `IStartClientOpts` to override default sync options (e.g. minimal filter)
  - Client is created by AuthContext when authenticated
  - Provides syncing controls for room/message sync
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
- `CryptoContext.tsx` - Crypto status management with **deferred crypto init** and **two-phase sync**:
  - Init phase uses HTTP-only `checkCrossSigningStatus()` (no crypto) to determine path:
    - Skip flag → full sync without crypto → `ready`
    - No cross-signing keys → minimal sync without crypto → `needs_setup`
    - Device already verified → init crypto → full sync → `ready`
    - Device not verified → minimal sync without crypto → `needs_verification`
  - Crypto only initialized on demand: when user bootstraps (needs_setup) or enters correct recovery key (needs_verification)
  - Wrong recovery keys rejected via `validateRecoveryKey()` (pure Web Crypto) — no IndexedDB created
  - On correct key: init crypto → restart sync with crypto → wait for OlmMachine to process /keys/query → verify
  - Phase 2: When status becomes `ready`, upgrades to full sync via `restartMatrixClient()`
  - `fullSyncStartedRef` ensures phase 2 upgrade only fires once per session
  - Verification uses `setPendingSecretStorageKey()` to provide recovery key to SDK's `getSecretStorageKey` callback
  - **Identity reset with UIA**: Replacing existing cross-signing keys requires User-Interactive Authentication (m.oauth type). The `authUploadDeviceSigningKeys` callback extracts the approval URL from the 401 response `params["m.oauth"].url`, opens it in a new tab, then polls `makeRequest(null)` every 3s until approved. Uses AbortController for instant cancellation.
  - **`awaiting_approval` status**: Shown during UIA polling — renders LoadingState with cancel button
  - `buildMinimalSyncOpts(userId)` helper: DRY extraction of minimal sync options (filter + initialSyncLimit: 0 + disablePresence + pollTimeout)
  - `ensureCrypto()` helper: init crypto on demand for action handlers
- `CryptoContext.types.ts` - Types for CryptoStatus, CryptoContextValue. Re-exports `CryptoError` and `BootstrapResult` from `@/lib/matrix/crypto/types` (canonical source)
- `AuthContext.tsx` - Auth status state machine, login/logout/token refresh
- `AuthContext.types.ts` - AuthStatus, AuthError, AuthContextValue types
- `MediaRegistryContext.tsx` - Tracks active media streams for privacy indicator (see Media Privacy System below)
- `MediaRegistryContext.types.ts` - Types for MediaRegistry (MediaType, MediaUsage, context value)
- `useAppContext.ts` / `useUserContext.ts` / `useMediaRegistry.ts` / `useAuthContext.ts` / `useCryptoContext.ts` - Hooks to access context safely

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
- `MainScreen.tsx` - Main app screen with sidebar + content layout (no props - uses context)
- `MainScreen.css` - Responsive styles with CSS custom properties and media query ranges
- `OAuthCallback/` - OAuth callback handler for web popups
- `SetupSecurityScreen/` - New user E2EE setup (create recovery key):
  - `SetupSecurityScreen.tsx` - "Set Up Encryption" screen with create button
  - `RecoveryKeyDisplay.tsx` - Shows generated recovery key, copy button, warning, checkbox confirmation
- `VerifyDeviceScreen/` - Existing user device verification:
  - Recovery key input field with validation
  - "I don't have my recovery key" link → options dialog (reset/skip)

### App Entry (`App.tsx`)
- Memoized with `memo()`
- Extracted helper components: `CenteredContainer` (local), `StatusMessageScreen` (molecule), `LoadingState` (atom)
- Uses proper icons (Lock, TriangleExclamationFill) instead of emoji
- Handles all auth states: initializing, discovering, authenticating, authenticated, error, soft_logout, locked, suspended
- OAuth callback routing: `/oauth/callback` renders `OAuthCallback` component (web only)

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

2. **Matrix Integration** - ✅ OAuth 2.0 auth implemented, SDK wired up:
   - ✅ OAuth 2.0 authentication flow (PKCE, dynamic client registration)
   - ✅ Matrix SDK integration (`matrix-js-sdk` initialized on auth)
   - ⏳ Room sync, message sending/receiving
   - ⏳ Replace mock data with real conversations
   - ⚠️ **Known issues** - See "Matrix OAuth Implementation" section below

3. **VoIP/Video Calls** - MatrixRTC integration:
   - **1:1 DM calls**: P2P WebRTC (full-mesh transport) - direct connection, no server
   - **3+ participants**: LiveKit SFU - discovered via well-known (see "Well-Known Discovery" section)
   - Both use MatrixRTC protocol with different transports
   - **Screen sharing**: Supported in P2P, with quality options up to 4K 60fps for power users
   - **RTC foci**: Stored in DiscoveryResult from well-known lookup

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

## Matrix Protocol Fundamentals

### Overview

Matrix is a set of open APIs for decentralised communication. Clients communicate with their homeserver via the **Client-Server API**, and homeservers synchronise data via the **Server-Server API** (Federation).

### Architecture

```
{ Client A }                                { Client B }
     |                                           |
     | Client-Server API                         | Client-Server API
     V                                           V
+------------+     Server-Server API      +------------+
| Homeserver |<-------------------------->| Homeserver |
| matrix.org |      (Federation)          | example.org|
+------------+                            +------------+
```

- Clients synchronise with their homeserver using HTTP/JSON
- Homeservers replicate room data across the federation
- No single point of control - rooms exist across multiple servers

### Identifiers

| Type | Format | Example | Notes |
|------|--------|---------|-------|
| **User ID** | `@localpart:domain` | `@alice:matrix.org` | Immutable, globally unique |
| **Room ID** | `!opaque_id:domain` | `!abc123:matrix.org` | Immutable, globally unique (domain is just namespace, room doesn't "live" there) |
| **Room Alias** | `#alias:domain` | `#general:matrix.org` | Human-readable, can change which room it points to |
| **Device ID** | string | `ABCD1234` | Unique per user, manages E2EE keys |

**Device ID in OAuth**: Our OAuth scope includes `urn:matrix:org.matrix.msc2967.client:device:{deviceId}` to bind the session to a specific device for E2EE key management.

### Events

All data in Matrix is expressed as **events**. Events have:
- **type**: Namespaced identifier (e.g., `m.room.message`, `com.example.custom`)
- **content**: JSON object (untrusted - must validate schema before use)

**Two categories**:
1. **Message events**: Transient activity (messages, VoIP calls, file transfers)
2. **State events**: Persistent room state (name, topic, membership, power levels)

**Namespacing**: `m.*` reserved for spec, custom types use Java package naming (e.g., `com.secludia.custom`)

### Room Structure

Rooms are identified by Room ID and contain a **Directed Acyclic Graph (DAG)** of events:
- Events reference parent events (partial ordering)
- Each event has a **depth** (positive integer > all parents' depths)
- State is computed by traversing the DAG with conflict resolution

```
┌─────────────────────────────────────────────┐
│  Room: !abc123:matrix.org                   │
│                                             │
│  State:                                     │
│    m.room.name: "General Chat"              │
│    m.room.member (@alice): "join"           │
│    m.room.member (@bob): "join"             │
│                                             │
│  Message DAG:                               │
│    Event A (depth 1) ← Event B (depth 2)    │
│                     ← Event C (depth 2)     │
│                         ↖ Event D (depth 3) │
└─────────────────────────────────────────────┘
```

### Timestamps

- Milliseconds since Unix epoch (1970-01-01 00:00:00 UTC)
- Does NOT count leap seconds (each day is exactly 86,400,000 ms)
- This matches our `expiresAt` in `TokenSet` and JavaScript's `Date.now()`

### API Versioning

- **Spec version**: `vX.Y` (e.g., v1.11) - global Matrix specification version
- **Endpoint version**: Individual (e.g., `/v3/sync`, `/v3/profile`)
- Endpoints are versioned independently - `/v4/sync` can exist while `/v3/profile` is unchanged
- Deprecated endpoints must be implemented for advertised versions

### Requirement Levels (RFC 2119)

The Matrix spec uses RFC 2119 keywords:
- **MUST** / **MUST NOT**: Absolute requirement
- **SHOULD** / **SHOULD NOT**: Strong recommendation, may ignore with good reason
- **MAY** / **OPTIONAL**: Truly optional

### Relevance to Secludia

| Concept | Our Implementation |
|---------|-------------------|
| User ID | Stored in `StoredSession.userId` |
| Device ID | Generated in OAuth flow, stored in session, used for E2EE |
| Room ID | Used in `AppContext.selectedRoom` |
| Events | Will be processed via `matrix-js-sdk` sync |
| Timestamps | `TokenSet.expiresAt` uses ms since epoch |
| Client-Server API | All requests go through authenticated fetch |

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

- **⚠️ SECURITY**: Stronghold password is hardcoded - implement OS keychain storage before production (see "Token Storage Security" section)
- **Logout disabled**: Logout logic removed pending proper implementation - button just logs to console
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
- `MediaPreview` molecule consolidates camera and screen share preview logic (~200 lines saved)
- Device verification uses `getUserDeviceInfo()` batch query (efficient single call vs N individual calls)
- Device deletion not supported with OAuth tokens per Matrix spec - redirect users to account management portal
- **Deferred crypto init**: CryptoContext uses HTTP-only `checkCrossSigningStatus()` to determine crypto path without initializing WASM/IndexedDB. Crypto is only initialized when the user takes action (bootstrap or enter correct recovery key). Skip users never touch crypto.
- **Two-phase sync**: CryptoContext starts with minimal sync filter (no timelines/presence/ephemeral, `pollTimeout: 10000`), then upgrades to full sync when crypto status becomes `ready`
- `createMinimalSyncFilter(userId)` creates a Filter that skips presence, room timelines (limit: 0), and ephemeral events
- `restartMatrixClient(opts?)` stops sync loop and ancillary services WITHOUT touching crypto backend, then starts fresh sync. **NEVER use `stopClient()`** for sync-only restarts — it permanently destroys the WASM OlmMachine.
- `restartMatrixClientAndWaitForSync(opts?)` — same as `restartMatrixClient` but returns a Promise that resolves when sync reaches Prepared/Syncing. Used after on-demand crypto init so the OlmMachine can process `/keys/query`.
- `waitForCrossSigningKeys(crypto, timeoutMs)` — polls `userHasCrossSigningKeys()` every 500ms after sync restart. Needed because `SyncState.Prepared` fires before `onSyncCompleted → processOutgoingRequests` processes the `/keys/query` response.
- `clearLocalStorageAuthData()` also cleans up `mxjssdk_*` localStorage entries (SDK MemoryStore cached sync filters)
- `fullSyncStartedRef` in CryptoContext ensures phase 2 upgrade only fires once per session, resets on logout
- **UserContext gates on crypto**: Profile/presence fetches only fire when `cryptoStatus === "ready"` (prevents premature API calls during pre-verification phase)
- **Recovery key is base58 (case-sensitive)**: `decodeUserRecoveryKey()` normalizes whitespace but does NOT change case. `.toUpperCase()` would corrupt the key.
- **Crypto database names**: WASM module creates `secludia-crypto::matrix-sdk-crypto` and `secludia-crypto::matrix-sdk-crypto-meta` (double colon + SDK suffix). NOT `{prefix}:{userId}`.
- **COOP/COEP headers removed from vite.config.ts**: Were blocking cross-origin images (avatars). WASM crypto doesn't need SharedArrayBuffer.
- **Identity reset UIA**: Replacing existing cross-signing keys via `POST /keys/device_signing/upload` requires User-Interactive Authentication. For OAuth 2.0 clients, the server returns a 401 with `params["m.oauth"].url` (the approval URL). We open this URL in a new tab and poll `makeRequest(null)` every 3s until the server accepts. The approval URL comes from the server response — never constructed by the client.
- **Cancellable polling**: Uses `AbortController` with `signal.addEventListener("abort", ...)` on the sleep timer for instant cancel response (no 3s delay). Cancellation returns `{ success: false }` without error (not treated as an error state).
- **Shared types in lib layer**: `CryptoError` and `BootstrapResult` are defined in `src/lib/matrix/crypto/types.ts` (canonical source) and re-exported from `CryptoContext.types.ts`. This breaks the circular dependency where `bootstrap.ts` (lib) needed types from `CryptoContext.types.ts` (context).
- PresenceAvatar CSS uses single keyframe with `--presence-color` CSS variable (DRY, reduced from 64 to 37 lines)
- setTimeout in settings sections uses refs with proper cleanup on unmount (memory leak prevention)
- PresenceAvatar CSS pulse animation uses box-shadow instead of ring classes (avoids !important overrides)
- Always use translation keys for user-visible strings - never hardcode text (e.g., APP_TITLE for app name)
- Screen sharing uses `getDisplayMedia()` (not `getUserMedia()`) - settings are "hints", browser may not honor them
- System audio capture only works on Windows + Chromium (OS-level limitation on macOS/Linux)
- Screen sharing FPS options include bandwidth hints (e.g., "60 fps (~4-10 Mbps)") for user guidance
- High FPS (120/144) is valid for game streaming at lower resolutions
- `VIDEO_CODEC_OPTIONS` is shared between VideoSection and ScreenSharingSection (DRY)
- `getStreamInfo()` extracts actual resolution/fps from MediaStream (DRY utility)
- **Matrix OAuth**: `client_uri` is REQUIRED for matrix.org registration (returns 400 without it)
- **Matrix OAuth**: Login works but may have issues - needs investigation
- **Matrix OAuth**: `src/lib/matrix/` contains all Matrix/OAuth logic (types match spec: `OAuthClientMetadata`, `OAuthClientRegistrationResponse`)
- **Matrix OAuth**: AuthContext is parent of UserContext in provider hierarchy
- **Matrix OAuth**: Stronghold password derivation uses argon2 with fixed salt (in Rust side)
- **Security**: CSP enabled in tauri.conf.json - restricts script/style/connect sources
- **Security**: URL validation blocks `javascript:`, `data:`, `blob:`, `file:` protocols
- **Security**: OAuth window only allows https:// URLs (http://localhost for dev)
- **OAuth cancel**: Closing OAuth window silently returns to login (not treated as error)
- **Error translation**: All errors use translation keys (e.g., `DISCOVERY_ERROR_HOMESERVER_FAILED`) translated at UI layer via `t()`
- **OAuth callback (web)**: Uses fragment mode (`response_mode=fragment`), parses `window.location.hash`
- **OAuth callback security**: Clears auth code from history (`replaceState`) before closing popup
- **Account management**: URL from well-known MSC2965 `account` field, fallback to auth_metadata `account_management_uri`
- **Account management**: Button disabled if no URL available (some servers don't provide it)
- **RTC foci**: LiveKit SFU discovered via well-known MSC4143 `rtc_foci` array
- **RtcFocus type**: Uses index signature `[key: string]: unknown` for future focus types
- **Code audit completed**: All console.log/error statements guarded with `import.meta.env.DEV` (except ErrorBoundary, i18n dev warnings, and audio worklet processors). Dead code removed: `card__description` CSS class (5 files), deprecated `SettingItem` alias, unused `stopMediaStream` barrel export. All template literal class concatenation replaced with `cn()` utility (PresenceAvatar, ProfileAvatar, StatusMessageScreen, MediaPreview, LabeledItem). Scrollbar inline options extracted to module constant. useMediaStream track ended listeners properly cleaned up.
- **Accessibility themes**: Ien (protanopia/deuteranopia) and Nanel (tritanopia) use color-blind friendly palettes
- **Ien theme**: Blue/yellow contrast, cyan-blue for success (not green), amber for warning
- **Nanel theme**: Red/pink/cyan contrast, magenta accent (not blue), orange for warning (not yellow), green for success

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
- Handles cleanup on unmount (including track "ended" event listener removal)
- Prevents race conditions with concurrent calls
- Track ended handlers stored in ref for proper `removeEventListener` on stop/unmount

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
- `src/components/atoms/PresenceAvatar/PresenceAvatar.css` - Single pulse animation using CSS variable for presence color (DRY - no duplicate keyframes)
- `src/components/molecules/PrivacyIndicatorModal/` - Modal showing active media sources
- `src/utils/media.ts` - DRY utilities: `closeAudioContext()`, `heightToResolutionLabel()`, `getStreamInfo()`

---

## Video Settings Implementation Notes

### MediaPreview Component

The `MediaPreview` molecule (used by both `VideoSection` and `ScreenSharingSection`) demonstrates the privacy-first approach:

1. **Explicit activation**: Media is NOT started automatically. User must click the start button.
2. **Privacy indicator**: Uses `useMediaStream` hook which registers with MediaRegistry (avatar pulses red when active)
3. **Actual resolution display**: Shows what the stream is actually providing, not what was requested:
   - Uses `MediaStreamTrack.getSettings()` to get actual width/height/frameRate
   - Converts height to label (480p, 720p, 1080p, etc.) for consistency with dropdown
   - If camera/screen can't provide requested resolution, shows what it actually provides
4. **HeroUI Chips**: Resolution and FPS displayed as separate Chips with icons (Display icon, CirclePlay icon)
5. **Smart restarts**: Monitors `restartDeps` array and restarts stream when settings change (only if active)
6. **Audio track handling**: Optional `onAudioTrackChange` callback for screen share audio toggle without full restart

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

### MediaPreview for Screen Sharing

The `MediaPreview` molecule in `ScreenSharingSection.tsx` is configured with `type="screen"` and follows the same privacy-first approach:

1. **Explicit activation**: Screen sharing NOT started automatically. User clicks start button.
2. **Privacy indicator**: Uses `useMediaStream` hook with `type: "screen"` for `getDisplayMedia()`
3. **Actual resolution display**: Shows what the stream is actually providing (may differ from requested)
4. **Fullscreen button**: Enabled via `showFullscreenButton` prop - tertiary variant button in bottom-right corner

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

---

## Notes for Matrix OAuth (for next session)

- **AuthContext** wraps UserContext in main.tsx (AuthContext → UserContext hierarchy)
- **LoginScreen** now accepts additional props: `loadingMessage`, `onRetry`, `onClearError`
- **App.tsx** handles auth status state machine and OAuth callback routing
- **matrix-js-sdk** is initialized via `createMatrixClient()` when authenticated
- **Token refresh** is scheduled automatically before expiry (60s buffer)
- **Stronghold password** is currently hardcoded - see "Token Storage Security" section for fix
- **Tauri OAuth window** uses `on_page_load` callback to intercept navigation to localhost callback
- **Web OAuth popup** uses `window.postMessage` to communicate callback URL to opener
- **Client registration** happens fresh on each login (no caching - registration is idempotent)
- **Session metadata** stored in localStorage key `secludia.matrix.session`
- **Tokens** stored in Stronghold (Tauri) or memory (web)
- **PKCE state** temporarily stored in localStorage during auth flow, cleared after use

---

## Matrix OAuth 2.0 Implementation

### Overview

Matrix authentication uses **OAuth 2.0 with PKCE** (RFC 7636) and **Dynamic Client Registration** (RFC 7591). The implementation supports both Tauri desktop (with secure Stronghold storage) and web browsers (memory-only tokens).

### Architecture

**OAuth Flow**:
1. User enters homeserver URL → App discovers OAuth endpoints
2. App performs **dynamic client registration** with the auth server
3. App opens **Tauri window** (desktop) or **popup** (web) to authorization endpoint
4. User authenticates in that window
5. OAuth redirects to callback → App **intercepts navigation** (Tauri) or receives **postMessage** (web)
6. App exchanges auth code for tokens using PKCE verifier
7. Tokens stored securely → Session established

**Token Storage**:
- **Tauri**: `tauri-plugin-stronghold` (encrypted at rest, argon2 key derivation)
- **Web**: Memory-only (tokens cleared on page refresh - secure default)

### Files

**Matrix Library (`src/lib/matrix/`)** - Platform-agnostic:
| File | Purpose |
|------|---------|
| `types.ts` | All Matrix/OAuth type definitions (AuthMetadata, OAuthClientMetadata, TokenSet, PKCEChallenge, errors) |
| `constants.ts` | OAuth scopes, Matrix error codes, storage keys, redirect URIs |
| `discovery.ts` | Server discovery (uses SDK AutoDiscovery + custom auth_metadata) |
| `auth/` | PKCE, authorization URL, token exchange/refresh/revocation, client registration |
| `storage/` | Session metadata in localStorage, PKCE state |
| `client.ts` | matrix-js-sdk wrapper, initialization, two-phase sync support (`startMatrixClient`, `restartMatrixClient`, `createMinimalSyncFilter`). Default crypto callbacks wired via `getDefaultCryptoCallbacks()`. `restartMatrixClient()` stops only the sync machinery (not crypto) to preserve the WASM OlmMachine. |
| `presence/` | Presence management and support detection |
| `devices/` | Device management (list, verification status via CryptoApi batch query) |
| `index.ts` | Barrel exports |

**Auth Context (`src/context/`)**:
| File | Purpose |
|------|---------|
| `AuthContext.types.ts` | AuthStatus, AuthError, AuthContextValue types |
| `AuthContext.tsx` | Provider with login/logout/token refresh logic |
| `useAuthContext.ts` | Hook to consume auth context |

**Hooks (`src/hooks/`)**:
| File | Purpose |
|------|---------|
| `useMatrixClient.ts` | Access initialized matrix-js-sdk client |

**Screens (`src/screens/`)**:
| File | Purpose |
|------|---------|
| `OAuthCallback/` | OAuth callback handler for web popups |

**Tauri Backend (`src-tauri/`)**:
- `Cargo.toml` - Added `tauri-plugin-stronghold`, `argon2`, `tokio`
- `capabilities/default.json` - Added stronghold permissions, window creation
- `src/lib.rs` - Stronghold init, `open_oauth_window` command

### Key Types

```typescript
// Session stored in Stronghold (sensitive)
interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number; // Unix timestamp ms
}

// Session metadata in localStorage (non-sensitive)
interface StoredSession {
  userId: string;
  deviceId: string;
  homeserverUrl: string;
  clientId: string;
  issuer: string;
}

// Runtime session
interface MatrixSession {
  userId: string;
  deviceId: string;
  homeserverUrl: string;
  accessToken: string;
}

// Auth status state machine
type AuthStatus = "initializing" | "unauthenticated" | "discovering" | "authenticating" | "authenticated" | "error";
```

### Redirect URIs

| Platform | Redirect URI | Handling |
|----------|--------------|----------|
| Tauri | `http://localhost/oauth/callback` | Navigation intercepted in `on_page_load` before actual load |
| Web | `{origin}/oauth/callback` | Actual page with postMessage to opener |

### Discovery Flow

1. **Well-known lookup**: `GET https://{domain}/.well-known/matrix/client` → homeserver base URL
2. **Version check**: `GET {baseUrl}/_matrix/client/versions` → validate v1.1+ support
3. **Auth metadata**: `GET {baseUrl}/_matrix/client/v1/auth_metadata` → OAuth endpoints

**Auth Metadata Validation** (per Matrix spec):
- Required endpoints: `issuer`, `authorization_endpoint`, `token_endpoint`, `registration_endpoint`, `revocation_endpoint`
- Required capabilities: `code` response type, `authorization_code` + `refresh_token` grants, `query` + `fragment` response modes, `S256` PKCE

### Client Registration

Matrix.org's OAuth server requires these fields for registration:
- `client_name`: "Secludia"
- `client_uri`: "https://secludia.com" (**REQUIRED** - server returns 400 without it)
- `redirect_uris`: [redirect URI]
- `grant_types`: ["authorization_code", "refresh_token"]
- `response_types`: ["code"]
- `token_endpoint_auth_method`: "none" (public client)
- `application_type`: "native"

Registration happens fresh on each login (idempotent - server returns same or new client_id).

### Known Issues / TODO

⚠️ **Issues to investigate**:
1. Token refresh scheduling may need testing
2. Web popup flow needs testing (Tauri window flow tested)
3. Error handling for edge cases may need improvement

**Not yet implemented**:
- Soft logout handling (M_SOFT_LOGOUT)
- Account management link (using `account_management_uri` from metadata)

### OAuth Logout Behavior (Important Finding)

**The Problem**: After logout, users can re-login without entering their password ("Continue to Secludia" prompt).

**Investigation Results**:

1. **Matrix `/logout` endpoint does NOT work with OAuth tokens**:
   - Returns `401 M_UNKNOWN_TOKEN` even with valid tokens
   - `/whoami` works with the same token (returns 200)
   - Per Matrix spec: "With the OAuth 2.0 API, to invalidate the access token the client must use **token revocation**"
   - The `/logout` endpoint is for legacy API tokens only

2. **Token revocation works correctly**:
   - `POST https://account.matrix.org/oauth2/revoke` returns 200
   - Tokens are properly invalidated at the OAuth authorization server

3. **The "Continue" prompt is caused by SSO session persistence**:
   - The OAuth authorization server (account.matrix.org) maintains its own session via **browser cookies**
   - This session is **separate** from the OAuth tokens
   - Token revocation invalidates the tokens, but does NOT clear the browser SSO session
   - When re-authorizing, the auth server sees the existing session and auto-approves

4. **This is standard OAuth behavior**:
   - The authorization server's session (cookies) is independent of tokens it issues
   - Same behavior as "Sign in with Google" - logging out of an app doesn't log you out of Google

**Possible Solutions** (TODO):

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **Ephemeral browser context** | OAuth window uses private/incognito mode (no persistent cookies) | Each login requires full authentication | May not be supported on all platforms |
| **Open auth server logout** | After token revocation, open `{issuer}/logout` in browser | User can clear SSO session | Requires manual user action, disruptive UX |
| **Accept as-is** | Document that full logout requires signing out of identity provider | No code changes needed | Users may be confused |

**Current Implementation**:
- Token revocation at authorization server ✓
- Local state cleared ✓
- SSO session persists (browser cookies not cleared)

**Files Changed**:
- `StoredSession` type now includes `tokenEndpoint` and `revocationEndpoint` for reliable logout
- Logout uses stored endpoints (fallback to authMetadata state if missing)

### UserContext Integration

`UserContext.tsx` now syncs with `AuthContext`:
- When authenticated, fetches user profile from Matrix server
- Extracts displayName, avatarUrl (converted from mxc:// to http)
- Updates presence on Matrix server when changed
- Clears user when logged out

### Translations Added

Auth-related keys in `en.json` and `es.json`:
- `AUTH_STATUS_*` - Status messages during authentication
- `AUTH_ERROR_*` - Auth error messages (cancelled, timeout, unknown, etc.)
- `DISCOVERY_ERROR_*` - Homeserver discovery errors (7 keys)
- `OAUTH_ERROR_*` - OAuth flow errors (5 keys)

**Error Translation Pattern:**
- Lib code throws errors with translation keys: `throw new DiscoveryError("DISCOVERY_ERROR_HOMESERVER_FAILED", "wellknown")`
- UI layer translates via `t()`: `error={t((error?.message ?? "AUTH_ERROR_UNKNOWN") as TranslationKey)}`

**Planned: Typed Locale Keys**
Future improvement - use a `strings` constant for autocomplete and compile-time safety:
```typescript
// Instead of raw strings (can typo)
throw new DiscoveryError("DISCOVERY_ERROR_HOMESERVER_FAILED", "wellknown");
t("LOGIN_DISCLAIMER")

// Use constant (autocomplete + compile error if wrong)
throw new DiscoveryError(strings.DISCOVERY_ERROR_HOMESERVER_FAILED, "wellknown");
t(strings.LOGIN_DISCLAIMER)
```

### Testing the Auth Flow

1. Enter `matrix.org` as homeserver
2. Auth window opens with Matrix.org login
3. Complete login (or create account)
4. Window closes, app shows authenticated state
5. Restart app → session restored from Stronghold (Tauri only)
6. Logout → tokens revoked, session cleared

### Security Notes

- Never log tokens (even in dev)
- PKCE challenges are single-use, cryptographically random
- Tokens cleared from memory on logout
- Stronghold encrypted at rest with argon2 key derivation
- Web memory-only tokens = re-auth on refresh (secure default)
- State parameter validated to prevent CSRF
- OAuth window URL validation: only https:// allowed (http://localhost for dev)

### OAuth Error Codes

OAuth window errors use machine-readable codes (not localized strings) for reliable detection:

| Code | Source | Meaning | Behavior |
|------|--------|---------|----------|
| `OAUTH_CANCELLED` | Rust (`lib.rs`) / Web popup | User closed the OAuth window | Silently return to login screen |
| `OAUTH_TIMEOUT` | Rust (`lib.rs`) / Web popup | 5 minute timeout elapsed | Show "Authentication timed out" error |

**Implementation**:
- Rust side returns these exact strings as `Err(String)`
- Web popup throws `new Error("OAUTH_CANCELLED")` etc.
- `AuthContext.tsx` checks for exact match before calling `toAuthError()`
- Cancellation is not treated as an error - user is silently returned to login

---

## Well-Known Discovery and LiveKit

### Overview

Matrix homeserver discovery uses the `.well-known/matrix/client` endpoint to locate server configuration. We've extended our discovery to also capture OAuth and RTC (real-time communication) information from the well-known response.

### Well-Known Response Structure

Example from `matrix.org`:
```json
{
  "m.homeserver": {
    "base_url": "https://matrix-client.matrix.org"
  },
  "org.matrix.msc2965.authentication": {
    "issuer": "https://account.matrix.org/",
    "account": "https://account.matrix.org/"
  },
  "org.matrix.msc4143.rtc_foci": [
    {
      "type": "livekit",
      "livekit_service_url": "https://livekit-jwt.call.matrix.org"
    }
  ]
}
```

### Key Fields

| Field | MSC | Purpose |
|-------|-----|---------|
| `m.homeserver.base_url` | Core | Client-Server API base URL |
| `org.matrix.msc2965.authentication.issuer` | MSC2965 | OAuth 2.0 issuer for login |
| `org.matrix.msc2965.authentication.account` | MSC2965 | Account management URL |
| `org.matrix.msc4143.rtc_foci` | MSC4143 | RTC focus servers for calls |

### Account Management URL

The `account` field from MSC2965 provides the URL for managing the user's account (password change, email, sessions). This is now stored in the session and used by `AccountSection.tsx`:
- Stored in `StoredSession.accountManagementUrl`
- Passed to `UserProfile.accountManagementUrl`
- "Manage account" button opens this URL (disabled if not available)
- Fallback: Some auth servers provide `account_management_uri` in auth metadata instead

### LiveKit SFU for MatrixRTC

The `org.matrix.msc4143.rtc_foci` array contains RTC focus server configurations. For LiveKit:

**What is LiveKit?**
- LiveKit is a **Selective Forwarding Unit (SFU)** for WebRTC
- Used for group calls with 3+ participants (too many streams for P2P mesh)
- Element Call uses LiveKit for their hosted infrastructure

**How it works:**
1. Well-known discovery returns `rtc_foci` array
2. For calls, the client uses the `livekit_service_url` to get a JWT token
3. The JWT token authenticates the client to the LiveKit server
4. LiveKit handles media routing between participants

**JWT Service URL:**
- The `livekit_service_url` is NOT the LiveKit server itself
- It's a **JWT issuing service** that authenticates Matrix users
- Example: `https://livekit-jwt.call.matrix.org`
- The client posts room info to get a signed JWT
- The JWT is then used to connect to the actual LiveKit SFU

**Implementation Status:**
- ✅ RTC foci discovery (stored in `DiscoveryResult.rtcFoci`)
- ✅ Types defined (`RtcFocus` in `types.ts`)
- ⏳ Actual LiveKit integration (pending MatrixRTC implementation)

### Files

| File | Purpose |
|------|---------|
| `src/lib/matrix/types.ts` | `WellKnown`, `RtcFocus`, `DiscoveryResult` types |
| `src/lib/matrix/discovery.ts` | `fetchWellKnown()` extracts all fields |
| `src/context/AuthContext.tsx` | Stores `accountManagementUrl` in session |
| `src/context/UserContext.tsx` | Exposes `accountManagementUrl` in user profile |
| `src/components/organisms/SettingsModal/AccountSection.tsx` | Uses account management URL |

---

## Token Storage Security

### Current State (⚠️ Needs Fix Before Production)

The Stronghold password is currently **hardcoded** in `src-tauri/src/lib.rs`:
```rust
// CURRENT (insecure for production)
let salt = SaltString::encode_b64(b"secludia-stronghold").expect("Invalid salt");
```

This means all desktop installations share the same encryption key. If someone decompiles the app, they could decrypt any user's token vault.

**Web is already secure**: Tokens are memory-only (cleared on page refresh).

### Token Storage by Platform

| Platform | Token Storage | Key Storage | Persistence |
|----------|---------------|-------------|-------------|
| **Windows** | Stronghold | Credential Manager | ✅ Survives restart |
| **macOS** | Stronghold | Keychain | ✅ Survives restart |
| **Linux** | Stronghold | Secret Service | ✅ Survives restart |
| **Web** | Memory only | N/A | ❌ Re-login on refresh |

### Recommended Fix: OS Keychain

Use the `keyring` crate to store a random encryption key in the OS keychain:

**Add dependencies** (`Cargo.toml`):
```toml
keyring = "3"
base64 = "0.22"
rand = "0.8"
```

**Implementation** (`src/lib.rs`):
```rust
use keyring::Entry;
use base64::{Engine, engine::general_purpose::STANDARD as BASE64};

const KEYCHAIN_SERVICE: &str = "secludia";
const KEYCHAIN_KEY: &str = "vault-key";

/// Get or create a random encryption key stored in OS keychain
fn get_stronghold_key() -> Vec<u8> {
    let entry = match Entry::new(KEYCHAIN_SERVICE, KEYCHAIN_KEY) {
        Ok(e) => e,
        Err(e) => {
            warn!("Keychain unavailable: {}. Using fallback.", e);
            return derive_fallback_key();
        }
    };

    // Try to retrieve existing key
    match entry.get_password() {
        Ok(key_b64) => {
            if let Ok(key) = BASE64.decode(&key_b64) {
                return key;
            }
            warn!("Stored key invalid, regenerating");
        }
        Err(keyring::Error::NoEntry) => {
            // First run - generate new key
        }
        Err(e) => {
            warn!("Keychain read failed: {}. Using fallback.", e);
            return derive_fallback_key();
        }
    }

    // Generate and store new random key
    let key: [u8; 32] = rand::random();
    let key_b64 = BASE64.encode(&key);

    if let Err(e) = entry.set_password(&key_b64) {
        warn!("Failed to store key in keychain: {}. Using fallback.", e);
        return derive_fallback_key();
    }

    info!("Generated new Stronghold key");
    key.to_vec()
}

/// Fallback for systems without keychain (e.g., Linux without Secret Service)
fn derive_fallback_key() -> Vec<u8> {
    use argon2::{Argon2, password_hash::SaltString, PasswordHasher};

    let machine_id = dirs::data_local_dir()
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|| "secludia-fallback".to_string());

    let salt = SaltString::encode_b64(b"secludia-fallback-salt")
        .expect("Invalid salt");

    Argon2::default()
        .hash_password(machine_id.as_bytes(), &salt)
        .expect("Hash failed")
        .hash
        .expect("No hash output")
        .as_bytes()
        .to_vec()
}
```

**Update Stronghold plugin**:
```rust
.plugin(tauri_plugin_stronghold::Builder::new(|_password| {
    get_stronghold_key()
}).build())
```

### Security Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  DESKTOP (Tauri)                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │ Random Key   │───▶│ OS Keychain  │───▶│  Stronghold  │     │
│  │ (32 bytes)   │    │ (encrypted)  │    │  (encrypted) │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│                                                                │
│  Fallback (no keychain): Device-derived key via Argon2        │
├────────────────────────────────────────────────────────────────┤
│  WEB (Browser)                                                 │
│  ┌──────────────┐                                              │
│  │ Memory only  │  ← Cleared on refresh (secure default)      │
│  └──────────────┘                                              │
└────────────────────────────────────────────────────────────────┘
```

### Linux Note

The `keyring` crate requires a secret service on Linux:
- **GNOME**: gnome-keyring (usually pre-installed)
- **KDE**: kwallet
- **Other**: KeePassXC with Secret Service integration

If no secret service is available, the fallback device-derived key is used (less secure but functional).

---

## Why Custom OAuth Instead of SDK OIDC

### Overview

The `matrix-js-sdk` includes an OIDC module (`node_modules/matrix-js-sdk/lib/oidc/`) with functions like `generateOidcAuthorizationUrl()`, `completeAuthorizationCodeGrant()`, `registerOidcClient()`, and `OidcTokenRefresher`. However, Secludia uses a **custom OAuth implementation** in `src/lib/matrix/`.

### Why Not Use SDK OIDC?

The SDK's OIDC module is designed for **Element Web** (browser-based) and doesn't fit Tauri's needs:

| Aspect | SDK OIDC | Secludia Requirement |
|--------|----------|---------------------|
| **State storage** | `window.sessionStorage` | Stronghold (secure enclave) |
| **OAuth callback** | `window.location.origin` URL parsing | Tauri navigation interception |
| **Response mode** | Hardcoded `"query"` | `"query"` for localhost, `"fragment"` for HTTPS |
| **Scopes** | MSC2967 (`urn:matrix:org.matrix.msc2967.client:*`) | Stable spec (`urn:matrix:client:*`) |
| **Dependencies** | `oidc-client-ts` (browser-specific) | Native fetch + crypto |
| **Platform** | Browser only | Tauri + Web hybrid |

### Specific SDK Limitations

1. **`generateOidcAuthorizationUrl()`** uses `WebStorageStateStore` with `window.sessionStorage` and `oidc-client-ts` internally. Tauri needs to intercept navigation in a webview, not parse URLs.

2. **`completeAuthorizationCodeGrant()`** uses `window.location.origin` and `SigninResponse` from `oidc-client-ts`. This assumes the OAuth callback is a real page load, not navigation interception.

3. **`OidcTokenRefresher`** stores state in `window.sessionStorage` and requires `idTokenClaims` that we don't need (Matrix uses opaque access tokens).

4. **Scope mismatch**: SDK uses MSC2967 scopes (`urn:matrix:org.matrix.msc2967.client:api:*`), but Matrix stable spec uses `urn:matrix:client:api:*`.

### What We DO Use from SDK

| Component | Usage |
|-----------|-------|
| `AutoDiscovery.findClientConfig()` | Well-known lookup and version validation |
| `MatrixClient` | All Matrix operations (sync, rooms, messages, etc.) |

### What Remains Custom (Tauri-specific)

| File | Purpose | Why Custom |
|------|---------|------------|
| `oauth.ts` | PKCE, auth URL, token exchange | Support both Tauri webview and web popup |
| `token-manager.ts` | Token storage | Stronghold (not sessionStorage) |
| `refresh-manager.ts` | Token refresh | Integration with Stronghold, proactive scheduling |
| `authenticated-fetch.ts` | M_UNKNOWN_TOKEN handling | Custom retry logic with refresh |
| `client-registration.ts` | Dynamic client registration | Caching per issuer |
| `discovery.ts` | Auth metadata fetch | Stable endpoint (not in SDK yet) |

### Decision Summary

The SDK's OIDC module would require significant workarounds to support Tauri's requirements. A clean custom implementation provides:
- Full control over storage (Stronghold vs sessionStorage)
- Support for both platform OAuth flows (webview interception vs popup)
- Stable Matrix scopes instead of MSC prefixes
- No `oidc-client-ts` dependency (reduces bundle size and complexity)

This is **not reinventing the wheel** - it's adapting to Tauri's unique security model where tokens must be stored in a secure enclave, not browser storage.

---

## Matrix Encryption (E2EE)

### Overview

Matrix uses two cryptographic ratchets for end-to-end encryption:

| Ratchet | Purpose | Use Case |
|---------|---------|----------|
| **Olm** | 1:1 device-to-device encryption | Sharing Megolm keys, to-device messages |
| **Megolm** | Room/group encryption | Encrypted room messages (many recipients) |

### Olm (Double Ratchet)

Based on Signal's Double Ratchet algorithm. Used for secure 1:1 communication between devices.

**Cryptographic Primitives:**
- **Curve25519** for initial key agreement (ECDH)
- **Triple DH** for shared secret: `ECDH(I_A, E_B) ∥ ECDH(E_A, I_B) ∥ ECDH(E_A, E_B)`
- **HKDF-SHA-256** for root/chain key derivation
- **HMAC-SHA-256** for chain key advancement
- **AES-256-CBC** + **HMAC-SHA-256** (8 bytes) for authenticated encryption

**Key Properties:**
- Each message uses a unique message key (forward secrecy)
- Root key → Chain key → Message key derivation
- Can't decrypt past messages if keys compromised
- Pre-key messages include identity keys for session establishment

### Megolm (Group Ratchet)

Designed for encrypted rooms with many recipients. Each sender has their own outbound Megolm session per room.

**Architecture:**
- **4-part ratchet** (R[i,0], R[i,1], R[i,2], R[i,3]) - 256 bits each
- Efficient fast-forward: max **1020 hash operations** to advance any amount
- **Ed25519 signatures** for message authenticity
- Session keys shared via Olm (peer-to-peer encrypted)

**Key Properties:**
- **Partial forward secrecy**: recipients can decrypt from their earliest known ratchet position
- Sessions should be rotated periodically (configurable via `rotation_period_ms` and `rotation_period_msgs`)
- No backward secrecy: if key compromised, attacker can decrypt future messages in that session

### Key Types

| Key | Algorithm | Purpose |
|-----|-----------|---------|
| **Device signing key** | Ed25519 | Sign device keys, verify messages |
| **Device identity key** | Curve25519 | Olm session establishment |
| **One-time keys** | signed_curve25519 | Single-use for new Olm sessions |
| **Fallback keys** | signed_curve25519 | Used when one-time keys exhausted (not deleted after use) |
| **Master signing key (MSK)** | Ed25519 | User's root cross-signing identity |
| **User-signing key (USK)** | Ed25519 | Signs other users' MSKs (private to user) |
| **Self-signing key (SSK)** | Ed25519 | Signs own device keys |

### Cross-Signing Trust Model

```
Alice MSK ──────────────────────────────────────────── Bob MSK
    │                                                      │
    ├─► Alice SSK ─► Alice's Devices                       ├─► Bob SSK ─► Bob's Devices
    │                                                      │
    └─► Alice USK ─► Bob MSK (Alice trusts Bob)            └─► Bob USK ─► Alice MSK
```

- MSK is the root of trust for a user
- SSK signs the user's own devices
- USK signs other users' MSKs (creates trust relationships)
- Only the user can see their own USK signatures

### Device Verification Methods

**1. SAS (Short Authentication String)**
- Compare **7 emoji** or **3 decimal numbers** (1000-9191)
- Based on ZRTP key agreement with hash commitment
- One attempt for attacker: 1 in 2^40 chance with 40-bit verification

**2. QR Code Verification**
- Quick scan-based verification
- QR encodes: version, mode, keys, shared secret
- Modes: verifying another user (0x00), self-verify trusting MSK (0x01), self-verify not trusting MSK (0x02)

**SAS Emoji Table (64 emoji, 6 bits each → 7 shown):**

| # | Emoji | Name | # | Emoji | Name | # | Emoji | Name | # | Emoji | Name |
|---|-------|------|---|-------|------|---|-------|------|---|-------|------|
| 0 | 🐶 | Dog | 16 | 🌳 | Tree | 32 | 🎩 | Hat | 48 | 🔨 | Hammer |
| 1 | 🐱 | Cat | 17 | 🌵 | Cactus | 33 | 👓 | Glasses | 49 | ☎️ | Telephone |
| 2 | 🦁 | Lion | 18 | 🍄 | Mushroom | 34 | 🔧 | Spanner | 50 | 🏁 | Flag |
| 3 | 🐎 | Horse | 19 | 🌏 | Globe | 35 | 🎅 | Santa | 51 | 🚂 | Train |
| 4 | 🦄 | Unicorn | 20 | 🌙 | Moon | 36 | 👍 | Thumbs Up | 52 | 🚲 | Bicycle |
| 5 | 🐷 | Pig | 21 | ☁️ | Cloud | 37 | ☂️ | Umbrella | 53 | ✈️ | Aeroplane |
| 6 | 🐘 | Elephant | 22 | 🔥 | Fire | 38 | ⌛ | Hourglass | 54 | 🚀 | Rocket |
| 7 | 🐰 | Rabbit | 23 | 🍌 | Banana | 39 | ⏰ | Clock | 55 | 🏆 | Trophy |
| 8 | 🐼 | Panda | 24 | 🍎 | Apple | 40 | 🎁 | Gift | 56 | ⚽ | Ball |
| 9 | 🐓 | Rooster | 25 | 🍓 | Strawberry | 41 | 💡 | Light Bulb | 57 | 🎸 | Guitar |
| 10 | 🐧 | Penguin | 26 | 🌽 | Corn | 42 | 📕 | Book | 58 | 🎺 | Trumpet |
| 11 | 🐢 | Turtle | 27 | 🍕 | Pizza | 43 | ✏️ | Pencil | 59 | 🔔 | Bell |
| 12 | 🐟 | Fish | 28 | 🎂 | Cake | 44 | 📎 | Paperclip | 60 | ⚓ | Anchor |
| 13 | 🐙 | Octopus | 29 | ❤️ | Heart | 45 | ✂️ | Scissors | 61 | 🎧 | Headphones |
| 14 | 🦋 | Butterfly | 30 | 😀 | Smiley | 46 | 🔒 | Lock | 62 | 📁 | Folder |
| 15 | 🌷 | Flower | 31 | 🤖 | Robot | 47 | 🔑 | Key | 63 | 📌 | Pin |

**SDK returns:** `sas.emoji` as `[emoji, description][]` (7 tuples), `sas.decimal` as `number[]` (3 numbers 1000-9191)

### Encrypted Attachments

Files in encrypted rooms use:
- **AES-256-CTR** with random 128-bit IV (bit 63 set to 0)
- **SHA-256** hash of ciphertext for integrity
- Key in **JSON Web Key** format in event content

```typescript
interface EncryptedFile {
  url: string;           // mxc:// URL
  key: JWK;              // { kty: "oct", alg: "A256CTR", k: "base64url-key", ... }
  iv: string;            // base64 IV
  hashes: { sha256: string };
  v: "v2";
}
```

### Secret Storage (SSSS/4S)

Secure Secret Storage and Sharing for storing secrets on server:
- Encrypted with `m.secret_storage.v1.aes-hmac-sha2`
- Can derive key from passphrase (PBKDF2-SHA512, min 100k iterations)
- Stores: cross-signing private keys, key backup decryption key

### Key Events

| Event Type | Purpose |
|------------|---------|
| `m.room.encryption` | Enables E2EE in room (state event) |
| `m.room.encrypted` | Encrypted message wrapper |
| `m.room_key` | Share Megolm session via Olm |
| `m.forwarded_room_key` | Forward keys between devices |
| `m.room_key_request` | Request keys from other devices |
| `m.room_key.withheld` | Indicate keys intentionally not shared |
| `m.secret.request` / `m.secret.send` | Secret sharing between devices |

### matrix-js-sdk CryptoApi

The SDK handles E2EE via `@matrix-org/matrix-sdk-crypto-wasm`, which provides WebAssembly bindings for the Rust `matrix-sdk-crypto` library.

**Architecture:**
- **OlmMachine** - Core E2EE state machine (no network IO, pure state machine)
- **IndexedDB** - Persistent storage for keys, sessions, device lists
- **Rust → WASM** - Proven Rust crypto compiled to WebAssembly

**Initialization:**
```typescript
// matrix-js-sdk handles initAsync() internally
await matrixClient.initRustCrypto();
const crypto = matrixClient.getCrypto();
```

**⚠️ Thread Safety:** Only one MatrixClient per IndexedDB - multiple instances cause data corruption. This is because the underlying OlmMachine maintains state that must be consistent.

#### Bootstrap Methods

| Method | Purpose |
|--------|---------|
| `bootstrapCrossSigning(opts)` | Create cross-signing keys if needed |
| `bootstrapSecretStorage(opts)` | Set up secret storage with encryption key |
| `checkKeyBackupAndEnable()` | Enable server-side key backup |

#### Verification Methods

| Method | Purpose |
|--------|---------|
| `requestOwnUserVerification()` | Verify with your other devices |
| `requestDeviceVerification(userId, deviceId)` | Verify specific device |
| `requestVerificationDM(userId, roomId)` | Verify via DM in room |

#### Key Enums

**VerificationPhase** - Request lifecycle:
| Value | Description |
|-------|-------------|
| `Unsent` (1) | Initial state, no event exchanged |
| `Requested` (2) | `m.key.verification.request` sent/received |
| `Ready` (3) | `m.key.verification.ready` exchanged, request accepted |
| `Started` (4) | Verification in flight |
| `Cancelled` (5) | Cancelled by either party |
| `Done` (6) | Verification complete |

**VerifierEvent** - Events during verification:
| Event | Payload | Description |
|-------|---------|-------------|
| `ShowSas` | `ShowSasCallbacks` | SAS data ready to display (emoji/decimal) |
| `ShowReciprocateQr` | `ShowQrCodeCallbacks` | Confirm other side scanned our QR |
| `Cancel` | `Error` | Verification cancelled |

**CryptoEvent** - Global crypto events (on MatrixClient):
| Event | Description |
|-------|-------------|
| `VerificationRequestReceived` | Incoming verification request |
| `UserTrustStatusChanged` | User's trust status changed |
| `KeyBackupStatus` | Key backup status changed |
| `KeyBackupFailed` | Backup failed |
| `KeysChanged` | Cross-signing keys changed |
| `DevicesUpdated` | User's device list updated |

#### VerificationRequest Interface

```typescript
const request = await crypto.requestOwnUserVerification();

// Properties
request.phase          // VerificationPhase (Unsent, Requested, Ready, Started, Done, Cancelled)
request.methods        // string[] - common methods (e.g., ["m.sas.v1", "m.qr_code.show.v1"])
request.otherUserId    // User being verified
request.isSelfVerification // true if verifying own device

// Listen for state changes
request.on(VerificationRequestEvent.Change, () => {
  console.log("Phase changed to:", request.phase);
});

// Accept incoming request
await request.accept();

// Generate QR code (only works at Ready phase)
const qrData: Uint8ClampedArray | undefined = await request.generateQRCode();

// Scan QR code
const verifier = await request.scanQRCode(scannedData);

// Start SAS verification
const verifier = await request.startVerification("m.sas.v1");
```

#### Verifier Interface (SAS Flow)

```typescript
import { VerifierEvent } from "matrix-js-sdk/lib/crypto-api";

// Start verification
await verifier.verify();

// Listen for SAS display
verifier.on(VerifierEvent.ShowSas, (sas: ShowSasCallbacks) => {
  // sas.sas.emoji = [["🐶", "Dog"], ["🐱", "Cat"], ...] (7 emoji tuples)
  // sas.sas.decimal = [1234, 5678, 9012] (3 numbers 1000-9191)

  // User confirms match
  await sas.confirm();

  // Or user says mismatch
  sas.mismatch();
});

// QR code reciprocation (after other party scans our QR)
verifier.on(VerifierEvent.ShowReciprocateQr, (callbacks: ShowQrCodeCallbacks) => {
  // User confirms they see the same thing on both devices
  await callbacks.confirm();
});

// Handle cancellation
verifier.on(VerifierEvent.Cancel, (error: Error) => {
  console.error("Verification cancelled:", error.message);
});
```

#### Listening for Incoming Verification Requests

```typescript
import { CryptoEvent } from "matrix-js-sdk/lib/crypto-api";

matrixClient.on(CryptoEvent.VerificationRequestReceived, (request: VerificationRequest) => {
  // Show UI to accept/reject
  if (request.isSelfVerification) {
    // Another of our devices wants to verify
  } else {
    // Another user wants to verify
  }
});
```

#### Device & User Verification Status

```typescript
// Get device verification status
const status = await crypto.getDeviceVerificationStatus(userId, deviceId);
// status.locallyVerified, status.crossSigningVerified, status.tofu

// Get user verification status
const userStatus = await crypto.getUserVerificationStatus(userId);
// userStatus.isCrossSigningVerified(), userStatus.wasCrossSigningVerified()

// Get all devices for users (batch query)
const deviceMap = await crypto.getUserDeviceInfo([userId1, userId2]);
```

#### Key Backup

```typescript
// Check and enable backup
const backupCheck: KeyBackupCheck | null = await crypto.checkKeyBackupAndEnable();

// Get backup info from server
const backupInfo: KeyBackupInfo | null = await crypto.getKeyBackupInfo();
// backupInfo.version, backupInfo.algorithm, backupInfo.count, backupInfo.etag

// Check if backup is trusted
const trustInfo: BackupTrustInfo = await crypto.isKeyBackupTrusted(backupInfo);
// trustInfo.trusted - signed by trusted device
// trustInfo.matchesDecryptionKey - matches our stored key

// Get active backup version
const version: string | null = await crypto.getActiveSessionBackupVersion();

// Restore from backup
const result: KeyBackupRestoreResult = await crypto.restoreKeyBackup();
// result.imported - keys imported, result.total - total keys in backup

// Create new backup
await crypto.resetKeyBackup();

// Delete backup version
await crypto.deleteKeyBackupVersion(version);
```

#### Room Key Management

```typescript
// Export all room keys (for manual backup)
const keys: IMegolmSessionData[] = await crypto.exportRoomKeys();
const keysJson: string = await crypto.exportRoomKeysAsJson();

// Import room keys
await crypto.importRoomKeys(keys, { progressCallback: (progress) => {...} });

// Check if room is encrypted
const encrypted = await crypto.isEncryptionEnabledInRoom(roomId);

// Force new Megolm session (after verified user joins, etc.)
await crypto.forceDiscardSession(roomId);
```

#### Cross-Signing Status

```typescript
const status: CrossSigningStatus = await crypto.getCrossSigningStatus();

// status.publicKeysOnDevice - MSK, SSK, USK public keys available locally
// status.privateKeysInSecretStorage - private keys in SSSS
// status.privateKeysCachedLocally.masterKey - MSK private key cached
// status.privateKeysCachedLocally.selfSigningKey - SSK cached
// status.privateKeysCachedLocally.userSigningKey - USK cached

const ready: boolean = await crypto.isCrossSigningReady();
const hasKeys: boolean = await crypto.userHasCrossSigningKeys(userId);
```

#### Secret Storage Status

```typescript
const status: SecretStorageStatus = await crypto.getSecretStorageStatus();

// status.ready - secret storage is set up and usable
// status.defaultKeyId - current default key ID
// status.secretStorageKeyValidityMap - which secrets are properly stored
```

#### Device Verification Status Classes

```typescript
// For a specific device
const deviceStatus: DeviceVerificationStatus = await crypto.getDeviceVerificationStatus(userId, deviceId);
deviceStatus.isVerified()           // Should this device be considered verified?
deviceStatus.crossSigningVerified   // Verified via cross-signing
deviceStatus.localVerified          // Manually marked as verified
deviceStatus.signedByOwner          // Signed by owner's SSK

// For a user
const userStatus: UserVerificationStatus = await crypto.getUserVerificationStatus(userId);
userStatus.isVerified()              // Verified via any means
userStatus.isCrossSigningVerified()  // Verified via cross-signing
userStatus.wasCrossSigningVerified() // Was ever verified before
userStatus.needsUserApproval         // Identity changed, needs re-verification
```

#### Event Encryption Info (Message Shields)

```typescript
const info: EventEncryptionInfo | null = await crypto.getEncryptionInfoForEvent(event);

// info.shieldColour: EventShieldColour
//   NONE (0) - No shield needed
//   GREY (1) - Informational warning
//   RED (2)  - Security warning

// info.shieldReason: EventShieldReason
//   UNVERIFIED_IDENTITY (1) - Encrypted by unverified user
//   UNSIGNED_DEVICE (2) - Device not verified by owner
//   UNKNOWN_DEVICE (3) - Unknown or deleted device
//   AUTHENTICITY_NOT_GUARANTEED (4) - Keys forwarded/from backup
//   VERIFICATION_VIOLATION (7) - Sender was verified, now isn't
//   MISMATCHED_SENDER (8) - Sender doesn't match session owner
```

#### Decryption Failure Codes

When decryption fails, `MatrixEvent.decryptionFailureReason` returns:
| Code | Description |
|------|-------------|
| `MEGOLM_UNKNOWN_INBOUND_SESSION_ID` | Keys not shared with us |
| `MEGOLM_KEY_WITHHELD` | Sender is withholding key |
| `MEGOLM_KEY_WITHHELD_FOR_UNVERIFIED_DEVICE` | Our device is unverified |
| `OLM_UNKNOWN_MESSAGE_INDEX` | Session shared at later ratchet state |
| `HISTORICAL_MESSAGE_NO_KEY_BACKUP` | Old message, no backup exists |
| `HISTORICAL_MESSAGE_BACKUP_UNCONFIGURED` | Backup exists but not accessible |
| `HISTORICAL_MESSAGE_WORKING_BACKUP` | Has backup, still can't decrypt |
| `UNSIGNED_SENDER_DEVICE` | Sender device not cross-signed |
| `UNKNOWN_SENDER_DEVICE` | Can't link to known device |

#### Device Isolation Modes

```typescript
import { AllDevicesIsolationMode, OnlySignedDevicesIsolationMode } from "matrix-js-sdk/lib/crypto-api";

// Default: share keys with all devices (show warnings for unverified)
crypto.setDeviceIsolationMode(new AllDevicesIsolationMode(false));

// Strict: error if verified user has problems
crypto.setDeviceIsolationMode(new AllDevicesIsolationMode(true));

// Paranoid: only share with cross-signed devices
crypto.setDeviceIsolationMode(new OnlySignedDevicesIsolationMode());
```

#### CryptoCallbacks (for Secret Storage UI)

```typescript
const cryptoCallbacks: CryptoCallbacks = {
  // Called when creating new secret storage - cache the key for later
  cacheSecretStorageKey: (keyId, keyInfo, key) => {
    // Store key temporarily for getSecretStorageKey
  },

  // Called when SDK needs to decrypt secrets
  getSecretStorageKey: async ({ keys }, name) => {
    // Show UI to get recovery key/passphrase from user
    // Return [keyId, privateKey] or null
    const keyId = Object.keys(keys)[0];
    const privateKey = await promptUserForRecoveryKey();
    return [keyId, privateKey];
  },
};

// Pass to createClient
const client = createClient({
  ...options,
  cryptoCallbacks,
});
```

#### Recovery Key Functions

```typescript
import {
  encodeRecoveryKey,
  decodeRecoveryKey,
  deriveRecoveryKeyFromPassphrase
} from "matrix-js-sdk/lib/crypto-api";

// Encode raw key for display (e.g., "EssT JUUL m9by...")
const encoded: string = encodeRecoveryKey(privateKey);

// Decode user-entered recovery key
const decoded: Uint8Array = decodeRecoveryKey(userInput);

// Derive key from passphrase (PBKDF2)
const key: Uint8Array = await deriveRecoveryKeyFromPassphrase(
  passphrase,
  salt,
  iterations,  // min 100,000
  256          // bits
);
```

### UI Components for Verification

**SAS Emoji Verification:**
- Display 7 emoji with descriptions (from `GeneratedSas.emoji`)
- User compares with other device and confirms/denies match
- Use HeroUI `Modal`, `Button`, emoji grid

**QR Code Verification (using HeroUI Disclosure):**
```tsx
// Generate QR from Uint8ClampedArray
const qrData = await request.generateQRCode();
const qrDataUrl = generateQRCodeImage(qrData); // Use qrcode library

<Disclosure isExpanded={showQR} onExpandedChange={setShowQR}>
  <Disclosure.Heading>
    <Button slot="trigger" variant="secondary">
      <QrCode />
      Show QR Code
      <Disclosure.Indicator />
    </Button>
  </Disclosure.Heading>
  <Disclosure.Content>
    <Disclosure.Body className="...">
      <p>Scan this code with your other device</p>
      <img src={qrDataUrl} alt="Verification QR Code" />
    </Disclosure.Body>
  </Disclosure.Content>
</Disclosure>
```

### Current Implementation Status

**Overall E2EE Readiness: ❌ NOT READY** (Foundation partially complete)

#### What's Working ✅

| Component | Location | Status |
|-----------|----------|--------|
| Real Matrix OAuth 2.0 login | `AuthContext.tsx` | ✅ Complete with PKCE |
| Device ID preservation | `AuthContext.tsx:395,466` | ✅ Persists across sessions |
| Device list query | `lib/matrix/devices/` | ✅ `getUserDeviceInfo()` works |
| Device verification status (read-only) | `devices.ts:46-61` | ✅ Graceful fallback if no crypto |
| Tauri Stronghold for tokens | `platforms/tauri/storage.ts` | ✅ Encrypted at rest (argon2) |
| Domain-based folder structure | `lib/matrix/` | ✅ Well-organized |

#### Critical Blockers ❌

| Blocker | Location | Issue |
|---------|----------|-------|
| ~~No `initRustCrypto()` call~~ | ~~`client.ts`~~ | ✅ Now called via `initializeClientCrypto()` in CryptoContext |
| ~~No crypto storage~~ | ~~Missing~~ | ✅ IndexedDB storage via rust-crypto WASM |
| ~~`startClient()` never invoked~~ | ~~Context layer~~ | ✅ Now called by CryptoContext with two-phase sync |
| **Web platform memory-only** | `platforms/web/storage.ts` | Keys lost on page refresh |
| ~~No CryptoContext~~ | ~~Missing~~ | ✅ `CryptoContext.tsx` with full status management |
| ~~No cryptoCallbacks~~ | ~~`client.ts`~~ | ✅ Default callbacks via `getDefaultCryptoCallbacks()` with `setPendingSecretStorageKey()` mechanism |

#### Current client.ts (Crypto Integrated)

```typescript
// Client creation with default crypto callbacks (getSecretStorageKey wired)
export function createMatrixClient(options: CreateMatrixClientOptions): MatrixClient {
  const { session, tokenRefreshFunction, refreshToken, cryptoCallbacks } = options;
  const opts: ICreateClientOpts = {
    baseUrl: session.homeserverUrl,
    accessToken: session.accessToken,
    userId: session.userId,
    deviceId: session.deviceId,
    useAuthorizationHeader: true,
    tokenRefreshFunction,
    refreshToken,
    cryptoCallbacks: cryptoCallbacks ?? getDefaultCryptoCallbacks(), // ✅ Default uses pending key mechanism
  };
  return createClient(opts);
}

// Two-phase sync support
export async function startMatrixClient(opts?: IStartClientOpts): Promise<void> { ... }
// restartMatrixClient stops only sync loop (NOT crypto) to preserve WASM OlmMachine
export async function restartMatrixClient(opts?: IStartClientOpts): Promise<void> { ... }
// Restart sync and wait for Prepared/Syncing (used after on-demand crypto init)
export function restartMatrixClientAndWaitForSync(opts?: IStartClientOpts): Promise<void> { ... }
export function createMinimalSyncFilter(userId: string): Filter { ... }
// ✅ Crypto initialized on demand via ensureCrypto() in CryptoContext action handlers
```

#### Crypto Callbacks (Pending Key Mechanism)

Recovery key verification requires the SDK's `getSecretStorageKey` callback to provide the user's key.
Since the client is created in AuthContext (before CryptoContext), we use a module-level pending key:

```typescript
// In callbacks.ts:
setPendingSecretStorageKey(decodedKey);  // Set before bootstrapSecretStorage
await crypto.bootstrapSecretStorage({}); // SDK calls getSecretStorageKey → returns pending key
setPendingSecretStorageKey(null);        // Clear in finally block
```

**Key insight**: `createSecretStorageKey` is for generating NEW keys. `getSecretStorageKey` is for accessing EXISTING secret storage. Verification must use the latter.

**Deferred crypto architecture**: Crypto (WASM + IndexedDB) is never initialized until the user takes action:
- `checkCrossSigningStatus()` uses `downloadKeysForUsers()` (pure HTTP) to check cross-signing state without crypto init
- `validateRecoveryKey()` uses `client.secretStorage.checkKey()` (pure Web Crypto: HKDF + AES-CTR + HMAC) to validate keys without crypto init
- Only after a correct key is validated does `ensureCrypto()` init the Rust crypto backend
- After crypto init, sync is restarted with crypto active → OlmMachine processes `/keys/query` → `waitForCrossSigningKeys()` waits for public identity → then `verifyWithRecoveryKey()` runs

### Required Implementation Steps

**Phase 0: Crypto Foundation** ✅ COMPLETE

1. **`src/lib/matrix/crypto/`** ✅ Created
   - `types.ts` - Canonical source for `CryptoError` and `BootstrapResult` interfaces (shared between lib and context layers, breaks circular dependency)
   - `init.ts` - `initializeClientCrypto()` wrapper with error handling
   - `callbacks.ts` - `getDefaultCryptoCallbacks()`, `setPendingSecretStorageKey()`, `decodeUserRecoveryKey()` (base58 case-sensitive)
   - `bootstrap.ts` - `checkCrossSigningStatus()` (HTTP-only, no crypto needed), `validateRecoveryKey()` (pure Web Crypto MAC check), `verifyWithRecoveryKey()`
   - `storage.ts` - `clearCryptoDatabase()` deletes both `secludia-crypto::matrix-sdk-crypto` and `secludia-crypto::matrix-sdk-crypto-meta`
   - `index.ts` - Barrel exports

2. **`client.ts` updated** ✅
   - `cryptoCallbacks` accepted in `CreateMatrixClientOptions`
   - `startMatrixClient(opts?)` accepts `IStartClientOpts` for sync filter override
   - `restartMatrixClient(opts?)` stops and restarts with new sync options (preserves crypto)
   - `restartMatrixClientAndWaitForSync(opts?)` restarts sync and resolves on Prepared/Syncing
   - `createMinimalSyncFilter(userId)` for pre-verification minimal sync

3. **`CryptoContext.tsx` created** ✅
   - Full status management: idle → checking_status → needs_setup/needs_verification/ready
   - Deferred crypto: HTTP-only `checkCrossSigningStatus()` determines path without WASM/IndexedDB init
   - On-demand crypto init: only when user bootstraps or enters correct recovery key
   - Wrong keys validated via `validateRecoveryKey()` (pure Web Crypto) — no IndexedDB created
   - On correct key: init crypto → restart sync with crypto → `waitForCrossSigningKeys()` → verify
   - Two-phase sync: minimal filter (phase 1) → full sync (phase 2 on `ready`)
   - Bootstrap, verification, reset identity, skip verification flows

4. **`startClient()` invoked** ✅
   - Called by CryptoContext with minimal sync filter (pre-verification)
   - Upgraded to full sync via `restartMatrixClient()` when status becomes `ready`

5. **Web platform IndexedDB** ⏳ Partial
   - Crypto keys stored in IndexedDB via rust-crypto WASM
   - Token storage still memory-only on web (re-auth on refresh)

### Feature Implementation Status

| Feature | Status | SDK Method | Blocker |
|---------|--------|------------|---------|
| E2EE rooms | ⏳ Pending | `initRustCrypto()` | Crypto initialized, needs room sync integration |
| Device list | ✅ Done | `getUserDeviceInfo()` | - |
| Device verification status | ✅ Done | `getDeviceVerificationStatus()` | Read-only, graceful fallback |
| Cross-signing bootstrap | ✅ Done | `bootstrapCrossSigning()` | CryptoContext handles setup flow |
| Secret storage setup | ✅ Done | `bootstrapSecretStorage()` | CryptoCallbacks wired, recovery key UI complete |
| Device verification (SAS) | ❌ Blocked | `startVerification()` | UI not implemented |
| Device verification (QR) | ❌ Blocked | `generateQRCode()` | UI not implemented |
| Key backup setup | ⏳ Partial | `resetKeyBackup()` | Created during bootstrap, restore not wired |
| Key backup restore | ❌ Blocked | `restoreKeyBackup()` | UI not implemented |
| Encryption indicator | ✅ Done | `isEncryptionEnabledInRoom()` | - |
| Message shields | ❌ Blocked | `getEncryptionInfoForEvent()` | Needs room message UI |
| Incoming verification | ❌ Blocked | `CryptoEvent.VerificationRequestReceived` | UI not implemented |

### Implementation Priority

**Phase 0: Crypto Foundation** ✅ COMPLETE
- ✅ IndexedDB storage via rust-crypto WASM
- ✅ `initRustCrypto()` integration (`initializeClientCrypto()`)
- ✅ `CryptoContext` provider with status management
- ✅ `startClient()` invocation with two-phase sync (minimal → full)
- ✅ `CryptoCallbacks` for secret storage key management

**Phase 1: Cross-signing & Secret Storage Bootstrap** ✅ COMPLETE
- ✅ `bootstrapCrossSigning()` + `bootstrapSecretStorage()` in CryptoContext
- ✅ UI: Recovery key display with copy button
- ✅ SecuritySetupGate, SetupSecurityScreen, VerifyDeviceScreen
- ✅ Recovery key verification flow
- ✅ Identity reset (destructive) with UIA approval flow (m.oauth polling)
- ✅ Skip verification option
- ✅ Cancel reset (AbortController for instant cancellation)

**Phase 2: Device Verification (SAS)** ⬅️ NEXT
- `requestOwnUserVerification()` → `VerifierEvent.ShowSas`
- UI: Modal with 7 emoji grid, confirm/deny buttons

**Phase 3: Key Backup**
- `checkKeyBackupAndEnable()` + `restoreKeyBackup()`
- UI: Recovery key input, progress indicator

**Phase 4: Message Shields**
- `getEncryptionInfoForEvent()` → `EventShieldColour`
- UI: Grey/red shield icons on messages

---

## Element Web Comparison (Storage & Crypto)

### How Element Web Manages Storage

**Before login:**
- IndexedDB: `logs` (app logging), `matrix-react-sdk` (account table, pickleKey table)
- localStorage: `mx_local_settings`, PostHog analytics, session lock keys

**After login (at verification prompt — crypto already initialized):**
- IndexedDB adds:
  - `matrix-js-sdk::matrix-sdk-crypto` — full Rust crypto state (backup_keys, devices, identities, inbound/outbound sessions, etc.)
  - `matrix-js-sdk::matrix-sdk-crypto-meta` — crypto metadata
  - `matrix-js-sdk:riot-web-sync` — persistent sync store (accountData, client_options, sync, to_device_queue, users)
- localStorage adds `mx_*` keys:
  - `mx_has_access_token = true` / `mx_has_refresh_token = true` (boolean flags, not actual tokens)
  - `mx_has_pickle_key = true` (pickle key encrypts tokens in IndexedDB)
  - `mx_device_id`, `mx_user_id`, `mx_hs_url`, `mx_crypto_initialised`
  - `mx_oidc_client_id`, `mx_oidc_id_token` (full JWT in plaintext!), `mx_oidc_token_issuer`
  - `mx_profile_avatar_url`, `mx_profile_displayname`
  - `mx_decryption_failure_event_ids` — bloom filter for tracking decryption failures
  - `mxjssdk_memory_filter_FILTER_SYNC_*` — sync filter ID cache

### Secludia vs Element Comparison

| Concern | Element Web | Secludia |
|---------|-------------|----------|
| **Crypto init timing** | Before verification prompt (always) | On-demand after correct key / bootstrap action |
| **Sync store** | IndexedDB (`riot-web-sync`) — survives refresh | MemoryStore — lost on refresh |
| **Token storage** | Pickle key in IndexedDB encrypts tokens | Stronghold (Tauri) / memory (web) / planned: localStorage |
| **Token flags** | `mx_has_access_token` (flag only) | Session metadata in localStorage |
| **OIDC tokens** | Full JWT in localStorage (`mx_oidc_id_token`) | Not stored in browser |
| **Session lock** | `react_sdk_session_lock_*` prevents multi-tab | Not implemented yet |
| **Filter cache** | `mxjssdk_memory_filter_*` in localStorage | Same (cleaned up on logout) |
| **Crypto DB prefix** | `matrix-js-sdk` | `secludia-crypto` |
| **Recovery key validation** | Submitted to WASM layer directly | Pre-validated via Web Crypto (no IndexedDB for wrong keys) |

### What Secludia Does Better

- **Deferred crypto init** — skip users never create IndexedDB stores (Element always creates them)
- **Pre-validation of recovery keys** — `validateRecoveryKey()` uses pure Web Crypto (HKDF + AES-CTR + HMAC) to reject wrong keys before touching WASM/IndexedDB
- **No OIDC token leakage** — Element stores the full ID token JWT in plaintext localStorage
- **SDK localStorage cleanup** — `clearLocalStorageAuthData()` removes `mxjssdk_*` entries on logout

### Things to Consider Adding

- **IndexedDB sync store** — Use SDK's `IndexedDBStore` instead of `MemoryStore` for web refresh persistence (avoids full re-sync on page reload). Element uses `matrix-js-sdk:riot-web-sync` for this.
- **Session lock** — Prevent multiple tabs from running the same OlmMachine simultaneously (causes IndexedDB corruption). Element uses `react_sdk_session_lock_claimant/owner/ping` mechanism.
- **Pickle key** — Optional: encrypt tokens in IndexedDB with a generated key (what Element does). Marginal security benefit since both key and ciphertext are in browser storage, but prevents casual inspection.

---

## Platform Limitations and Future Migration

### Current Platform Architecture

Tauri 2 uses different WebView engines per platform:

| Platform | WebView | Engine | Status |
|----------|---------|--------|--------|
| **Windows** | WebView2 | Chromium | Works great |
| **macOS** | WKWebView | WebKit/Safari | Mostly works |
| **Linux** | WebKitGTK | WebKit | Known limitations |

### Linux/WebKitGTK Limitations

Linux users may encounter issues due to WebKitGTK limitations:

1. **Screen Sharing**
   - `getDisplayMedia()` requires `xdg-desktop-portal` and PipeWire to be properly configured
   - Many Linux systems don't have these services set up correctly
   - Error: "The request is not allowed by the user agent or the platform"

2. **Media Permissions**
   - Permissions API may not work correctly
   - Permission prompts may not appear when requesting camera/microphone
   - Workaround: Users may need to grant permissions via system settings

3. **Custom Titlebar**
   - `-webkit-app-region: drag` and `data-tauri-drag-region` behavior can be inconsistent
   - Drag region positioning may be offset on some window managers
   - Issue varies by compositor (X11 vs Wayland) and GTK version

4. **Audio Output Selection**
   - `setSinkId()` not supported on WebKit
   - Users cannot select audio output device (system default is used)

### Planned: Electron Migration

**Decision**: Linux is a priority market, and the WebKitGTK limitations significantly impact user experience. After the current implementation is complete and polished, Secludia will migrate from Tauri to Electron.

**Rationale**:
- Electron uses Chromium on all platforms → consistent behavior
- Screen sharing, permissions, and media APIs work reliably on Linux
- Trade-off: Larger bundle size (~150-200MB vs ~15MB) and higher memory usage (~200-300MB vs ~80MB idle)

**Migration Plan** (saved in `.claude/plans/serene-sauteeing-whisper.md`):
1. Create `src-electron/` with main process, preload scripts, IPC handlers
2. Implement `src/platforms/electron/` following existing abstraction pattern
3. Replace Stronghold with `keytar` (OS keychain) + `safeStorage` fallback
4. Update components to use `platform.isDesktop` instead of `platform.isTauri`
5. Remove Tauri after Electron is stable

**What stays the same**:
- Platform abstraction pattern (`src/platforms/`)
- Web version continues to work
- All business logic and components
- OAuth flow and token storage interfaces

**Timeline**: After current features are complete and code is polished
