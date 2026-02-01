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
│   ├── atoms/          # Basic UI (NavBarButton, PresenceAvatar, ProfileAvatar, EncryptionChip, Scrollbar, SelectDropdown, AppToast, etc.)
│   ├── molecules/      # Composed components (GhostEmptyState)
│   ├── layouts/        # Layout wrappers (ErrorBoundary, ResponsiveCard)
│   ├── organisms/      # Complex components (DirectMessagesSection, SettingsModal, NotificationsSection)
│   └── system/         # Tauri-specific (TitleBar, ControlActions, ControlButton)
├── config/             # App configuration and localStorage persistence
├── constants/          # App constants (PRESENCE_RING_COLORS, SIDEBAR_WIDTH, SIMULATED_LOADING_DELAY)
├── context/            # React Context (AppContext, UserContext)
├── hooks/              # Custom hooks (useBreakpoint, useResizable, useSidebar, etc.)
├── i18n/               # Internationalization with auto-loading locales
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
- `SelectDropdown.tsx` - Unified dropdown component with `variant="compact"` or `variant="row"`
- `AppToast/` - Toast notification system:
  - `appToast.ts` - Queue, `appToast()` function, and `AppToastContent` type
  - `AppToastContainer.tsx` - React component with SVG countdown animation
  - `AppToast.css` - Animation keyframes and HeroUI overrides

### Components (Molecules)
- `GhostEmptyState.tsx` - Empty state with ghost icon and wave text animation
  - Wave animation on both ghost and text (per-word delay)
  - Clickable ghost triggers action (e.g., opens new chat modal)
  - CSS animation in `GhostEmptyState.css`

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
- `NotificationsSection.tsx` - Notification settings with permission status, type selector, duration slider, and test buttons

### Hooks
- `useMediaQuery.ts` - Media query hook with Tailwind breakpoints (sm, md, lg, xl, 2xl)
- `useBreakpoint.ts` - Shorthand for common breakpoints
- `useSidebar.ts` - Sidebar open/close state, auto-closes at sm breakpoint
- `useResizable.ts` - Drag-to-resize functionality with min/max constraints
- `useTauriWindow.ts` - Tauri window operations (minimize, maximize, close)
- `useNotification.ts` - System notification API (permission, send) + `playNotificationSound()` export
- `useTranslatedOptions.ts` - Hook to create translated dropdown options from config arrays (DRY helper)
- `isWindowFocused.ts` - Utility to check if window is focused (for auto notification type)

### Context
- `AppContext.tsx` - Provides theme, language, selectedRoom, toastDuration, and `t()` translation function
- `AppContext.types.ts` - Types including `RoomType` ("dm" | "space" | "group")
- `UserContext.tsx` - Current user state and presence
- `useAppContext.ts` / `useUserContext.ts` - Hooks to access context safely

### Config
- `localStorage.ts` - Config persistence with generic `updateConfig<K>()` helper and schema validation
- `configTypes.ts` - `SecludiaConfig` type (theme, language, notificationPermission, toastDuration)
- `defaultConfig.ts` - Default config values

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

3. **Space Content** - When a space is selected, show space-specific content:
   - Channels list within the space
   - Space settings/info

4. **Group Chat** - When a group is selected:
   - Show chat directly in main content (no sidebar panel)

5. **Settings Expansion** - Implement remaining settings sections:
   - Security
   - Encryption

6. **Additional Translations** - More languages beyond en/es

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
