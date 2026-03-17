import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
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

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: packages } = await supabase
    .from('packages')
    .select('id, name_en, type, price, is_active, created_at')
    .order('created_at', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Packages</h1>
        <Button asChild>
          <Link href="/dashboard/packages/new">Add Package</Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages && packages.length > 0 ? (
              packages.map((pkg) => (
                <TableRow key={pkg.id}>
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
                    <PackageActionsMenu
                      packageId={pkg.id}
                      isActive={pkg.is_active}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No packages yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
