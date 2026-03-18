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
  - `metro.config.js`: `withNativewind(config, { input: './global.css' })`
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
