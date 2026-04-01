# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What We're Building

SafaiNow is an on-demand home cleaning marketplace for Karachi, Pakistan — three
apps from one monorepo:

- **`apps/customer`** — Expo (React Native), English, iOS + Android
- **`apps/partner`** — Expo (React Native), Urdu RTL, Android-only,
  icon/voice-first for low-literacy users
- **`apps/admin`** — Next.js 16, English, shadcn/ui + Tailwind v4
- **`apps/api`** — Node.js + Fastify, REST API

Shared packages (`types`, `validators`, `utils`, `constants`) are pure
TypeScript — zero React dependencies.

## Commands

```bash
# Install all dependencies
pnpm install

# Run all apps in dev mode
pnpm dev

# Run a specific appt
pnpm --filter customer dev
pnpm --filter partner dev
pnpm --filter admin dev
pnpm --filter api dev

# Build
pnpm build
pnpm --filter admin build

# Lint
pnpm lint
pnpm --filter <app> lint

# Type check
pnpm typecheck

# Run tests
pnpm test
pnpm --filter <package> test -- <test-file-pattern>
```

## React Version Strategy (Critical)

Version conflicts between React Native and Next.js are the primary pain point in
this monorepo. Follow these rules without exception:

- **Shared packages**: zero React dependencies. Pure TypeScript only.
- **`apps/customer` and `apps/partner`**: pinned to the React version required
  by the current Expo SDK (check expo.dev/changelog). Currently `react: 19.1.0`,
  `react-native: 0.81.5` (Expo SDK 54).
- **`apps/admin`**: pinned to `react: 19.2.0` (Next.js 16 requirement).
- If a shared package ever needs React, use `peerDependencies` with
  `"react": ">=18.0.0"` — never a direct dependency.

## Infrastructure

- **Backend**: Supabase — PostgreSQL + PostGIS + Auth + Realtime + Storage +
  Edge Functions
- **Auth**: Supabase Auth email/password. Partners use `{phone}@safainow.local`
  as the email address (phone+PIN auth hack).
- **Push notifications**: FCM v1 API (legacy shut down June 2025). Use raw FCM
  tokens via `getDevicePushTokenAsync()`, not Expo Push Tokens. Fallback: Expo
  Push Service.
- **Maps**: Google Maps SDK
- **Package manager**: pnpm always

## Key Architectural Decisions

### Race Condition — No Queue Needed

Partner job claiming is handled with a single atomic SQL transaction. No Redis
or BullMQ for Sprints 1–4:

```sql
UPDATE bookings
SET partner_id = $partnerId, status = 'accepted', accepted_at = NOW()
WHERE id = $bookingId AND status = 'pending'
RETURNING *;
```

Returns a row → partner claimed it. Returns nothing → another partner got there
first.

### Partner Matching

PostGIS radius query finds all active+available partners → push notifications
sent simultaneously to all → first to accept wins via the atomic UPDATE above →
all others get a dismissal notification.

### Assignment Cascade Tracking

A `job_offers` table (not in the original spec) tracks which partners were
notified per booking. Required for dismissal logic and re-matching after partner
cancellation.

### Price Snapshotting

`price_at_booking` is stored on every `booking_packages` and
`booking_custom_services` record at booking creation time. Never read live
prices after booking.

### Database-Driven Timeouts

Assignment timeouts are tracked in the database, not via `setTimeout` in edge
functions.

### Partner Passcodes

6-digit passcode, bcrypt-hashed in DB. Admin sees plain passcode once on
creation/reset only. No recovery flow on the partner app.

## Business Logic Rules

### Package Combinations

`PackageType = 'cleaning' | 'standalone' | 'custom'`

- Only one `cleaning` package allowed per booking (Standard, Special, Advanced)
- `standalone` (Clothes Washing & Drying) can be added alongside any one
  cleaning package
- `custom` is fully standalone — selecting it clears all other selections
- Combination rules enforced on **both frontend and backend**

### Booking Statuses

`pending → accepted → on_route (auto) → reached → work_in_progress (auto) → completed → cash_collected`

Cancellation variants: `cancelled_by_customer`, `cancelled_by_partner`,
`cancelled_by_admin`

Every status change writes an immutable record to `booking_timeline`.

### Cancellation Window

Both customer and partner have exactly 15 minutes from `accepted_at` to cancel.
After that, the cancel button disappears. Admin can cancel at any stage with a
mandatory reason.

### Commission

Customer pays cash to partner on completion. Partner keeps 75%, SafaiNow takes
25%. Admin manually marks commission as collected.

## Partner App (Urdu RTL)

- `I18nManager.forceRTL(true)` on app start
- Noto Nastaliq Urdu font throughout
- All strings in Urdu — buttons, labels, notifications, error messages
- Stage progression buttons: پہنچ گیا (Reached) → کام مکمل (Completed) → کیش
  وصول (Cash Collected)

## Hard Rules (Never Break)

- **Never install BullMQ or Redis** before Sprint 5 (recurring bookings)
- **Never build a partner self-registration flow** — partners are admin-created
  only
- **Never add a payment gateway** — cash only for MVP
- **Never use floating React versions** like `^18.0.0` — always pin exactly
- **Never put React imports in shared packages**

## Spec Files

Full product spec lives in `docs/`. **Read all files in order before making any product decision or writing any feature code.**

| File                           | Contents                                         |
| ------------------------------ | ------------------------------------------------ |
| `docs/00-START-HERE.md`        | Instructions for Claude, rules before coding     |
| `docs/01-project-overview.md`  | Business model, the three players                |
| `docs/02-tech-stack.md`        | Stack, repo structure, React version strategy    |
| `docs/03-service-catalogue.md` | Services, packages, combination rules            |
| `docs/04-user-flows.md`        | Complete feature list for all three players      |
| `docs/05-job-lifecycle.md`     | Job statuses, matching logic, cancellation rules |
| `docs/06-admin-panel.md`       | Admin dashboard module breakdown                 |
| `docs/07-mvp-build-order.md`   | Sprint plan, out-of-scope items                  |

## Workflow Orchestration

This is a BINDING workflow. Every rule applies to every task. Saying "I'll follow it" without doing it is not acceptable.

### Step 0 — Session Start (Every Session)

Before doing ANYTHING:
1. Read `tasks/lessons.md` to recall all past corrections
2. Read `tasks/todo.md` to understand current progress
3. If a new feature: read all `docs/` spec files (00–07) in order

### Step 1 — Web Search First (No Exceptions)

Before writing ANY code or giving ANY command:
- Web search to verify latest syntax, versions, and patterns
- Applies to: every `npx`, `pnpm add`, `pnpm dlx`, CLI command, library usage, and API pattern
- Do NOT rely on training data alone — always cross-check with live sources
- Flag any discrepancies between training knowledge and current documentation

### Step 2 — Spawn Subagents for Research & Exploration

Before planning any non-trivial feature:
- Spawn a **research subagent** to look up latest patterns, docs, and versions
- Spawn an **explore subagent** to map the relevant codebase area
- Run both **in parallel** to keep main context clean
- One task per subagent — focused execution only
- Use subagents liberally for complex problems — throw more compute at it

### Step 3 — Plan Before Implementing

For ANY task with 3+ steps or architectural decisions:
- Use the `superpowers:writing-plans` skill to write a full implementation plan
- Save plan to `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`
- Plan must include: file map, exact code, exact commands, verification steps
- **Check in with user before starting implementation**
- If something goes sideways during execution: STOP and re-plan immediately

### Step 4 — Execute with Tracking

- Use `superpowers:executing-plans` or `superpowers:subagent-driven-development` to execute
- Mark each task `[x]` in the plan as it is completed
- Update `tasks/todo.md` to reflect current sprint progress
- Commit frequently — after each logical task

### Step 5 — Verify Before Done

- Never mark a task complete without proving it works
- Run type checks: `pnpm --filter <app> exec tsc --noEmit`
- Ask: "Would a staff engineer approve this?"
- Demonstrate correctness with logs, type checks, or manual test steps

### Step 6 — Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: implement the elegant solution instead
- Skip for simple, obvious fixes — don't over-engineer
- Simplicity First: make every change as minimal as possible

### Step 7 — Self-Improvement Loop

- After ANY correction from user: immediately update `tasks/lessons.md`
- Write a rule that prevents the exact same mistake
- Review `tasks/lessons.md` at every session start
- Never repeat a lesson already captured

### Step 8 — Autonomous Bug Fixing

- When given a bug: just fix it — no hand-holding required
- Diagnose from logs, errors, and type failures
- Never retry the same failing command — find root cause first

## Task Management

1. **Plan First**: Write plan to `docs/superpowers/plans/` using writing-plans skill
2. **Check In**: Present plan to user before implementing
3. **Track Progress**: Mark items complete in both plan file and `tasks/todo.md`
4. **Explain Changes**: High-level summary at each milestone
5. **Capture Lessons**: Update `tasks/lessons.md` after every correction

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal
  code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer
  standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid
  introducing bugs.
