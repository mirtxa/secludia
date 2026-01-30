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
│   ├── atoms/          # Basic UI components (Typewriter, ThemeSelector, LanguageSelector)
│   ├── layouts/        # Layout wrappers (ErrorBoundary, ResponsiveCard)
│   └── system/         # Tauri-specific (TitleBar, ControlActions, ControlButton)
├── config/             # App configuration and localStorage persistence
├── context/            # React Context (AppContext for theme/language/i18n)
├── hooks/              # Custom hooks (useMediaQuery, useResizable, useSidebar, useTauriWindow)
├── i18n/               # Internationalization with auto-loading locales
├── locales/            # Translation files (en.json, es.json)
├── screens/            # Full-page screens (LoginScreen, MainScreen)
├── themes/             # CSS theme files (default, familiar, midnight, sunset, mint)
├── utils/              # Utility functions (validation)
└── test/               # Test setup
```

### Key Patterns
- **Atomic Design**: Components organized as atoms/layouts/system
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
   - Tablet (640-768px): Only navbar visible
   - Desktop (768px+): Full sidebar + main content
3. **Theme System** - 6 themes with localStorage persistence
4. **i18n** - Auto-loading locales with interpolation support (en, es)
5. **Error Boundary** - Catches React errors with retry button
6. **Title Bar** - Custom Tauri title bar with window controls (only renders in desktop)
7. **System Tray** - Minimize to tray on close (Rust-side in `src-tauri/src/lib.rs`)

### MainScreen Responsive Behavior
- **Mobile (<640px)**: Sidebar hidden, hamburger button in header opens sidebar as overlay
- **Tablet (640-768px)**: Only 72px navbar visible, no content panels
- **Desktop (768px+)**: Full sidebar (nav 72px + resizable content 180-348px) + main content

### MainScreen Animation
When opening sidebar on mobile:
1. Nav slides in from left (0.3s ease-out)
2. Content fades in + slides slightly (0.25s ease-out, 0.2s delay)
Closing is instant (no animation).

---

## Key Files

### Hooks
- `useMediaQuery.ts` - Media query hook with Tailwind breakpoints (sm, md, lg, xl, 2xl)
- `useBreakpoint.ts` - Shorthand for common breakpoints
- `useSidebar.ts` - Sidebar open/close state, auto-closes at sm breakpoint
- `useResizable.ts` - Drag-to-resize functionality with min/max constraints
- `useTauriWindow.ts` - Tauri window operations (minimize, maximize, close)

### Context
- `AppContext.tsx` - Provides theme, language, and `t()` translation function
- `useAppContext.ts` - Hook to access context safely

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
}
```

---

## Pending Work / Next Steps

1. **MainScreen Content** - The sidebar and main content areas are empty placeholders:
   - `sidebar__nav` - Navigation icons (rooms, DMs, settings, etc.)
   - `sidebar__header` - Search or room list header
   - `sidebar__body` - Room/channel list
   - `main-content__header` - Room name, members, actions
   - `main-content__body` - Chat messages, input

2. **Matrix Integration** - Connect to Matrix homeserver:
   - OAuth 2.0 authentication flow
   - Matrix SDK integration
   - Room sync, message sending/receiving

3. **Sidebar Navigation** - Implement closing sidebar from nav buttons on mobile

4. **Settings Screen** - Full settings page (currently only theme/language dropdowns)

5. **Additional Translations** - More languages beyond en/es

---

## Testing

Run tests: `npm test`
Run lint: `npm run lint`
Type check: `npx tsc --noEmit`
Build: `npm run build`
Dev server: `npm run dev`
Tauri dev: `npm run tauri dev`

All 68 tests currently passing.

---

## Git State

Branch: `init`
Last commit message: (pending - MainScreen implementation)

Modified files ready to commit:
- App.tsx, LoginScreen, ErrorBoundary, ResponsiveCard
- ThemeSelector, LanguageSelector (memoization)
- New: MainScreen, useResizable, useSidebar
- Locales updated with MainScreen translations

---

## Notes for Next Session

- The `homeserver` and `onLogout` props in MainScreen are passed but not yet used - they'll be needed for Matrix integration
- The sidebar `close()` function from `useSidebar` is exported but not used yet - will be called by navigation buttons
- HeroUI v3 is in **beta** - check for breaking changes if updating
- Tauri system tray logic is in Rust (`src-tauri/src/lib.rs`), not TypeScript
