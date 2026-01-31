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
│   ├── atoms/          # Basic UI (NavBarButton, UserAvatar, EncryptionChip, Scrollbar, etc.)
│   ├── layouts/        # Layout wrappers (ErrorBoundary, ResponsiveCard)
│   ├── organisms/      # Complex components (DirectMessagesSection, SettingsModal)
│   └── system/         # Tauri-specific (TitleBar, ControlActions, ControlButton)
├── config/             # App configuration and localStorage persistence
├── constants/          # App constants (PRESENCE_RING_COLORS, etc.)
├── context/            # React Context (AppContext, UserContext)
├── hooks/              # Custom hooks (useBreakpoint, useResizable, useSidebar, etc.)
├── i18n/               # Internationalization with auto-loading locales
├── locales/            # Translation files (en.json, es.json)
├── screens/            # Full-page screens (LoginScreen, MainScreen)
├── themes/             # CSS theme files (default, familiar, midnight, sunset, mint)
├── utils/              # Utility functions (validation, string helpers)
└── test/               # Test setup
```

### Key Patterns
- **Atomic Design**: Components organized as atoms/layouts/organisms/system
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
   - User profile avatar with presence ring
4. **Direct Messages Section** - Conversation list with:
   - SearchField for filtering by username/displayName
   - ConversationItem components with presence avatars
   - Encryption status chip in header
   - Click to select conversation (closes sidebar on tablet)
5. **Room Types** - Three types with visual differentiation:
   - `dm` - Direct messages (rounded square)
   - `space` - Spaces with hashtag badge indicator
   - `group` - Group chats (rounded square, no badge)
6. **Settings Modal** - Theme and language selectors in modal dialog
7. **User Context** - Current user state with presence support
8. **Theme System** - 6 themes with localStorage persistence
9. **i18n** - Auto-loading locales with interpolation support (en, es)
10. **Error Boundary** - Catches React errors with retry button
11. **Title Bar** - Custom Tauri title bar with window controls (only renders in desktop)
12. **System Tray** - Minimize to tray on close (Rust-side)

### MainScreen Responsive Behavior
- **Mobile (<640px)**: Sidebar hidden, hamburger button opens full-screen sidebar overlay
- **Tablet (640-768px)**: 72px navbar always visible, sidebar content opens as overlay when DM/Space selected
- **Desktop (768px+)**: Full sidebar (nav 72px + resizable content 180-348px) + main content

### MainScreen Animation
When opening sidebar on mobile:
1. Nav slides in from left (0.3s ease-out)
2. Content fades in + slides slightly (0.25s ease-out, 0.2s delay)
Closing reverses with content fading first, then nav sliding out.

---

## Key Files

### Components
- `NavBarButton.tsx` - Navigation button with selection indicator and hover states
- `NavBarButton.css` - Styles for indicator animation, avatar/badge hover states
- `UserAvatar.tsx` - Avatar component with presence ring support
- `EncryptionChip.tsx` - Chip showing encryption status (lock icon)
- `Scrollbar.tsx` - Custom scrollbar wrapper
- `DirectMessagesSection.tsx` - DM list with search and conversation items
- `ConversationItem.tsx` - Individual conversation row with avatar/presence
- `SettingsModal.tsx` - Settings dialog with theme/language options

### Hooks
- `useMediaQuery.ts` - Media query hook with Tailwind breakpoints (sm, md, lg, xl, 2xl)
- `useBreakpoint.ts` - Shorthand for common breakpoints
- `useSidebar.ts` - Sidebar open/close state, auto-closes at sm breakpoint
- `useResizable.ts` - Drag-to-resize functionality with min/max constraints
- `useTauriWindow.ts` - Tauri window operations (minimize, maximize, close)

### Context
- `AppContext.tsx` - Provides theme, language, selectedRoom, and `t()` translation function
- `AppContext.types.ts` - Types including `RoomType` ("dm" | "space" | "group")
- `UserContext.tsx` - Current user state and presence
- `useAppContext.ts` / `useUserContext.ts` - Hooks to access context safely

### Screens
- `LoginScreen.tsx` - Login form with homeserver validation
- `MainScreen.tsx` - Main app screen with sidebar + content layout
- `MainScreen.css` - Responsive styles with CSS custom properties

---

## Important Conventions

### Imports Order
1. React imports
2. External libraries (@heroui/react, @gravity-ui/icons)
3. Internal imports (@/context, @/hooks, @/components)
4. Types (import type)
5. CSS

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

### CSS Custom Properties
MainScreen uses scoped CSS variables:
```css
.main-screen {
  --header-height: 50px;
  --nav-width: 72px;
  --sidebar-slide-offset: 30px;
}
```

### String Utilities
- `getInitials(name)` - Returns first 2 characters trimmed and uppercased (e.g., "C mongol" → "C")

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

5. **Settings Expansion** - Add more settings beyond theme/language

6. **Additional Translations** - More languages beyond en/es

---

## Testing

Run tests: `npm test`
Run lint: `npm run lint`
Type check: `npx tsc --noEmit`
Build: `npm run build`
Dev server: `npm run dev`
Tauri dev: `npm run tauri dev`

---

## Git State

Branch: `init`

---

## Notes for Next Session

- The `homeserver` and `onLogout` props in MainScreen are passed but not yet used - they'll be needed for Matrix integration
- Mock data exists in MainScreen (ROOMS array) and DirectMessagesSection (MOCK_CONVERSATIONS) - replace with real Matrix data
- HeroUI v3 is in **beta** - check for breaking changes if updating
- Tauri system tray logic is in Rust (`src-tauri/src/lib.rs`), not TypeScript
- Presence system is mocked - will need Matrix presence integration
- Space badge uses Hashtag icon from @gravity-ui/icons, turns accent color on hover/selected
- Tablet breakpoint (640-768px) has special behavior: sidebar content appears as overlay, clicking conversation closes it
