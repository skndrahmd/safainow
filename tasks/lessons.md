# Lessons Learned

## L001 — Always web search before giving commands or writing code
**What happened:** Gave CLI commands and code from training data without searching first. Commands were outdated (wrong flags, wrong versions).
**Rule:** Web search BEFORE any command, install instruction, or code implementation. No exceptions.
**Applies to:** Every single response involving commands or code.

## L002 — Scaffold tools don't support pnpm --filter
**What happened:** Suggested `npx expo install ... --filter customer` — expo CLI doesn't support `--filter`. Got a CommandError.
**Rule:** `expo install` must be run from inside the app directory (`cd apps/customer`). Only pnpm native commands support `--filter`.
**Applies to:** Any `expo install`, `expo customize`, or other Expo CLI commands.

## L003 — create-next-app uses npm by default in a pnpm workspace
**What happened:** `create-next-app` installed dependencies with npm, leaving `node_modules` and `package-lock.json` in the admin app. Required `rm -rf apps/admin/node_modules apps/admin/package-lock.json` to clean up.
**Rule:** After running any scaffolding tool inside a pnpm workspace, check for and remove stray `node_modules` and lock files created by npm/yarn.

## L004 — Supabase new key naming (post Nov 2025)
**What happened:** Used old `ANON_KEY` / `SERVICE_ROLE_KEY` naming. New projects use `sb_publishable_...` and `sb_secret_...` keys.
**Rule:** New Supabase projects (after Nov 2025) use publishable/secret key naming. Use `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` env var names.

## L005 — React versions have converged on 19.2.x
**What happened:** Original spec assumed React 18 for mobile and React 19 for admin. By March 2026, Expo SDK 55 + RN 0.83 use React 19.2, same as Next.js 16.
**Rule:** Always check expo.dev/changelog for current SDK→React version mapping before pinning.

## L006 — NativeWind is on v5 with Tailwind v4 for Expo SDK 55
**What happened:** Initially assumed NativeWind v4. Expo SDK 55 + RN 0.83 (New Architecture only) requires NativeWind v5 (preview) with Tailwind v4.
**Rule:** Use `nativewind@preview` for Expo SDK 55+. Setup requires `react-native-css`, PostCSS config, and `withNativewind` metro wrapper.

## L007 — CLAUDE.md must be kept in sync with actual installed versions
**What happened:** CLAUDE.md still referenced Next.js 15, React 18.3.1, RN 0.76.0 after we had already installed newer versions.
**Rule:** Update CLAUDE.md immediately whenever actual installed versions differ from what's documented.

## L008 — Follow task management workflow from CLAUDE.md
**What happened:** Did not create `tasks/todo.md` or `tasks/lessons.md` from the start, and did not enter plan mode for non-trivial tasks.
**Rule:** For any task with 3+ steps or architectural decisions — enter plan mode first, write to `tasks/todo.md`, track lessons in `tasks/lessons.md`.

## L009 — Always read all docs/ spec files before making product decisions
**What happened:** Started implementing features without reading all 8 spec files in docs/. Important details (passcode system, feedback model, admin modules) only exist in those files.
**Rule:** Before any feature work, read all files in docs/ in order (00 through 07). They are the source of truth for product decisions.
**Applies to:** Every new feature or screen implementation.

## L012 — ALWAYS web search before implementing anything, and verify it works 100%
**What happened:** Implemented features using training data knowledge without searching first. This leads to outdated APIs, wrong package versions, broken patterns, and wasted time debugging.
**Rule:** Before writing ANY code or running ANY command for a feature:
  1. Web search the exact library/API/pattern being used — no exceptions
  2. Search for the specific version combination in use (e.g. "expo-router v4 expo SDK 55 setup 2025")
  3. Cross-check official docs + recent community reports for known issues
  4. Only then write code that matches the current, verified documentation
  5. After implementing, run tsc --noEmit + manual verification to confirm it actually works
  6. Never mark a task done without proof it works (no TypeScript errors, app runs, feature behaves correctly)
**Applies to:** Every single implementation step. Even "simple" things like package installs and config changes.

## L011 — Execute sprints one sub-part at a time, not all at once
**What happened:** Tried to write a single massive plan for the entire Sprint 2 (30+ tasks across 6 subsystems) in one go. This is hard to review, approve, and track.
**Rule:** Break every sprint into focused sub-parts (e.g. Sprint 2A Shared Infrastructure, Sprint 2B App Bootstrap, Sprint 2C Booking Flow, etc.). For each sub-part:
  1. Write the plan for ONLY that sub-part
  2. Present it to the user and wait for approval
  3. Execute it fully (all tasks + commits)
  4. Verify it (tsc --noEmit, manual checks)
  5. Then and only then move to the next sub-part
**Applies to:** Every sprint and every multi-subsystem feature. Never plan an entire sprint in one document.

## L015 — Use NativeWind v4 + Tailwind v3, not NativeWind v5 preview
**What happened:** NativeWind v5 preview (5.0.0-preview.3) uses react-native-css + lightningcss for CSS compilation. lightningcss has version conflict issues in pnpm monorepos — multiple nested copies at different versions, overrides don't propagate correctly. Spent many sessions debugging.
**Rule:** Use `nativewind@^4.1.23` + `tailwindcss@^3.4.0` for all Expo apps. v4 uses Babel transforms (no lightningcss, no CSS compiler). Zero version conflict issues.
**v4 setup files:**
  - `babel.config.js`: `presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel']`
  - `tailwind.config.js`: content array + `presets: [require('nativewind/preset')]`
  - `global.css`: `@tailwind base; @tailwind components; @tailwind utilities;`
  - `metro.config.js`: `withNativeWind(config, { input: './global.css' })` ← capital W in Wind
  - `nativewind-env.d.ts`: `/// <reference types="nativewind/types" />`
**Applies to:** Any new Expo app in this monorepo. Never use NativeWind v5 preview until it has a stable release.

## L014 — NativeWind v5 global.css must use sub-path imports, not @import "tailwindcss"
**What happened:** `global.css` used `@import "tailwindcss"` (Tailwind v4 bare specifier). lightningcss (used internally by react-native-css) cannot deserialize this — crashes with "expected an object-like struct named Specifier". This affected BOTH apps from the very beginning but was masked by removing react-native-css in Sprint 2B.
**Rule:** For NativeWind v5 on native, `global.css` must use explicit sub-path imports:
  ```css
  @import "tailwindcss/theme.css" layer(theme);
  @import "tailwindcss/preflight.css" layer(base);
  @import "tailwindcss/utilities.css";
  @import "nativewind/theme";  ← no .css! package exports "./theme" not "./theme.css"
  ```
  The `@import "tailwindcss"` shorthand only works for web/PostCSS pipelines, not native.
**Also:** Pin `lightningcss` to `1.30.1` in root package.json `pnpm.overrides` — versions >= 1.30.2 have a regression with this CSS format.
**Applies to:** Any Expo app using NativeWind v5 + Tailwind v4. Apply to both apps at setup time.

## L013 — Expo in pnpm monorepo requires node-linker=hoisted + metro watchFolders
**What happened:** Metro bundler failed with "Unable to resolve react-native" from files inside nested route groups, even though other files in the same app resolved fine. Root cause: pnpm's default isolated/symlinked node_modules layout breaks Metro's module resolver for deeply nested files.
**Rule:** Every Expo app in a pnpm monorepo requires two things:
  1. Root `.npmrc` must contain `node-linker=hoisted` — hoists all packages to a flat node_modules layout
  2. Each `metro.config.js` must include monorepo-aware config:
     ```js
     const monorepoRoot = path.resolve(__dirname, '../..');
     config.watchFolders = [monorepoRoot];
     config.resolver.nodeModulesPaths = [
       path.resolve(__dirname, 'node_modules'),
       path.resolve(monorepoRoot, 'node_modules'),
     ];
     ```
  3. Run `pnpm install` after adding `node-linker=hoisted` to apply the new layout.
  4. Clear Metro cache on first run: `pnpm --filter <app> dev -- --clear`
**Applies to:** Any new Expo app added to the monorepo. Fix partner app metro.config.js at the same time.

## L016 — emailRedirectTo must be an HTTP URL, not a deep link
**What happened:** Set `emailRedirectTo: Linking.createURL('/')` which produces `safainow-customer:///`. Supabase's confirmation email redirects the user's browser to this URL — browsers cannot follow custom URL schemes from server redirects, so Supabase fell back to the project Site URL (admin dashboard).
**Rule:** `emailRedirectTo` must always be a full HTTP/HTTPS URL. Create a dedicated web confirmation page in the admin Next.js app and point `emailRedirectTo` there. Use `EXPO_PUBLIC_ADMIN_URL` env var for the base URL so it works in both dev and prod.
**Applies to:** Any Supabase email flow — sign-up confirmation, password reset, magic link.

## L017 — Supabase Realtime subscriptions require the table in the publication
**What happened:** Added a Realtime subscription for DELETE events on `customers`, but the table wasn't added to `supabase_realtime` publication. Subscription received no events silently.
**Rule:** For every table you subscribe to via Realtime, add a migration with `ALTER PUBLICATION supabase_realtime ADD TABLE public.<table>` and set `REPLICA IDENTITY`. Add the publication ALTER at the same time as the subscription code — never after.
**Applies to:** Every new Realtime subscription.

## L018 — Deleting a user's DB profile row does NOT sign them out
**What happened:** Deleted a `customers` row from the DB. The Supabase auth session remained valid; the app stayed logged in.
**Rule:** Auth sessions are independent of profile rows. To force sign-out on admin deletion, subscribe to Realtime DELETE events on the profile table and call `supabase.auth.signOut()` when the event fires.
**Applies to:** Any app allowing admin-side deletion of user profiles.

## L019 — Delete stray package-lock.json files after scaffolding in pnpm workspaces
**What happened:** Scaffold tools (create-next-app, expo CLI) ran npm install inside app directories, leaving `package-lock.json` files. These conflict with pnpm's lockfile management.
**Rule:** After any scaffolding command inside a pnpm workspace, immediately delete any `node_modules/` and `package-lock.json` generated by npm, then run `pnpm install` from the root.
**Applies to:** Every new app or package added to the monorepo.

## L020 — Every app must have check-types and lint scripts for turbo pipeline
**What happened:** `turbo check-types` and `turbo lint` silently skipped customer, partner, and admin apps because those apps had no matching scripts in their package.json. Turbo skips apps missing the script with no warning.
**Rule:** Add `"check-types": "tsc --noEmit"` and `"lint": "eslint ."` to every app's package.json at creation time. Without these, the turbo CI pipeline silently skips type checking and linting for those apps.
**Applies to:** Every new app added to the monorepo.

## L021 — Don't use BottomTabBar from @react-navigation/bottom-tabs in custom tabBar
**What happened:** Tried to render a custom `tabBar` for Expo Router `<Tabs>` using `BottomTabBar` from `@react-navigation/bottom-tabs`. Crashed with `useFrameSize must be used within a FrameSizeProvider` because `BottomTabBar` expects a context provided by the navigator's internal rendering, not available when used directly.
**Rule:** Don't import `BottomTabBar` for custom tab bars. Instead, render UI elements inside individual screens (e.g., absolute-positioned strips) or build a fully custom tab bar from scratch.
**Applies to:** Any Expo Router tab layout customization.

## L022 — Wrapping Expo Router <Tabs> in a <View> breaks touch propagation
**What happened:** Wrapped `<Tabs>` in `<View className="flex-1">` to add an absolute-positioned cart strip as a sibling. This caused eye icons and other buttons on screen content to become untappable.
**Rule:** Never wrap `<Tabs>` in an extra View with absolute-positioned siblings. Instead, place overlay UI inside individual tab screens. `pointerEvents="box-none"` does not reliably fix the issue.
**Applies to:** Any layout where UI needs to overlay tab content.

## L023 — Android DateTimePicker crashes with mode="datetime"
**What happened:** `@react-native-community/datetimepicker` v9.x on Android crashes with "Cannot read property 'dismiss' of undefined" when using `mode="datetime"`. The chained date→time picker fails on the second step.
**Rule:** On Android, split into two sequential pickers: show `mode="date"` first, then on date selection show `mode="time"`. iOS `mode="datetime"` with `display="spinner"` works fine.
**Applies to:** Any use of DateTimePicker on Android.

## L024 — SafeAreaView from react-native-safe-area-context may not work with NativeWind className
**What happened:** Wrapped home screen in `<SafeAreaView className="flex-1 bg-white" edges={['top']}>`. Buttons at the top were still not tappable. Switching to `useSafeAreaInsets()` hook + manual `contentContainerStyle={{ paddingTop: insets.top }}` on FlatList fixed the issue.
**Rule:** Prefer `useSafeAreaInsets()` hook with manual padding over `SafeAreaView` wrapper, especially on screens with FlatList. Apply insets via `contentContainerStyle` on the scroll view, not as a wrapper component.
**Applies to:** Any screen needing safe area handling in Expo + NativeWind apps.

## L010 — Follow the FULL CLAUDE.md workflow, not just selected parts
**What happened:** Repeatedly acknowledged CLAUDE.md rules verbally but did not actually apply them — skipped plan mode, skipped subagent strategy, skipped writing to tasks/todo.md before acting.
**Rule:** CLAUDE.md is not a reference document — it is a binding workflow. Every rule must be applied on every task:
  1. Read docs/ before product decisions
  2. Enter plan mode for 3+ step tasks
  3. Spawn subagents for research, exploration, parallel work
  4. Write plan to tasks/todo.md and check in before implementing
  5. Web search before any code or commands
  6. Verify before marking done
  7. Update tasks/lessons.md after corrections
**Applies to:** Every single task, no exceptions.

## L025 — Supabase uses ES256 asymmetric JWT signing keys (JWKS), not HS256
**What happened:** Initially tried `@fastify/jwt` with a static `SUPABASE_JWT_SECRET` (HS256). Then tried `fastify-jwt-jwks` — but it hardcodes RS256, and our Supabase project uses ES256 (Elliptic Curve P-256). Got "Invalid public key provided for algorithms RS256" error.
**Rule:** New Supabase projects (post Nov 2025) use ES256 asymmetric keys. The JWKS endpoint is `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`. For Fastify, use `@fastify/jwt` + `get-jwks` (NOT `fastify-jwt-jwks` which only supports RS256). The `get-jwks` library reads the `alg` from the token header and fetches the correct public key format.
**Setup:**
  - `@fastify/jwt` with `decode: { complete: true }` and a `secret` callback
  - `get-jwks` with `issuersWhitelist: ['{SUPABASE_URL}/auth/v1']`
  - The callback extracts `kid`, `alg`, `iss` from the token and calls `getJwks.getPublicKey({ kid, domain: iss, alg })`
**Applies to:** Any server-side JWT verification against Supabase Auth.

## L026 — Commission ledger cannot be created at booking time
**What happened:** The original plan called for inserting a `commission_ledger` row at booking creation. But the `commission_ledger` table requires `partner_id` (non-nullable FK), and no partner exists at booking creation time (status = pending).
**Rule:** Defer commission ledger creation to the moment a partner accepts the booking (`POST /bookings/:id/accept`), when `partner_id` becomes available.
**Applies to:** Any booking creation or commission-related logic.

## L027 — EXPO_PUBLIC_API_URL must match the actual API port
**What happened:** Customer app had `EXPO_PUBLIC_API_URL=http://localhost:4000` but the Fastify API runs on port 3001. API calls would fail silently with network errors.
**Rule:** Always verify that env vars referencing local services match the actual ports configured in those services. The API port is set in `apps/api/.env` (`PORT=3001`).
**Applies to:** Any cross-app communication in the monorepo.

## L028 — Mobile apps can't reach localhost — use machine IP
**What happened:** Customer app on a physical device called `http://localhost:3001` which refers to the device itself, not the dev machine. Got "Network request failed".
**Rule:** `EXPO_PUBLIC_API_URL` must use the dev machine's LAN IP (e.g. `http://192.168.x.x:3001`), not `localhost`. On Android emulators `10.0.2.2` maps to host localhost, but physical devices need the actual IP. Run `ipconfig getifaddr en0` on macOS to find it.
**Applies to:** Any mobile app calling a local dev API server.

## L029 — Fastify must bind to 0.0.0.0 for external access
**What happened:** Fastify dev server defaulted to `127.0.0.1` (localhost only). Even with the correct IP in the mobile app, requests couldn't reach the server.
**Rule:** Add `-a 0.0.0.0` to the `fastify start` command so it listens on all network interfaces. Without this, only the machine itself can reach the API.
**Applies to:** Any Fastify dev server accessed from mobile devices or other machines on the network.

## L030 — Stack.Screen headerShown:true doesn't reliably handle safe area in nested navigators
**What happened:** Booking detail page used `Stack.Screen options={{ headerShown: true }}` inside a Stack whose parent `_layout.tsx` had `headerShown: false`. The header rendered but was behind the notch/status bar.
**Rule:** When a screen is inside a nested navigator (e.g. Stack inside Tabs), don't rely on `Stack.Screen headerShown: true` for safe area handling. Instead, use `useSafeAreaInsets()` hook with manual `paddingTop: insets.top + N` and build a custom header row with a back button.
**Applies to:** Any detail/sub-screen inside a tab that uses a nested Stack with `headerShown: false`.

## L031 — Use useFocusEffect for lists that need to refresh on navigate-back
**What happened:** Address list used `useEffect` to fetch addresses on mount. After adding a new address and navigating back, the list showed stale data because the component was already mounted and the effect didn't re-run.
**Rule:** For any list screen where the user can navigate away to add/edit/delete an item and then come back, use `useFocusEffect` from `expo-router` (or `@react-navigation/native`) instead of `useEffect`. This re-fetches data every time the screen regains focus.
**Applies to:** Any list screen in a Stack navigator where child screens modify the underlying data.

## L032 — Address input should be text OR GPS, not both required
**What happened:** Add address form required both a typed address (≥5 chars) AND GPS coordinates to save. Users should be able to save with just one.
**Rule:** When a form has multiple ways to provide the same logical input (e.g. typed address vs GPS pin), use OR validation (`canSave = hasText || hasCoords`), not AND. Fill in sensible defaults for the missing field (e.g. "GPS Location (lat, lng)" for missing text, 0/0 for missing coords).
**Applies to:** Any form with alternative input methods for the same field.

## L033 — Async toggle actions need loading state and duplicate-call prevention
**What happened:** Set-as-default toggle on address rows had no loading indicator. Users would tap multiple times during the delay, causing unnecessary API calls.
**Rule:** For any toggle/action button that triggers an async operation: (1) show a loading spinner replacing the icon, (2) disable the button while loading, (3) early-return in the handler if already processing. Track the in-progress item's ID in state (e.g. `togglingId`) rather than a boolean, so only the specific item shows the spinner.
**Applies to:** Any list item with inline async actions (toggle, delete, etc.).

## L034 — Create all route files before type-checking in Expo Router typed routes
**What happened:** Created `_layout.tsx` and `index.tsx` for the profile stack but hadn't created `addresses.tsx` yet. Type check failed because `router.push('/profile/addresses')` referenced a route that didn't exist as a file — Expo Router generates typed routes from the file system.
**Rule:** When adding navigation between new screens, create all the target screen files (even as stubs) before running `tsc --noEmit`. Expo Router's typed routes won't recognize a path until the corresponding file exists.
**Applies to:** Any new screen that is navigated to via `router.push()` or `router.replace()`.

## L035 — Offer "save to address book" when entering new addresses in flows
**What happened:** Booking flow address step collected address data but never offered to persist it. Users had to go to profile > address book separately to save addresses they'd already typed.
**Rule:** When a flow collects data that could be reused (addresses, payment methods, etc.), offer an inline "save for later" toggle. Use fire-and-forget insert so it doesn't block the primary flow. Hide the toggle when the user selects an already-saved item.
**Applies to:** Any flow that collects reusable user data.

## L036 — Supabase Storage upload from React Native requires base64-arraybuffer
**What happened:** React Native's Blob/File/FormData don't work reliably for Supabase Storage uploads. Using `expo-image-picker` with `base64: true` + `base64-arraybuffer` decode is the reliable pattern.
**Rule:** For Supabase Storage uploads in React Native, always use: (1) `expo-image-picker` with `base64: true`, (2) `decode(asset.base64)` from `base64-arraybuffer`, (3) set `contentType` explicitly, (4) use `upsert: true` for overwritable uploads like avatars. Append `?t=${Date.now()}` cache-buster to the public URL so updated images display immediately.
**Applies to:** Any Supabase Storage upload from React Native.

## L037 — Supabase auth.updateUser does not require old password
**What happened:** Planned to add "old password" field for password change, but Supabase's `auth.updateUser({ password })` works with just the new password when there's an active session.
**Rule:** When building password change screens for Supabase Auth, only collect the new password (+ confirm). No old password needed. This also means Google-only users can set a password for dual login without needing to know an old one.
**Applies to:** Any Supabase Auth password change/set flow.

## L038 — Use @dnd-kit for drag-and-drop in React 19 / Next.js 16
**What happened:** Needed drag-and-drop reordering for packages in admin dashboard. `react-beautiful-dnd` has poor React 19 support. `@dnd-kit/core` + `@dnd-kit/sortable` works perfectly.
**Rule:** For drag-and-drop in React 19 / Next.js 16 apps, use `@dnd-kit/core` and `@dnd-kit/sortable`. Wrap sortable items with `SortableContext` and `useSortable` hook. Use `verticalListSortingStrategy` for table rows. Implement optimistic UI updates with revert on error for better UX.
**Applies to:** Any sortable/reorderable list in React 19+ apps.

## L039 — Sort order field with auto-assignment trigger for new items
**What happened:** Needed admin-controllable display order for packages. Used `sort_order` column with database trigger to auto-assign new items to the end of the list.
**Rule:** When adding admin-controlled ordering: (1) add `sort_order INTEGER NOT NULL DEFAULT 0` column, (2) create index for efficient ordering, (3) backfill existing items using `ROW_NUMBER() OVER (ORDER BY created_at)`, (4) add trigger to auto-assign next sort_order for new items. This ensures new items don't require manual ordering while still allowing admin control.
**Applies to:** Any table where admin needs control over display order.

## L040 — TypeScript `as const` arrays with optional properties need explicit typing
**What happened:** Used `as const` on an array of menu items where only one item had a `danger` property. TS narrowed each item to its literal type, so `.danger` didn't exist on items without it, causing type errors.
**Rule:** When an array of objects has optional properties that only some items have, either: (1) add the property with `false`/`undefined` to all items, or (2) use an explicit type annotation instead of `as const` (e.g. `readonly { label: string; icon: string; danger?: boolean }[]`).
**Applies to:** Any `as const` array where items have heterogeneous shapes.
