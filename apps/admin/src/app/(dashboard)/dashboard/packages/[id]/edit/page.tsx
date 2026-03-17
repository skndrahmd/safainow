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
