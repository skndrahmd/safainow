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
