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
