# SafaiNow — Tech Stack & Project Setup

## Monorepo & Tooling

| Tool | Choice |
|---|---|
| Monorepo Manager | Turborepo |
| Package Manager | pnpm |
| Language | TypeScript throughout |

## Repo Structure

```
safainow/
├── apps/
│   ├── customer/        # React Native (Expo) — English
│   ├── partner/         # React Native (Expo) — Urdu RTL
│   ├── admin/           # Next.js
│   └── api/             # Node.js + Fastify
├── packages/
│   ├── types/           # Shared TypeScript types
│   ├── validators/      # Shared Zod schemas
│   ├── utils/           # Shared utility functions
│   └── constants/       # Shared constants & enums
├── turbo.json
├── package.json
└── README.md
```

## App Stack

| App | Technology | Language | Notes |
|---|---|---|---|
| Customer App | React Native (Expo) | English | Pinned to Expo SDK React version |
| Partner App | React Native (Expo) | Urdu (RTL) | Noto Nastaliq Urdu font, `I18nManager.forceRTL(true)` |
| Admin Dashboard | Next.js | English | Pinned to Next.js React version; Onest font (light 300 / medium 500) |
| Backend API | Node.js + Fastify | — | REST API |

## Infrastructure & Services

| Layer | Technology | Purpose |
|---|---|---|
| Database | Supabase (PostgreSQL) | Primary database |
| Geo Queries | PostGIS | Radius-based partner matching |
| Auth | Supabase Auth | Email/password + Google OAuth |
| Realtime | Supabase Realtime | Live location, job status updates |
| Push Notifications | Expo Push Service | Job alerts, status updates |
| Maps | Google Maps SDK | Live location, address search |
| File Storage | Supabase Storage | Profile pictures, CNIC images |

## React Version Strategy (Critical)

This is a known pain point in React Native + Next.js monorepos. Follow these rules strictly:

### Rules
1. **Shared packages are React-free** — pure TypeScript only, no JSX, no hooks, no React imports
2. **Each app pins its own React version** — never use floating versions like `^18.0.0`
3. **Use pnpm** — it isolates `node_modules` per app, preventing version conflicts
4. **Mobile apps follow Expo SDK compatibility table exactly** — check expo.dev/changelog before starting

### Version Pinning Example
```json
// apps/customer/package.json and apps/partner/package.json
// Pin to whatever the current Expo SDK requires
{
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.76.0"
  }
}

// apps/admin/package.json
// Pin to whatever the current Next.js version requires
{
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0"
  }
}
```

### If a shared package ever needs React
Use `peerDependencies` with a range, never a direct dependency:
```json
{
  "peerDependencies": {
    "react": ">=18.0.0"
  }
}
```

## Deferred to Post-MVP (Do Not Build Yet)

| Technology | Purpose | When |
|---|---|---|
| BullMQ + Redis | Recurring booking scheduler | v1.1 |
| Star ratings & reviews | Full review system | v1.1 |
| SMS / WhatsApp notifications | Additional channels | v1.1 |
| Referral / promo codes | Growth features | v1.1 |
| Online payments | Payment gateway | v1.1 |
