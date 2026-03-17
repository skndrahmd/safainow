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
