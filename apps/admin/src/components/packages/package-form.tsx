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
