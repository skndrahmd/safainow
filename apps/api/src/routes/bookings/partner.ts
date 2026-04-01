import type { FastifyPluginAsync } from 'fastify'
import { supabase } from '../../lib/supabase.js'
import { BOOKING_STATUS, CANCELLATION_WINDOW_MS } from '@safainow/constants'

const partnerBookings: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /bookings/partner/active
   * Get partner's current active booking (any status between accepted and completed)
   * Auth: requires Supabase JWT (partner)
   */
  fastify.get(
    '/active',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const authUserId = (request.user as { sub: string }).sub

      // Resolve partner from auth_user_id
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single()

      if (partnerError || !partner) {
        return reply.code(403).send({ error: 'PARTNER_NOT_FOUND' })
      }

      // Get active booking (accepted through completed, but not cash_collected or cancelled)
      const activeStatuses = [
        BOOKING_STATUS.ACCEPTED,
        BOOKING_STATUS.ON_ROUTE,
        BOOKING_STATUS.REACHED,
        BOOKING_STATUS.WORK_IN_PROGRESS,
        BOOKING_STATUS.COMPLETED,
      ]

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          address,
          address_lat,
          address_lng,
          total_price,
          scheduled_at,
          accepted_at,
          customer:customers(id, full_name, phone),
          booking_packages(id, package_id, package_name_en, package_name_ur, package_type, price_at_booking),
          booking_custom_services(id, service_id, service_name_en, service_name_ur, price_at_booking)
        `)
        .eq('partner_id', partner.id)
        .in('status', activeStatuses)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (bookingError) {
        request.log.error(bookingError, 'Failed to fetch active booking')
        return reply.internalServerError('Failed to fetch active booking')
      }

      return reply.send({ booking })
    },
  )

  /**
   * PATCH /bookings/partner/:id/reached
   * Partner marks arrival at customer location
   * Status flow: on_route -> reached -> work_in_progress (auto)
   * Auth: requires Supabase JWT (partner)
   */
  fastify.patch<{ Params: { id: string } }>(
    '/:id/reached',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: bookingId } = request.params
      const authUserId = (request.user as { sub: string }).sub

      // Resolve partner from auth_user_id
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single()

      if (partnerError || !partner) {
        return reply.code(403).send({ error: 'PARTNER_NOT_FOUND' })
      }

      // Verify booking belongs to this partner and is on_route
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, status, partner_id')
        .eq('id', bookingId)
        .single()

      if (fetchError || !booking) {
        return reply.notFound('Booking not found')
      }

      if (booking.partner_id !== partner.id) {
        return reply.code(403).send({ error: 'NOT_YOUR_BOOKING' })
      }

      if (booking.status !== BOOKING_STATUS.ON_ROUTE) {
        return reply.conflict(`Booking must be on_route to mark reached. Current status: ${booking.status}`)
      }

      // Update to reached
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: BOOKING_STATUS.REACHED,
          reached_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (updateError) {
        request.log.error(updateError, 'Failed to update booking to reached')
        return reply.internalServerError('Failed to update booking')
      }

      // Log timeline for reached
      await supabase.from('booking_timeline').insert({
        booking_id: bookingId,
        status: BOOKING_STATUS.REACHED,
        actor_type: 'partner',
        actor_id: partner.id,
      })

      // Auto-transition to work_in_progress
      const { error: workError } = await supabase
        .from('bookings')
        .update({
          status: BOOKING_STATUS.WORK_IN_PROGRESS,
          work_started_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (workError) {
        request.log.error(workError, 'Failed to auto-transition to work_in_progress')
        // Don't fail the request - reached was successful
      } else {
        // Log timeline for work_in_progress
        await supabase.from('booking_timeline').insert({
          booking_id: bookingId,
          status: BOOKING_STATUS.WORK_IN_PROGRESS,
          actor_type: 'system',
          actor_id: null,
        })
      }

      return reply.send({ success: true, status: BOOKING_STATUS.WORK_IN_PROGRESS })
    },
  )

  /**
   * PATCH /bookings/partner/:id/completed
   * Partner marks work as completed
   * Status flow: work_in_progress -> completed
   * Auth: requires Supabase JWT (partner)
   */
  fastify.patch<{ Params: { id: string } }>(
    '/:id/completed',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: bookingId } = request.params
      const authUserId = (request.user as { sub: string }).sub

      // Resolve partner from auth_user_id
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single()

      if (partnerError || !partner) {
        return reply.code(403).send({ error: 'PARTNER_NOT_FOUND' })
      }

      // Verify booking belongs to this partner and is work_in_progress
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, status, partner_id')
        .eq('id', bookingId)
        .single()

      if (fetchError || !booking) {
        return reply.notFound('Booking not found')
      }

      if (booking.partner_id !== partner.id) {
        return reply.code(403).send({ error: 'NOT_YOUR_BOOKING' })
      }

      if (booking.status !== BOOKING_STATUS.WORK_IN_PROGRESS) {
        return reply.conflict(`Booking must be work_in_progress to mark completed. Current status: ${booking.status}`)
      }

      // Update to completed
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: BOOKING_STATUS.COMPLETED,
          completed_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (updateError) {
        request.log.error(updateError, 'Failed to update booking to completed')
        return reply.internalServerError('Failed to update booking')
      }

      // Log timeline
      await supabase.from('booking_timeline').insert({
        booking_id: bookingId,
        status: BOOKING_STATUS.COMPLETED,
        actor_type: 'partner',
        actor_id: partner.id,
      })

      return reply.send({ success: true, status: BOOKING_STATUS.COMPLETED })
    },
  )

  /**
   * PATCH /bookings/partner/:id/cash-collected
   * Partner confirms cash collection from customer
   * Status flow: completed -> cash_collected
   * Also updates commission_ledger.status to 'collected'
   * Auth: requires Supabase JWT (partner)
   */
  fastify.patch<{ Params: { id: string } }>(
    '/:id/cash-collected',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: bookingId } = request.params
      const authUserId = (request.user as { sub: string }).sub

      // Resolve partner from auth_user_id
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single()

      if (partnerError || !partner) {
        return reply.code(403).send({ error: 'PARTNER_NOT_FOUND' })
      }

      // Verify booking belongs to this partner and is completed
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, status, partner_id')
        .eq('id', bookingId)
        .single()

      if (fetchError || !booking) {
        return reply.notFound('Booking not found')
      }

      if (booking.partner_id !== partner.id) {
        return reply.code(403).send({ error: 'NOT_YOUR_BOOKING' })
      }

      if (booking.status !== BOOKING_STATUS.COMPLETED) {
        return reply.conflict(`Booking must be completed to collect cash. Current status: ${booking.status}`)
      }

      // Update booking to cash_collected
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: BOOKING_STATUS.CASH_COLLECTED,
          cash_collected_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (updateError) {
        request.log.error(updateError, 'Failed to update booking to cash_collected')
        return reply.internalServerError('Failed to update booking')
      }

      // Update commission_ledger status to 'collected'
      const { error: ledgerError } = await supabase
        .from('commission_ledger')
        .update({ status: 'collected' })
        .eq('booking_id', bookingId)
        .eq('partner_id', partner.id)

      if (ledgerError) {
        request.log.error(ledgerError, 'Failed to update commission_ledger')
        // Non-critical - booking update succeeded
      }

      // Log timeline
      await supabase.from('booking_timeline').insert({
        booking_id: bookingId,
        status: BOOKING_STATUS.CASH_COLLECTED,
        actor_type: 'partner',
        actor_id: partner.id,
      })

      return reply.send({ success: true, status: BOOKING_STATUS.CASH_COLLECTED })
    },
  )

  /**
   * DELETE /bookings/partner/:id/cancel-partner
   * Partner cancels a booking within the 15-minute cancellation window
   * Only allowed within 15 minutes of accepted_at
   * Auth: requires Supabase JWT (partner)
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id/cancel-partner',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id: bookingId } = request.params
      const authUserId = (request.user as { sub: string }).sub

      // Resolve partner from auth_user_id
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single()

      if (partnerError || !partner) {
        return reply.code(403).send({ error: 'PARTNER_NOT_FOUND' })
      }

      // Fetch booking and verify ownership
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, status, partner_id, accepted_at')
        .eq('id', bookingId)
        .single()

      if (fetchError || !booking) {
        return reply.notFound('Booking not found')
      }

      if (booking.partner_id !== partner.id) {
        return reply.code(403).send({ error: 'NOT_YOUR_BOOKING' })
      }

      // Can only cancel if accepted (not yet started work)
      if (booking.status !== BOOKING_STATUS.ACCEPTED && booking.status !== BOOKING_STATUS.ON_ROUTE) {
        return reply.conflict('Booking can only be cancelled while accepted or on_route')
      }

      // Check cancellation window (15 minutes from accepted_at)
      if (!booking.accepted_at) {
        return reply.conflict('Booking has no acceptance time recorded')
      }

      const acceptedTime = new Date(booking.accepted_at).getTime()
      const now = Date.now()
      const elapsed = now - acceptedTime

      if (elapsed > CANCELLATION_WINDOW_MS) {
        return reply.conflict('Cancellation window has expired (15 minutes from acceptance)')
      }

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: BOOKING_STATUS.CANCELLED_BY_PARTNER,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', bookingId)

      if (updateError) {
        request.log.error(updateError, 'Failed to cancel booking')
        return reply.internalServerError('Failed to cancel booking')
      }

      // Log timeline
      await supabase.from('booking_timeline').insert({
        booking_id: bookingId,
        status: BOOKING_STATUS.CANCELLED_BY_PARTNER,
        actor_type: 'partner',
        actor_id: partner.id,
      })

      // Delete commission_ledger entry (was created on accept)
      await supabase
        .from('commission_ledger')
        .delete()
        .eq('booking_id', bookingId)
        .eq('partner_id', partner.id)

      return reply.send({ success: true, status: BOOKING_STATUS.CANCELLED_BY_PARTNER })
    },
  )
}

export default partnerBookings

/**
 * Register partner booking routes under /partner prefix
 */
export async function registerPartnerBookingRoutes(fastify: import('fastify').FastifyInstance): Promise<void> {
  await fastify.register(partnerBookings, { prefix: '/partner' })
}