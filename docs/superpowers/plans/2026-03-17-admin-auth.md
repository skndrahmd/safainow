# Admin Auth Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement email/password authentication for the admin panel with protected routes, a login page, and session management using Supabase Auth + @supabase/ssr.

**Architecture:** Middleware intercepts all requests, refreshes Supabase auth tokens via cookies, and redirects unauthenticated users to `/login`. The login page uses a server action to sign in. All protected routes live under `/dashboard`.

**Tech Stack:** Next.js 16 App Router, @supabase/ssr, Supabase Auth, shadcn/ui (Button, Input, Label, Card), server actions, TypeScript.

---

## Current State

- `src/lib/supabase/client.ts` — browser client exists ✅
- `src/lib/supabase/server.ts` — server client exists ✅
- `src/app/page.tsx` — boilerplate, will be replaced with redirect
- `src/app/layout.tsx` — minimal, needs metadata update
- No middleware.ts ❌
- No login page ❌
- No dashboard route ❌
- shadcn components installed: `button` only

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/middleware.ts` | Create | Refresh tokens, redirect unauthed to /login |
| `src/lib/supabase/middleware.ts` | Create | createServerClient for middleware context |
| `src/app/(auth)/login/page.tsx` | Create | Login form UI |
| `src/app/(auth)/login/actions.ts` | Create | Server action: signInWithPassword |
| `src/app/(auth)/layout.tsx` | Create | Auth layout (centered, no nav) |
| `src/app/(dashboard)/layout.tsx` | Create | Dashboard layout (redirect if unauthed) |
| `src/app/(dashboard)/dashboard/page.tsx` | Create | Dashboard home placeholder |
| `src/app/page.tsx` | Modify | Redirect → /dashboard |
| `src/app/layout.tsx` | Modify | Update metadata title to "SafaiNow Admin" |
| `src/components/ui/input.tsx` | Create | shadcn Input component |
| `src/components/ui/label.tsx` | Create | shadcn Label component |
| `src/components/ui/card.tsx` | Create | shadcn Card component |

---

## Chunk 1: Middleware & Supabase Middleware Client

### Task 1: Create Supabase middleware client

**Files:**
- Create: `src/lib/supabase/middleware.ts`

- [ ] Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@safainow/types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: always use getUser() — never getSession() in server code
  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### Task 2: Create middleware.ts at src root

**Files:**
- Create: `src/middleware.ts`

- [ ] Create `src/middleware.ts`:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] Type check to verify no errors:
```bash
pnpm --filter admin exec tsc --noEmit
```
Expected: no output (clean)

- [ ] Commit:
```bash
git add apps/admin/src/middleware.ts apps/admin/src/lib/supabase/middleware.ts
git commit -m "feat(admin): add Supabase auth middleware for token refresh and route protection"
```

---

## Chunk 2: shadcn Components

### Task 3: Install required shadcn components

**Files:**
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/card.tsx`

- [ ] Install components via shadcn CLI from apps/admin:
```bash
cd apps/admin && pnpm dlx shadcn@latest add input label card
```

- [ ] Verify files were created:
```bash
ls apps/admin/src/components/ui/
```
Expected: `button.tsx  card.tsx  input.tsx  label.tsx`

- [ ] Commit:
```bash
git add apps/admin/src/components/ui/
git commit -m "feat(admin): add input, label, card shadcn components"
```

---

## Chunk 3: Auth Layout & Login Page

### Task 4: Create auth route group layout

**Files:**
- Create: `src/app/(auth)/layout.tsx`

- [ ] Create `src/app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      {children}
    </div>
  )
}
```

### Task 5: Create sign-in server action

**Files:**
- Create: `src/app/(auth)/login/actions.ts`

- [ ] Create `src/app/(auth)/login/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
```

### Task 6: Create login page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] Create `src/app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { signIn } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signIn(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>SafaiNow Admin</CardTitle>
        <CardDescription>Sign in to your admin account</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@safainow.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] Type check:
```bash
pnpm --filter admin exec tsc --noEmit
```
Expected: clean

- [ ] Commit:
```bash
git add apps/admin/src/app/\(auth\)/
git commit -m "feat(admin): add login page with email/password server action"
```

---

## Chunk 4: Dashboard Layout & Root Redirect

### Task 7: Create dashboard route group layout

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`

- [ ] Create `src/app/(dashboard)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
```

### Task 8: Create dashboard home placeholder

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] Create `src/app/(dashboard)/dashboard/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Signed in as {user?.email}
      </p>
    </main>
  )
}
```

### Task 9: Update root page to redirect

**Files:**
- Modify: `src/app/page.tsx`

- [ ] Replace `src/app/page.tsx` with a redirect:

```typescript
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/dashboard')
}
```

### Task 10: Update layout metadata

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] Update the metadata title in `src/app/layout.tsx`:

```typescript
export const metadata: Metadata = {
  title: 'SafaiNow Admin',
  description: 'SafaiNow platform management dashboard',
}
```

- [ ] Final type check across all apps:
```bash
pnpm --filter admin exec tsc --noEmit && pnpm --filter customer exec tsc --noEmit && pnpm --filter partner exec tsc --noEmit && pnpm --filter api exec tsc --noEmit
```
Expected: all clean

- [ ] Commit:
```bash
git add apps/admin/src/app/\(dashboard\)/ apps/admin/src/app/page.tsx apps/admin/src/app/layout.tsx
git commit -m "feat(admin): add dashboard layout, placeholder page, and root redirect"
```

---

## Verification Checklist

Before marking this complete:

- [ ] Visit `http://localhost:3000` → redirects to `/login`
- [ ] Visit `http://localhost:3000/dashboard` → redirects to `/login`
- [ ] Enter wrong credentials → shows error message below form
- [ ] Enter correct admin credentials → redirects to `/dashboard`
- [ ] Visit `http://localhost:3000/login` while logged in → redirects to `/dashboard`
- [ ] All 4 apps pass `tsc --noEmit` clean

---

## Notes

- Admin users must be created in Supabase Auth dashboard manually (or via Supabase CLI). No self-registration.
- Always use `supabase.auth.getUser()` in server code — never `getSession()` (per official Supabase docs)
- The `(auth)` and `(dashboard)` are Next.js route groups — they don't affect URL paths
- Sign-out will be added in a follow-up task as part of the nav/sidebar
