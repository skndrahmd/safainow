# Admin Partner Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full partner CRUD in the admin panel — list, create (with auto-generated 6-digit passcode shown once), edit, suspend/reactivate, and delete.

**Architecture:** All data mutations use Next.js server actions backed by the Supabase server client. Partner creation generates a random 6-digit numeric passcode, bcrypt-hashes it for storage, and returns the plain passcode to a client-side modal (shown once). The dashboard layout gains a minimal sidebar for navigation. List and detail pages are server components; forms and the passcode modal are client components.

**Routing note:** The existing dashboard page lives at `src/app/(dashboard)/dashboard/page.tsx` → URL `/dashboard`. All protected pages follow this pattern — they live under `(dashboard)/dashboard/` so their URLs are `/dashboard/*`. The route group `(dashboard)` is transparent to the URL.

**Tech Stack:** Next.js 16 App Router, Server Actions, @supabase/ssr, bcryptjs, shadcn/ui (badge, table, dialog, alert-dialog, dropdown-menu), TypeScript.

---

## Current State

- `src/app/(dashboard)/layout.tsx` — exists, no sidebar ✅
- `src/app/(dashboard)/dashboard/page.tsx` — placeholder at `/dashboard` ✅
- `src/components/ui/` — button, card, input, label installed ✅
- No partner pages, no server actions, no bcryptjs ❌

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/components/ui/badge.tsx` | Create | shadcn Badge |
| `src/components/ui/dialog.tsx` | Create | shadcn Dialog |
| `src/components/ui/table.tsx` | Create | shadcn Table |
| `src/components/ui/alert-dialog.tsx` | Create | shadcn AlertDialog |
| `src/components/ui/dropdown-menu.tsx` | Create | shadcn DropdownMenu |
| `src/components/layout/sidebar.tsx` | Create | Dashboard sidebar nav links |
| `src/app/(dashboard)/layout.tsx` | Modify | Wrap children with sidebar |
| `src/app/(dashboard)/dashboard/partners/page.tsx` | Create | Partners list (server component) → URL `/dashboard/partners` |
| `supabase/migrations/20260317000003_partner_assets_storage.sql` | Create | `partner-assets` storage bucket + RLS policies (authenticated upload, public read) |
| `src/app/(dashboard)/dashboard/partners/actions.ts` | Create | createPartner, updatePartner, toggleActive, deletePartner, resetPasscode — uploads images to Supabase Storage |
| `src/app/(dashboard)/dashboard/partners/new/page.tsx` | Create | Create partner page → URL `/dashboard/partners/new` |
| `src/app/(dashboard)/dashboard/partners/[id]/page.tsx` | Create | Partner detail page → URL `/dashboard/partners/[id]` |
| `src/app/(dashboard)/dashboard/partners/[id]/edit/page.tsx` | Create | Edit partner page → URL `/dashboard/partners/[id]/edit` |
| `src/components/partners/partner-form.tsx` | Create | Shared create/edit form (client) — file pickers for profile + CNIC images, thumbnail preview on edit |
| `src/components/partners/passcode-modal.tsx` | Create | One-time passcode display modal |
| `src/components/partners/partner-actions-menu.tsx` | Create | Row action dropdown (suspend/delete/reset) |
| `src/components/partners/reset-passcode-button.tsx` | Create | Reset passcode + display modal |

---

## Chunk 1: shadcn Components + Sidebar + Dashboard Layout

### Task 1: Install shadcn components

**Files:**
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/table.tsx`
- Create: `src/components/ui/alert-dialog.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`

- [ ] Install components from apps/admin directory:
```bash
cd apps/admin && pnpm dlx shadcn@latest add badge dialog table alert-dialog dropdown-menu
```

- [ ] Verify all 5 files exist:
```bash
ls apps/admin/src/components/ui/
```
Expected: `alert-dialog.tsx  badge.tsx  button.tsx  card.tsx  dialog.tsx  dropdown-menu.tsx  input.tsx  label.tsx  table.tsx`

### Task 2: Create sidebar nav component

**Files:**
- Create: `src/components/layout/sidebar.tsx`

- [ ] Create `src/components/layout/sidebar.tsx`:

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/partners', label: 'Partners' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r bg-background" aria-label="Sidebar navigation">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold text-sm">SafaiNow Admin</span>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                isActive
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

### Task 3: Update dashboard layout to include sidebar

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] Replace `src/app/(dashboard)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
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
git add apps/admin/src/components/ui/ apps/admin/src/components/layout/ apps/admin/src/app/\(dashboard\)/layout.tsx
git commit -m "feat(admin): add shadcn components and dashboard sidebar nav"
```

---

## Chunk 2: Partner Server Actions + List Page

### Task 4: Install bcryptjs

**Files:** none (dependency only)

- [ ] Install bcryptjs:
```bash
pnpm --filter admin add bcryptjs
pnpm --filter admin add -D @types/bcryptjs
```

### Task 5: Create partner server actions

**Files:**
- Create: `src/app/(dashboard)/dashboard/partners/actions.ts`

- [ ] Create `src/app/(dashboard)/dashboard/partners/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'

function generatePasscode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createPartner(formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const cnicNumber = formData.get('cnic_number') as string | null
  const profilePictureUrl = formData.get('profile_picture_url') as string | null
  const cnicPictureUrl = formData.get('cnic_picture_url') as string | null

  const passcode = generatePasscode()
  const passcodeHash = await bcrypt.hash(passcode, 12)

  const { data, error } = await supabase
    .from('partners')
    .insert({
      full_name: fullName,
      phone,
      passcode_hash: passcodeHash,
      cnic_number: cnicNumber || null,
      profile_picture_url: profilePictureUrl || null,
      cnic_picture_url: cnicPictureUrl || null,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  return { partnerId: data.id, passcode }
}

export async function updatePartner(id: string, formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const cnicNumber = formData.get('cnic_number') as string | null
  const profilePictureUrl = formData.get('profile_picture_url') as string | null
  const cnicPictureUrl = formData.get('cnic_picture_url') as string | null

  const { error } = await supabase
    .from('partners')
    .update({
      full_name: fullName,
      phone,
      cnic_number: cnicNumber || null,
      profile_picture_url: profilePictureUrl || null,
      cnic_picture_url: cnicPictureUrl || null,
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  revalidatePath(`/dashboard/partners/${id}`)
  redirect(`/dashboard/partners/${id}`)
}

export async function togglePartnerActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('partners')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  revalidatePath(`/dashboard/partners/${id}`)
  return { success: true }
}

export async function deletePartner(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/partners')
  redirect('/dashboard/partners')
}

export async function resetPasscode(id: string) {
  const supabase = await createClient()

  const passcode = generatePasscode()
  const passcodeHash = await bcrypt.hash(passcode, 12)

  const { error } = await supabase
    .from('partners')
    .update({ passcode_hash: passcodeHash })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/dashboard/partners/${id}`)
  return { passcode }
}
```

### Task 6: Create partners list page

**Files:**
- Create: `src/app/(dashboard)/dashboard/partners/page.tsx`

- [ ] Create `src/app/(dashboard)/dashboard/partners/page.tsx`:

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PartnerActionsMenu } from '@/components/partners/partner-actions-menu'

export default async function PartnersPage() {
  const supabase = await createClient()
  const { data: partners } = await supabase
    .from('partners')
    .select('id, full_name, phone, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Partners</h1>
        <Button asChild>
          <Link href="/dashboard/partners/new">Add Partner</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners && partners.length > 0 ? (
              partners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/partners/${partner.id}`}
                      className="font-medium hover:underline"
                    >
                      {partner.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {partner.phone}
                  </TableCell>
                  <TableCell>
                    <Badge variant={partner.is_active ? 'default' : 'secondary'}>
                      {partner.is_active ? 'Active' : 'Suspended'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(partner.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <PartnerActionsMenu
                      partnerId={partner.id}
                      isActive={partner.is_active}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No partners yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

### Task 7: Create partner actions menu component

**Files:**
- Create: `src/components/partners/partner-actions-menu.tsx`

- [ ] Create `src/components/partners/partner-actions-menu.tsx`:

```typescript
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { togglePartnerActive, deletePartner } from '@/app/(dashboard)/dashboard/partners/actions'

interface PartnerActionsMenuProps {
  partnerId: string
  isActive: boolean
}

export function PartnerActionsMenu({ partnerId, isActive }: PartnerActionsMenuProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleToggleActive() {
    startTransition(async () => {
      await togglePartnerActive(partnerId, !isActive)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePartner(partnerId)
    })
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/partners/${partnerId}/edit`)}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive}>
            {isActive ? 'Suspend' : 'Reactivate'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete partner?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The partner record and all associated
            data will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
git add apps/admin/src/app/\(dashboard\)/dashboard/partners/ apps/admin/src/components/partners/partner-actions-menu.tsx
git commit -m "feat(admin): add partner list page with actions menu"
```

---

## Chunk 3: Create Partner Form + Passcode Modal

### Task 8: Create passcode modal component

**Files:**
- Create: `src/components/partners/passcode-modal.tsx`

- [ ] Create `src/components/partners/passcode-modal.tsx`:

```typescript
'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PasscodeModalProps {
  passcode: string
  partnerId: string
}

export function PasscodeModal({ passcode, partnerId }: PasscodeModalProps) {
  const router = useRouter()

  function handleDismiss() {
    router.push(`/dashboard/partners/${partnerId}`)
  }

  return (
    <Dialog open onOpenChange={handleDismiss}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Partner Passcode</DialogTitle>
          <DialogDescription>
            Save this passcode and share it with the partner via call or WhatsApp.
            It will <strong>not</strong> be shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center rounded-md border bg-muted py-6">
          <span className="text-4xl font-mono font-bold tracking-[0.3em]">
            {passcode}
          </span>
        </div>
        <DialogFooter>
          <Button onClick={handleDismiss} className="w-full">
            I've saved the passcode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Task 9: Create partner form component

**Files:**
- Create: `src/components/partners/partner-form.tsx`

- [ ] Create `src/components/partners/partner-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasscodeModal } from './passcode-modal'
import { createPartner, updatePartner } from '@/app/(dashboard)/dashboard/partners/actions'
import type { Tables } from '@safainow/types'

type Partner = Tables<'partners'>

interface PartnerFormProps {
  partner?: Partner
}

export function PartnerForm({ partner }: PartnerFormProps) {
  const router = useRouter()
  const isEditing = !!partner
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [newPartner, setNewPartner] = useState<{ id: string; passcode: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    if (isEditing) {
      const result = await updatePartner(partner.id, formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
      // updatePartner redirects on success
    } else {
      const result = await createPartner(formData)
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      } else if (result?.passcode && result?.partnerId) {
        setNewPartner({ id: result.partnerId, passcode: result.passcode })
      }
    }
  }

  if (newPartner) {
    return <PasscodeModal passcode={newPartner.passcode} partnerId={newPartner.id} />
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <div className="flex flex-col gap-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={partner?.full_name ?? ''}
          required
          placeholder="Muhammad Ali"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          defaultValue={partner?.phone ?? ''}
          required
          placeholder="03001234567"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cnic_number">CNIC Number</Label>
        <Input
          id="cnic_number"
          name="cnic_number"
          defaultValue={partner?.cnic_number ?? ''}
          placeholder="12345-1234567-1"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile_picture_url">Profile Picture URL</Label>
        <Input
          id="profile_picture_url"
          name="profile_picture_url"
          defaultValue={partner?.profile_picture_url ?? ''}
          placeholder="https://..."
          type="url"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cnic_picture_url">CNIC Picture URL</Label>
        <Input
          id="cnic_picture_url"
          name="cnic_picture_url"
          defaultValue={partner?.cnic_picture_url ?? ''}
          placeholder="https://..."
          type="url"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? isEditing ? 'Saving…' : 'Creating…'
            : isEditing ? 'Save Changes' : 'Create Partner'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

### Task 10: Create new partner page

**Files:**
- Create: `src/app/(dashboard)/dashboard/partners/new/page.tsx`

- [ ] Create `src/app/(dashboard)/dashboard/partners/new/page.tsx`:

```typescript
import { PartnerForm } from '@/components/partners/partner-form'

export default function NewPartnerPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Add Partner</h1>
      <PartnerForm />
    </div>
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
git add apps/admin/src/components/partners/ apps/admin/src/app/\(dashboard\)/dashboard/partners/new/
git commit -m "feat(admin): add create partner form with one-time passcode modal"
```

---

## Chunk 4: Partner Detail Page + Edit Page + Reset Passcode

### Task 11: Create partner detail page

**Files:**
- Create: `src/app/(dashboard)/dashboard/partners/[id]/page.tsx`

- [ ] Create `src/app/(dashboard)/dashboard/partners/[id]/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResetPasscodeButton } from '@/components/partners/reset-passcode-button'

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id)
    .single()

  if (!partner) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{partner.full_name}</h1>
          <Badge variant={partner.is_active ? 'default' : 'secondary'}>
            {partner.is_active ? 'Active' : 'Suspended'}
          </Badge>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/partners/${id}/edit`}>Edit</Link>
        </Button>
      </div>

      <div className="rounded-md border divide-y">
        <DetailRow label="Phone" value={partner.phone} />
        <DetailRow label="CNIC" value={partner.cnic_number ?? '—'} />
        <DetailRow
          label="Profile Picture"
          value={partner.profile_picture_url ?? '—'}
        />
        <DetailRow
          label="CNIC Picture"
          value={partner.cnic_picture_url ?? '—'}
        />
        <DetailRow
          label="Created"
          value={new Date(partner.created_at).toLocaleDateString('en-PK', {
            dateStyle: 'long',
          })}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <ResetPasscodeButton partnerId={id} />
        <Button asChild variant="outline">
          <Link href="/dashboard/partners">← Back to Partners</Link>
        </Button>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex px-4 py-3">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
```

### Task 12: Create reset passcode button component

**Files:**
- Create: `src/components/partners/reset-passcode-button.tsx`

- [ ] Create `src/components/partners/reset-passcode-button.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resetPasscode } from '@/app/(dashboard)/dashboard/partners/actions'

export function ResetPasscodeButton({ partnerId }: { partnerId: string }) {
  const [isPending, startTransition] = useTransition()
  const [passcode, setPasscode] = useState<string | null>(null)

  function handleReset() {
    startTransition(async () => {
      const result = await resetPasscode(partnerId)
      if (result?.passcode) {
        setPasscode(result.passcode)
      }
    })
  }

  return (
    <>
      <Button variant="outline" onClick={handleReset} disabled={isPending}>
        {isPending ? 'Resetting…' : 'Reset Passcode'}
      </Button>

      <Dialog open={!!passcode} onOpenChange={() => setPasscode(null)}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>New Passcode</DialogTitle>
            <DialogDescription>
              Share this passcode with the partner. It will{' '}
              <strong>not</strong> be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center rounded-md border bg-muted py-6">
            <span className="text-4xl font-mono font-bold tracking-[0.3em]">
              {passcode}
            </span>
          </div>
          <DialogFooter>
            <Button onClick={() => setPasscode(null)} className="w-full">
              I've saved the passcode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### Task 13: Create edit partner page

**Files:**
- Create: `src/app/(dashboard)/dashboard/partners/[id]/edit/page.tsx`

- [ ] Create `src/app/(dashboard)/dashboard/partners/[id]/edit/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PartnerForm } from '@/components/partners/partner-form'

export default async function EditPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('id', id)
    .single()

  if (!partner) notFound()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Edit Partner</h1>
      <PartnerForm partner={partner} />
    </div>
  )
}
```

- [ ] Final type check:
```bash
pnpm --filter admin exec tsc --noEmit
```
Expected: clean

- [ ] Commit:
```bash
git add apps/admin/src/app/\(dashboard\)/dashboard/partners/\[id\]/ apps/admin/src/components/partners/reset-passcode-button.tsx
git commit -m "feat(admin): add partner detail, edit, and reset passcode pages"
```

---

## Verification Checklist

Before marking complete:

- [ ] Visit `/dashboard/partners` → shows empty state or partner list
- [ ] "Partners" sidebar link is highlighted when on `/dashboard/partners` or any sub-page
- [ ] Click "Add Partner" → form loads at `/dashboard/partners/new`
- [ ] Submit with valid data → passcode modal appears with 6-digit code, cannot be dismissed by clicking outside
- [ ] Click "I've saved the passcode" → redirected to partner detail page
- [ ] Partner detail shows all fields correctly
- [ ] Click "Edit" → form pre-filled, save redirects back to detail
- [ ] Row actions → Edit / Suspend / Delete options appear
- [ ] Suspend → badge changes to "Suspended"
- [ ] Reactivate → badge returns to "Active"
- [ ] Delete → confirmation dialog appears; confirm removes partner and redirects to list
- [ ] Reset Passcode → modal shows new 6-digit code, cannot close by clicking outside
- [ ] All 4 apps pass `tsc --noEmit`

---

## Notes

- Profile and CNIC pictures use file upload via Supabase Storage (`partner-assets` bucket, public). Files are stored under `profile/` and `cnic/` prefixes. The public URL is persisted in the DB. On edit, existing URLs are preserved via hidden inputs unless a new file is selected.
- bcrypt salt rounds set to 12 — appropriate for server-side hashing, not edge runtime.
- `generatePasscode()` uses `Math.random()` which is sufficient for a manually-shared passcode. Upgrade to `crypto.randomInt` if needed.
- Partner detail stats (job history, earnings, feedback rate) are deferred to Sprint 4 per the build order.
