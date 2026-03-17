import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ServiceRow } from '@/components/services/service-row'
import { AddServiceDialog } from '@/components/services/add-service-dialog'

export default async function ServicesPage() {
  // select('*') returns all columns including is_active, needed by ServiceRow
  const supabase = await createClient()
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .order('name_en', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Individual services that make up packages. Click the pencil icon to edit inline.
          </p>
        </div>
        <AddServiceDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>English Name</TableHead>
              <TableHead className="text-right">Urdu Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {services && services.length > 0 ? (
              services.map((service) => (
                <ServiceRow key={service.id} service={service} />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No services yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
