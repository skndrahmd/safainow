# Services & Packages CRUD (Admin) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build individual services basket CRUD (inline row editing) and packages CRUD (dedicated pages, service checkbox multi-select) in the admin panel.

**Architecture:** Services use inline editing directly in each table row — no separate pages. A dialog handles creating new services. Packages have dedicated create/edit pages. The package form renders all active services as controlled checkboxes; selected IDs are appended to FormData on submit. Package ↔ service links live in the `package_services` junction table and are replaced wholesale on every update. All mutations go through Next.js server actions.

**Routing note:** All pages follow the `(dashboard)/dashboard/` prefix pattern → URLs `/dashboard/services`, `/dashboard/packages/*`.

**Tech Stack:** Next.js 16 App Router, Server Actions, @supabase/ssr, shadcn/ui (checkbox, select, textarea), TypeScript.

---

## Current State

- No services or packages pages exist ❌
- No RLS policies on `services`, `packages`, or `package_services` ❌
- Sidebar has Dashboard + Partners only ❌
- shadcn checkbox, select, textarea not installed ❌

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `supabase/migrations/20260317000005_services_packages_rls.sql` | Create | RLS policies — full access for authenticated users on services, packages, package_services |
| `apps/admin/src/components/layout/sidebar.tsx` | Modify | Add Services + Packages nav items |
| `apps/admin/src/app/(dashboard)/dashboard/services/actions.ts` | Create | createService, updateService, toggleServiceActive, deleteService |
| `apps/admin/src/app/(dashboard)/dashboard/services/page.tsx` | Create | Services list server component → `/dashboard/services` |
| `apps/admin/src/components/services/service-row.tsx` | Create | Single table row with inline edit mode (client component) |
| `apps/admin/src/components/services/add-service-dialog.tsx` | Create | Dialog for adding a new service (client component) |
| `apps/admin/src/app/(dashboard)/dashboard/packages/actions.ts` | Create | createPackage, updatePackage, togglePackageActive, deletePackage — manages package_services junction rows |
| `apps/admin/src/app/(dashboard)/dashboard/packages/page.tsx` | Create | Packages list server component → `/dashboard/packages` |
| `apps/admin/src/app/(dashboard)/dashboard/packages/new/page.tsx` | Create | Create package page → `/dashboard/packages/new` |
| `apps/admin/src/app/(dashboard)/dashboard/packages/[id]/edit/page.tsx` | Create | Edit package page → `/dashboard/packages/[id]/edit` |
| `apps/admin/src/components/packages/package-form.tsx` | Create | Shared create/edit form with controlled service checkbox multi-select (client component) |
| `apps/admin/src/components/packages/package-actions-menu.tsx` | Create | Row dropdown: edit / enable-disable / delete |

---

## Chunk 1: RLS + Sidebar + shadcn + Services CRUD

### Task 1: Add RLS policies

**Files:**
- Create: `supabase/migrations/20260317000005_services_packages_rls.sql`

- [ ] Create the migration file at `supabase/migrations/20260317000005_services_packages_rls.sql`:

```sql
-- Services, packages, and package_services are admin-managed.
-- The admin panel is a separate Next.js app. Customers and partners
-- use separate mobile apps with their own Supabase clients and never
-- reach these tables. "authenticated" here means the admin who logged
-- in via the admin login page — consistent with the partners table
-- policy in migration 20260317000004_admin_rls_policies.sql.

alter table services enable row level security;
alter table packages enable row level security;
alter table package_services enable row level security;

create policy "Authenticated users have full access to services"
on services for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users have full access to packages"
on packages for all
to authenticated
using (true)
with check (true);

create policy "Authenticated users have full access to package_services"
on package_services for all
to authenticated
using (true)
with check (true);
```

- [ ] Push the migration:

```bash
supabase db push
```

Expected: `Finished supabase db push.`

---

### Task 2: Update sidebar nav

**Files:**
- Modify: `apps/admin/src/components/layout/sidebar.tsx`

- [ ] Read the current file, then replace `navItems`:

```typescript
const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/partners', label: 'Partners' },
  { href: '/dashboard/services', label: 'Services' },
  { href: '/dashboard/packages', label: 'Packages' },
]
```

---

### Task 3: Install shadcn checkbox, select, textarea

- [ ] Install from `apps/admin` directory:

```bash
cd apps/admin && pnpm dlx shadcn@latest add checkbox select textarea
```

Expected: Created `src/components/ui/checkbox.tsx`, `src/components/ui/select.tsx`, `src/components/ui/textarea.tsx`

---

### Task 4: Create service server actions

**Files:**
- Create: `apps/admin/src/app/(dashboard)/dashboard/services/actions.ts`

- [ ] Create `apps/admin/src/app/(dashboard)/dashboard/services/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createService(formData: FormData) {
  const supabase = await createClient()

  const name_en = formData.get('name_en') as string
  const name_ur = formData.get('name_ur') as string
  const price = parseFloat(formData.get('price') as string)

  const { error } = await supabase
    .from('services')
    .insert({ name_en, name_ur, price })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient()

  const name_en = formData.get('name_en') as string
  const name_ur = formData.get('name_ur') as string
  const price = parseFloat(formData.get('price') as string)

  const { error } = await supabase
    .from('services')
    .update({ name_en, name_ur, price })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function toggleServiceActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('services')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/services')
  return { success: true }
}

export async function deleteService(id: string) {
  const supabase = await createClient()

  // package_services rows cascade automatically.
  // Confirmed: migration 20260317000002_schema_gaps.sql defines
  // package_services.service_id with `references services (id) on delete cascade`
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/services')
  return { success: true }
}
```

---

### Task 5: Create ServiceRow component (inline edit)

**Files:**
- Create: `apps/admin/src/components/services/service-row.tsx`

The `AlertDialog` is controlled via state (not `AlertDialogTrigger`) to avoid nesting it inside a `<tr>` element.

- [ ] Create `apps/admin/src/components/services/service-row.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { Pencil, Check, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  updateService,
  toggleServiceActive,
  deleteService,
} from '@/app/(dashboard)/dashboard/services/actions'
import type { Tables } from '@safainow/types'

type Service = Tables<'services'>

export function ServiceRow({ service }: { service: Service }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleUpdate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateService(service.id, formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  function handleToggle() {
    startTransition(async () => {
      await toggleServiceActive(service.id, !service.is_active)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteService(service.id)
      setShowDeleteDialog(false)
    })
  }

  if (isEditing) {
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <form action={handleUpdate} className="flex items-center gap-2">
            <Input
              name="name_en"
              defaultValue={service.name_en}
              required
              placeholder="English name"
              className="flex-1"
              autoFocus
            />
            <Input
              name="name_ur"
              defaultValue={service.name_ur}
              required
              placeholder="Urdu name"
              className="flex-1 text-right"
              dir="rtl"
            />
            <Input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={service.price}
              required
              placeholder="Price (Rs)"
              className="w-32"
            />
            {error && <span className="text-sm text-destructive">{error}</span>}
            <Button type="submit" size="icon" variant="ghost" disabled={isPending} aria-label="Save">
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => { setIsEditing(false); setError(null) }}
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      <TableRow className={!service.is_active ? 'opacity-50' : undefined}>
        <TableCell className="font-medium">{service.name_en}</TableCell>
        <TableCell className="text-right" dir="rtl">{service.name_ur}</TableCell>
        <TableCell>Rs {Number(service.price).toLocaleString()}</TableCell>
        <TableCell>
          <Badge variant={service.is_active ? 'default' : 'secondary'}>
            {service.is_active ? 'Active' : 'Disabled'}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsEditing(true)}
              disabled={isPending}
              aria-label="Edit service"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={isPending}
            >
              {service.is_active ? 'Disable' : 'Enable'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() => setShowDeleteDialog(true)}
              aria-label="Delete service"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{service.name_en}&rdquo; will be permanently deleted and
              automatically removed from all packages that include it.
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
    </>
  )
}
```

---

### Task 6: Create AddServiceDialog component

**Files:**
- Create: `apps/admin/src/components/services/add-service-dialog.tsx`

- [ ] Create `apps/admin/src/components/services/add-service-dialog.tsx`:

```typescript
'use client'

import { useState, useTransition, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createService } from '@/app/(dashboard)/dashboard/services/actions'

export function AddServiceDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createService(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Service</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name_en">English Name</Label>
            <Input
              id="name_en"
              name="name_en"
              required
              placeholder="e.g. Brooming"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name_ur">Urdu Name</Label>
            <Input
              id="name_ur"
              name="name_ur"
              required
              placeholder="جھاڑو دینا"
              dir="rtl"
              className="text-right"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">Price (Rs)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Adding…' : 'Add Service'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

---

### Task 7: Create services list page

**Files:**
- Create: `apps/admin/src/app/(dashboard)/dashboard/services/page.tsx`

- [ ] Create `apps/admin/src/app/(dashboard)/dashboard/services/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ServiceRow } from '@/components/services/service-row'
import { AddServiceDialog } from '@/components/services/add-service-dialog'

export default async function ServicesPage() {
  const supabase = await createClient()
  // select('*') returns all columns including is_active, needed by ServiceRow
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('name_en', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Individual services that make up packages. Click the pencil icon to edit inline.
          </p>
        </div>
        <AddServiceDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>English Name</TableHead>
              <TableHead className="text-right">Urdu Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {services && services.length > 0 ? (
              services.map((service) => (
                <ServiceRow key={service.id} service={service} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No services yet. Add one to get started.
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

- [ ] Type check:

```bash
pnpm --filter admin exec tsc --noEmit
```

Expected: clean

- [ ] Commit:

```bash
git add supabase/migrations/20260317000005_services_packages_rls.sql \
  apps/admin/src/components/layout/sidebar.tsx \
  apps/admin/src/components/ui/checkbox.tsx \
  apps/admin/src/components/ui/select.tsx \
  apps/admin/src/components/ui/textarea.tsx \
  "apps/admin/src/app/(dashboard)/dashboard/services/" \
  apps/admin/src/components/services/
git commit -m "feat(admin): add services CRUD with inline editing"
```

---

## Chunk 2: Packages CRUD

### Task 8: Create package server actions

**Files:**
- Create: `apps/admin/src/app/(dashboard)/dashboard/packages/actions.ts`

- [ ] Create `apps/admin/src/app/(dashboard)/dashboard/packages/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Enums } from '@safainow/types'

export async function createPackage(formData: FormData) {
  const supabase = await createClient()

  const name_en = formData.get('name_en') as string
  const name_ur = formData.get('name_ur') as string
  const description_en = (formData.get('description_en') as string) || ''
  const description_ur = (formData.get('description_ur') as string) || ''
  const type = formData.get('type') as Enums<'package_type'>
  const price = parseFloat(formData.get('price') as string)
  const serviceIds = formData.getAll('service_ids') as string[]

  // Server-side guard: only one custom package may exist
  if (type === 'custom') {
    const { data: existing } = await supabase
      .from('packages')
      .select('id')
      .eq('type', 'custom')
      .maybeSingle()
    if (existing) return { error: 'A custom package already exists. Only one is allowed.' }
  }

  const { data, error } = await supabase
    .from('packages')
    .insert({ name_en, name_ur, description_en, description_ur, type, price })
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (serviceIds.length > 0) {
    const { error: linkError } = await supabase
      .from('package_services')
      .insert(serviceIds.map((service_id) => ({ package_id: data.id, service_id })))
    if (linkError) return { error: linkError.message }
  }

  revalidatePath('/dashboard/packages')
  redirect('/dashboard/packages')
}

export async function updatePackage(id: string, formData: FormData) {
  const supabase = await createClient()

  const name_en = formData.get('name_en') as string
  const name_ur = formData.get('name_ur') as string
  const description_en = (formData.get('description_en') as string) || ''
  const description_ur = (formData.get('description_ur') as string) || ''
  const type = formData.get('type') as Enums<'package_type'>
  const price = parseFloat(formData.get('price') as string)
  const serviceIds = formData.getAll('service_ids') as string[]

  const { error } = await supabase
    .from('packages')
    .update({ name_en, name_ur, description_en, description_ur, type, price })
    .eq('id', id)

  if (error) return { error: error.message }

  // Replace all service links wholesale.
  // Note: delete then re-insert is not atomic. If the insert fails, junction
  // rows are lost. Acceptable for MVP admin tooling — no customer-facing
  // data loss (bookings snapshot prices at creation time). A Supabase RPC
  // can be added if this proves problematic.
  await supabase.from('package_services').delete().eq('package_id', id)

  if (serviceIds.length > 0) {
    const { error: linkError } = await supabase
      .from('package_services')
      .insert(serviceIds.map((service_id) => ({ package_id: id, service_id })))
    if (linkError) return { error: linkError.message }
  }

  revalidatePath('/dashboard/packages')
  redirect('/dashboard/packages')
}

export async function togglePackageActive(id: string, isActive: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('packages')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/packages')
  return { success: true }
}

export async function deletePackage(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('packages')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/packages')
  return { success: true }
}
```

---

### Task 9: Create PackageActionsMenu component

**Files:**
- Create: `apps/admin/src/components/packages/package-actions-menu.tsx`

- [ ] Create `apps/admin/src/components/packages/package-actions-menu.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
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
} from '@/components/ui/alert-dialog'
import { togglePackageActive, deletePackage } from '@/app/(dashboard)/dashboard/packages/actions'

interface PackageActionsMenuProps {
  packageId: string
  isActive: boolean
}

export function PackageActionsMenu({ packageId, isActive }: PackageActionsMenuProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  function handleToggleActive() {
    startTransition(async () => {
      await togglePackageActive(packageId, !isActive)
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deletePackage(packageId)
      setShowDeleteDialog(false)
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/packages/${packageId}/edit`)}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive}>
            {isActive ? 'Disable' : 'Enable'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete package?</AlertDialogTitle>
            <AlertDialogDescription>
              This package will be permanently deleted. Existing bookings are not
              affected — prices are snapshotted at booking time.
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
    </>
  )
}
```

---

### Task 10: Create packages list page

**Files:**
- Create: `apps/admin/src/app/(dashboard)/dashboard/packages/page.tsx`

- [ ] Create `apps/admin/src/app/(dashboard)/dashboard/packages/page.tsx`:

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
import { PackageActionsMenu } from '@/components/packages/package-actions-menu'

const TYPE_LABELS: Record<string, string> = {
  cleaning: 'Cleaning',
  standalone: 'Standalone',
  custom: 'Custom',
}

const TYPE_COLORS: Record<string, string> = {
  cleaning: 'bg-blue-100 text-blue-800',
  standalone: 'bg-purple-100 text-purple-800',
  custom: 'bg-orange-100 text-orange-800',
}

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: packages } = await supabase
    .from('packages')
    .select('id, name_en, type, price, is_active, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Packages</h1>
        <Button asChild>
          <Link href="/dashboard/packages/new">Add Package</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages && packages.length > 0 ? (
              packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.name_en}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[pkg.type] ?? ''}`}
                    >
                      {TYPE_LABELS[pkg.type] ?? pkg.type}
                    </span>
                  </TableCell>
                  <TableCell>Rs {Number(pkg.price).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                      {pkg.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <PackageActionsMenu
                      packageId={pkg.id}
                      isActive={pkg.is_active}
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
                  No packages yet. Add one to get started.
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

---

### Task 11: Create PackageForm component

**Files:**
- Create: `apps/admin/src/components/packages/package-form.tsx`

**Important:** The shadcn `Checkbox` (Radix UI) does not reliably submit its `value` via native FormData. Service IDs are tracked in React state and appended to FormData in `handleSubmit`.

- [ ] Create `apps/admin/src/components/packages/package-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createPackage, updatePackage } from '@/app/(dashboard)/dashboard/packages/actions'
import type { Tables } from '@safainow/types'

type Package = Tables<'packages'>
type Service = Tables<'services'>

interface PackageFormProps {
  services: Service[]
  package?: Package & { service_ids: string[] }
  customPackageExists?: boolean
}

const TYPE_HINTS: Record<string, string> = {
  cleaning: 'Mutually exclusive — only one cleaning package per booking.',
  standalone: 'Can be combined alongside one cleaning package.',
  custom: 'Fully standalone. Only one custom package should exist in the system.',
}

export function PackageForm({ services, package: pkg, customPackageExists }: PackageFormProps) {
  const router = useRouter()
  const isEditing = !!pkg
  const [type, setType] = useState<string>(pkg?.type ?? 'cleaning')
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(
    new Set(pkg?.service_ids ?? [])
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function toggleService(id: string, checked: boolean) {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleSubmit(formData: FormData) {
    // Append controlled values that aren't native inputs
    formData.set('type', type)
    selectedServiceIds.forEach((id) => formData.append('service_ids', id))

    setLoading(true)
    setError(null)

    const result = isEditing
      ? await updatePackage(pkg.id, formData)
      : await createPackage(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
    // both actions redirect on success — no need to setLoading(false)
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name_en">English Name</Label>
          <Input
            id="name_en"
            name="name_en"
            defaultValue={pkg?.name_en ?? ''}
            required
            placeholder="Standard Cleaning"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name_ur">Urdu Name</Label>
          <Input
            id="name_ur"
            name="name_ur"
            defaultValue={pkg?.name_ur ?? ''}
            required
            placeholder="معیاری صفائی"
            dir="rtl"
            className="text-right"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description_en">Description (English)</Label>
        <Textarea
          id="description_en"
          name="description_en"
          defaultValue={pkg?.description_en ?? ''}
          placeholder="Shown on the customer app package detail page"
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description_ur">Description (Urdu)</Label>
        <Textarea
          id="description_ur"
          name="description_ur"
          defaultValue={pkg?.description_ur ?? ''}
          placeholder="کسٹمر ایپ پر دکھایا جاتا ہے"
          dir="rtl"
          className="text-right"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="standalone">Standalone</SelectItem>
              <SelectItem
                value="custom"
                disabled={customPackageExists && !isEditing}
              >
                Custom{customPackageExists && !isEditing ? ' (already exists)' : ''}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{TYPE_HINTS[type]}</p>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Price (Rs)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={pkg?.price ?? ''}
            required
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Label>Included Services</Label>
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active services available. Add services first.
          </p>
        ) : (
          <div className="rounded-md border divide-y max-h-72 overflow-y-auto">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedServiceIds.has(service.id)}
                  onCheckedChange={(checked) =>
                    toggleService(service.id, checked as boolean)
                  }
                />
                <span className="flex-1 text-sm">{service.name_en}</span>
                <span className="text-sm text-muted-foreground" dir="rtl">
                  {service.name_ur}
                </span>
                <span className="text-sm text-muted-foreground w-24 text-right">
                  Rs {Number(service.price).toLocaleString()}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? isEditing ? 'Saving…' : 'Creating…'
            : isEditing ? 'Save Changes' : 'Create Package'}
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

---

### Task 12: Create new package page and edit package page

**Files:**
- Create: `apps/admin/src/app/(dashboard)/dashboard/packages/new/page.tsx`
- Create: `apps/admin/src/app/(dashboard)/dashboard/packages/[id]/edit/page.tsx`

- [ ] Create `apps/admin/src/app/(dashboard)/dashboard/packages/new/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { PackageForm } from '@/components/packages/package-form'

export default async function NewPackagePage() {
  const supabase = await createClient()

  const [{ data: services }, { data: customPackage }] = await Promise.all([
    supabase.from('services').select('*').eq('is_active', true).order('name_en'),
    supabase.from('packages').select('id').eq('type', 'custom').maybeSingle(),
  ])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Add Package</h1>
      <PackageForm
        services={services ?? []}
        customPackageExists={!!customPackage}
      />
    </div>
  )
}
```

- [ ] Create `apps/admin/src/app/(dashboard)/dashboard/packages/[id]/edit/page.tsx`:

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PackageForm } from '@/components/packages/package-form'

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: pkg },
    { data: services },
    { data: packageServices },
    { data: otherCustomPackage },
  ] = await Promise.all([
    supabase.from('packages').select('*').eq('id', id).single(),
    supabase.from('services').select('*').eq('is_active', true).order('name_en'),
    supabase.from('package_services').select('service_id').eq('package_id', id),
    // Check if another custom package exists (excluding this one)
    supabase.from('packages').select('id').eq('type', 'custom').neq('id', id).maybeSingle(),
  ])

  if (!pkg) notFound()

  const service_ids = packageServices?.map((ps) => ps.service_id) ?? []

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Edit Package</h1>
      <PackageForm
        services={services ?? []}
        package={{ ...pkg, service_ids }}
        customPackageExists={!!otherCustomPackage}
      />
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
git add \
  "apps/admin/src/app/(dashboard)/dashboard/packages/" \
  apps/admin/src/components/packages/
git commit -m "feat(admin): add packages CRUD with service multi-select"
```

---

## Verification Checklist

Before marking complete:

- [ ] `/dashboard/services` loads — shows empty state or service list
- [ ] Click "Add Service" → dialog opens, fill in EN name, UR name, price → submits → row appears in list
- [ ] Click pencil on a row → row switches to input mode with current values pre-filled
- [ ] Edit name/price → click ✓ → row updates inline
- [ ] Click ✗ → edit cancelled, row unchanged
- [ ] Click "Disable" → badge changes to Disabled, row dims
- [ ] Click "Enable" → badge returns to Active
- [ ] Click trash → confirmation dialog → confirm → row removed
- [ ] Sidebar: Services link highlighted on `/dashboard/services`
- [ ] `/dashboard/packages` loads — shows empty state or package list
- [ ] Click "Add Package" → form loads at `/dashboard/packages/new`
- [ ] All 15 services visible as checkboxes (after seeding — see Notes)
- [ ] Select services, fill fields, choose type → submit → package appears in list with correct type badge
- [ ] Type hint text updates when type changes in Select
- [ ] Custom type option disabled if a custom package already exists
- [ ] Edit package → form pre-filled with correct services checked → save → redirects to list
- [ ] Enable/Disable from list row actions → badge updates
- [ ] Delete → confirmation dialog → confirm → row removed
- [ ] All 4 apps pass `tsc --noEmit`

---

## Notes

- **Seeding services:** The 15 services from `docs/03-service-catalogue.md` are not auto-seeded. After building this, add them manually via the admin UI or via a Supabase seed script.
- **Service deletion cascade:** `package_services` rows are removed automatically via `ON DELETE CASCADE` defined in `20260317000002_schema_gaps.sql`. No extra cleanup needed in `deleteService`.
- **Custom package guard:** The `custom` type option in the package form is disabled (not blocked at DB level) when another custom package already exists. The system allows only one per the spec.
- **`updatePackage` service replacement:** All `package_services` rows for a package are deleted and re-inserted on every edit. This is safe because `package_services` has no downstream references.
- **Package combination rules** are enforced on the frontend (customer app) and backend (API). This plan only covers admin management — enforcement logic lives in Sprint 2/3.
