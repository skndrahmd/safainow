import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
          label="Created"
          value={new Date(partner.created_at).toLocaleDateString('en-PK', {
            dateStyle: 'long',
          })}
        />
      </div>

      {(partner.profile_picture_url || partner.cnic_picture_url) && (
        <div className="mt-6 flex gap-6">
          {partner.profile_picture_url && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Profile Picture</span>
              <div className="relative h-40 w-40 overflow-hidden rounded-md border bg-muted">
                <Image
                  src={partner.profile_picture_url}
                  alt="Profile picture"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}
          {partner.cnic_picture_url && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">CNIC Picture</span>
              <div className="relative h-40 w-64 overflow-hidden rounded-md border bg-muted">
                <Image
                  src={partner.cnic_picture_url}
                  alt="CNIC picture"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>
      )}

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
