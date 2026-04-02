'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
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
import { reorderPackages } from '@/app/(dashboard)/dashboard/packages/actions'
import type { Enums } from '@safainow/types'

type Package = {
  id: string
  name_en: string
  type: Enums<'package_type'>
  price: number
  is_active: boolean
  sort_order: number
}

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

interface SortableRowProps {
  pkg: Package
}

function SortableRow({ pkg }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pkg.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-[40px]">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing hover:bg-muted rounded p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
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
        <PackageActionsMenu packageId={pkg.id} isActive={pkg.is_active} />
      </TableCell>
    </TableRow>
  )
}

interface PackagesSortableListProps {
  packages: Package[]
}

export function PackagesSortableList({ packages: initialPackages }: PackagesSortableListProps) {
  const [packages, setPackages] = useState(initialPackages)
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = packages.findIndex((p) => p.id === active.id)
    const newIndex = packages.findIndex((p) => p.id === over.id)

    const newPackages = arrayMove(packages, oldIndex, newIndex)
    setPackages(newPackages)

    // Persist the new order
    setIsSaving(true)
    try {
      const result = await reorderPackages(newPackages.map((p) => p.id))
      if ('error' in result && result.error) {
        // Revert on error
        setPackages(packages)
        console.error('Failed to save order:', result.error)
      }
    } catch (error) {
      // Revert on error
      setPackages(packages)
      console.error('Failed to save order:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.length > 0 ? (
              <SortableContext
                items={packages.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {packages.map((pkg) => (
                  <SortableRow key={pkg.id} pkg={pkg} />
                ))}
              </SortableContext>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No packages yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {isSaving && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Saving order...</span>
          </div>
        )}
      </div>
    </DndContext>
  )
}