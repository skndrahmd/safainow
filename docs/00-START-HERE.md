# SafaiNow — Claude Code Instructions

## How to Use These Files

This folder contains all the context Claude Code needs to build SafaiNow. Read all files in order before writing any code.

## File Index

| File | Contents |
|---|---|
| `01-project-overview.md` | What SafaiNow is, the three players, business model |
| `02-tech-stack.md` | Full tech stack, repo structure, React version strategy |
| `03-service-catalogue.md` | Individual services, packages, combination rules |
| `04-user-flows.md` | Complete flow and feature list for all three players |
| `05-job-lifecycle.md` | Job statuses, matching logic, cancellation rules, feedback |
| `06-admin-panel.md` | Full admin dashboard module breakdown |
| `07-mvp-build-order.md` | Sprint plan, out of scope items, key technical decisions |

## Before Writing Any Code

1. Read all context files in this folder
2. Confirm the database schema before creating any tables
3. Follow the React version strategy in `02-tech-stack.md` strictly
4. Never install BullMQ or Redis for MVP — see `07-mvp-build-order.md`
5. Never build a partner self-registration flow — partners are admin-created only
6. Never add a payment gateway — cash only for MVP

## First Task

Scaffold the Turborepo monorepo with the following structure:

```
safainow/
├── apps/
│   ├── customer/        # React Native (Expo)
│   ├── partner/         # React Native (Expo)
│   ├── admin/           # Next.js
│   └── api/             # Node.js + Fastify
├── packages/
│   ├── types/           # Shared TypeScript types (React-free)
│   ├── validators/      # Shared Zod schemas (React-free)
│   ├── utils/           # Shared utility functions (React-free)
│   └── constants/       # Shared constants and enums (React-free)
├── turbo.json
├── package.json         # pnpm workspace root
└── pnpm-workspace.yaml
```

Use pnpm as the package manager. Pin React versions per app following the strategy in `02-tech-stack.md`. Shared packages must have zero React dependencies.
