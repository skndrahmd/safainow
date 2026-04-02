import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PackagesSortableList } from '@/components/packages/packages-sortable-list'

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: packages } = await supabase
    .from('packages')
    .select('id, name_en, type, price, is_active, sort_order')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Packages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag and drop to reorder how packages appear in the customer app
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/packages/new">Add Package</Link>
        </Button>
      </div>

      <PackagesSortableList packages={packages ?? []} />
    </div>
  )
}