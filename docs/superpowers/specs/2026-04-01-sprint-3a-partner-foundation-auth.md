# Sprint 3A — Partner App Foundation & Auth

## Context

The partner app is currently a bare-bones scaffold (no Expo Router, no screens, just dependencies). Sprint 3A sets up the foundation required by all subsequent partner app work: Expo Router with RTL/Urdu, the Noto Nastaliq Urdu font, and phone+passcode authentication backed by Supabase Auth.

This is a prerequisite for Sprint 3B (Matching Engine) and Sprint 3C (Incoming Job).

---

## Scope

**In scope:**
- Expo Router setup (file-based routing, typed routes, scheme)
- RTL layout enforced globally (`I18nManager.forceRTL`)
- Noto Nastaliq Urdu font loaded and available app-wide
- NativeWind + Metro monorepo config (partner app currently missing `metro.config.js`)
- Supabase client + AuthContext for partner sessions
- Login screen (phone + passcode, full Urdu UI)
- Stub tab screens: Jobs, History, Earnings
- API: `POST /partners/login` endpoint
- Admin app update: create/update Supabase Auth user on partner create/reset-passcode

**Out of scope (later sub-sprints):**
- FCM push notifications
- Job offer screen
- Active job screen
- Live location

---

## Auth Approach

Partners use **Supabase Auth** with a phone-derived fake email: `{phone}@safainow.local`.

**Login flow:**
1. Partner enters phone + 6-digit passcode in the app
2. App calls `POST /partners/login` on the Fastify API
3. API looks up partner by phone in `partners` table
4. `bcrypt.compare(passcode, partner.passcode_hash)` — if mismatch → 401
5. If `partner.is_active = false` → 403
6. API calls `supabase.auth.signInWithPassword({ email: \`${phone}@safainow.local\`, password: passcode })` using the **service role** client
7. Returns the full Supabase session to the app
8. App stores session via `expo-secure-store` (Supabase client handles this automatically)

**Admin app — partner creation:**
- After inserting the partner row, call `supabase.auth.admin.createUser({ email: \`${phone}@safainow.local\`, password: passcode, email_confirm: true })`
- Plain passcode is available at this point (before bcrypt hashing) — use it for the auth user password

**Admin app — passcode reset:**
- After updating `passcode_hash` in the partners table, call `supabase.auth.admin.updateUserById(authUserId, { password: newPlainPasscode })`
- Requires storing `auth_user_id` on the partners table (new migration)

---

## File Structure

```
apps/partner/
  app/
    _layout.tsx              ← root: font load, RTL, AuthProvider, session guard
    (auth)/
      _layout.tsx
      login.tsx              ← phone + passcode, full Urdu UI
    (app)/
      _layout.tsx            ← bottom tabs: Jobs, History, Earnings
      (jobs)/
        index.tsx            ← stub: "کوئی کام نہیں" placeholder
      history/
        index.tsx            ← stub: empty list placeholder
      earnings/
        index.tsx            ← stub: empty placeholder
  lib/
    supabase.ts              ← Supabase client (expo-secure-store adapter)
    auth.tsx                 ← AuthContext: session, loading, partner, signOut
  global.css                 ← @tailwind base/components/utilities
  metro.config.js            ← monorepo watchFolders + withNativeWind
  babel.config.js            ← already exists, correct
  tailwind.config.js         ← already exists, correct
  nativewind-env.d.ts        ← NativeWind type reference
```

---

## New DB Migration

```sql
-- Add auth_user_id to partners table for passcode reset
ALTER TABLE public.partners ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

---

## New Packages (partner app, installed via `expo install` for SDK 54 alignment)

- `expo-router` ~6.0.23 (already hoisted as peer dep, needs to be a direct dep)
- `expo-constants` ~18.0.13
- `expo-linking` ~8.0.11
- `expo-secure-store` ~15.0.8
- `expo-font` ~13.0.x
- `@expo/vector-icons` ~14.x

Already present (no change needed):
- `react-native-screens` ~4.16.0
- `react-native-safe-area-context` ~5.6.x

---

## API Endpoint

**`POST /partners/login`** (`apps/api/src/routes/partners/index.ts`)

```
Body: { phone: string, passcode: string }
Response 200: { session: SupabaseSession, partner: { id, name, phone, profile_picture_url } }
Response 401: { error: "INVALID_CREDENTIALS" }
Response 403: { error: "ACCOUNT_SUSPENDED" }
```

No JWT auth required on this route (it's the login endpoint).

---

## iOS Support

Keep iOS config in `app.json` for testing. Production deployment is Android-only.

---

## Verification

1. `pnpm --filter partner exec tsc --noEmit` — zero errors
2. `npx expo start --clear` in `apps/partner` — app loads in Expo Go
3. Login with a partner phone + passcode → session persists on app restart
4. Invalid passcode → error message shown in Urdu
5. Suspended partner → error message shown in Urdu
6. Admin creates new partner → auth user created in Supabase Auth dashboard
