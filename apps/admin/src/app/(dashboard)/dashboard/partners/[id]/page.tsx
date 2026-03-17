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
