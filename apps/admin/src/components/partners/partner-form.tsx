'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
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

interface ImageFieldProps {
  id: string
  name: string
  label: string
  existingUrl?: string | null
  existingFieldName: string
}

function ImageField({ id, name, label, existingUrl, existingFieldName }: ImageFieldProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    }
  }

  const displayUrl = preview ?? existingUrl

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {/* Hidden field carries existing URL so server action can keep it if no new file uploaded */}
      <input type="hidden" name={existingFieldName} value={existingUrl ?? ''} />
      <div className="flex items-center gap-3">
        {displayUrl && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted">
            <Image
              src={displayUrl}
              alt={label}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div className="flex flex-col gap-1 flex-1">
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {displayUrl ? 'Replace image' : 'Upload image'}
          </Button>
          {preview && (
            <span className="text-xs text-muted-foreground">New image selected</span>
          )}
          {!preview && existingUrl && (
            <span className="text-xs text-muted-foreground">Current image uploaded</span>
          )}
        </div>
      </div>
    </div>
  )
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

      <ImageField
        id="profile_picture"
        name="profile_picture"
        label="Profile Picture"
        existingUrl={partner?.profile_picture_url}
        existingFieldName="existing_profile_picture_url"
      />

      <ImageField
        id="cnic_picture"
        name="cnic_picture"
        label="CNIC Picture"
        existingUrl={partner?.cnic_picture_url}
        existingFieldName="existing_cnic_picture_url"
      />

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
