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
