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
