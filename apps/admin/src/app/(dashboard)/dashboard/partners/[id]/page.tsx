import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ResetPasscodeButton } from '@/components/partners/reset-passcode-button'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  on_route: 'On Route',
  reached: 'Reached',
  work_in_progress: 'In Progress',
  completed: 'Completed',
  cash_collected: 'Cash Collected',
  cancelled_by_customer: 'Cancelled (Customer)',
  cancelled_by_partner: 'Cancelled (Partner)',
  cancelled_by_admin: 'Cancelled (Admin)',
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: partner },
    { data: bookingsAll },
    { data: bookingsHistory },
    { data: ledger },
  ] = await Promise.all([
    supabase.from('partners').select('*').eq('id', id).single(),
    // All bookings for stat card computations (no limit — counts must be accurate)
    supabase
      .from('bookings')
      .select('status, customer_feedback')
      .eq('partner_id', id),
    // Last 50 bookings for the history table (with nested customer + packages)
    supabase
      .from('bookings')
      .select(
        'id, created_at, status, total_price, customer_feedback, customers(full_name), booking_packages(package_name_en)'
      )
      .eq('partner_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('commission_ledger')
      .select('partner_amount')
      .eq('partner_id', id),
  ])

  if (!partner) notFound()

  // --- Stat computations ---
  const allBookings = bookingsAll ?? []

  const jobsCompleted = allBookings.filter(
    (b) => b.status === 'completed' || b.status === 'cash_collected'
  ).length

  const totalEarned = (ledger ?? []).reduce(
    (sum, row) => sum + Number(row.partner_amount ?? 0),
    0
  )

  const feedbackRows = allBookings.filter((b) => b.customer_feedback !== null)
  const positiveFeedbackRate =
    feedbackRows.length === 0
      ? null
      : (feedbackRows.filter((b) => b.customer_feedback === 'positive').length /
          feedbackRows.length) *
        100

  const acceptedOrBeyond = allBookings.filter((b) =>
    [
      'accepted',
      'on_route',
      'reached',
      'work_in_progress',
      'completed',
      'cash_collected',
      'cancelled_by_partner',
    ].includes(b.status)
  )
  const cancellationRate =
    acceptedOrBeyond.length === 0
      ? null
      : (allBookings.filter((b) => b.status === 'cancelled_by_partner').length /
          acceptedOrBeyond.length) *
        100

  return (
    <div className="p-8 max-w-4xl">
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

      {/* Profile info */}
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

      {/* Images */}
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

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Jobs Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{jobsCompleted}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatRupees(totalEarned)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Positive Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatPercent(positiveFeedbackRate)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">
              Cancellation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {formatPercent(cancellationRate)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job history */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Job History</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Packages</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Feedback</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsHistory && bookingsHistory.length > 0 ? (
                bookingsHistory.map((booking) => {
                  const customer = booking.customers as { full_name: string } | null
                  const packages = booking.booking_packages as { package_name_en: string }[]
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {new Date(booking.created_at).toLocaleDateString('en-PK', {
                          dateStyle: 'medium',
                        })}
                      </TableCell>
                      <TableCell>{customer?.full_name ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {packages?.map((p) => p.package_name_en).join(', ') || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatRupees(Number(booking.total_price))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {STATUS_LABELS[booking.status] ?? booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {booking.customer_feedback === 'positive'
                          ? '👍'
                          : booking.customer_feedback === 'negative'
                            ? '👎'
                            : '—'}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No jobs yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
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

function formatRupees(amount: number): string {
  return 'Rs ' + amount.toLocaleString('en-PK')
}

function formatPercent(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(1) + '%'
}
