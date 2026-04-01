import type { FastifyPluginAsync } from 'fastify'
import { BookingCreateSchema } from '@safainow/validators'
import { BOOKING_STATUS, PACKAGE_TYPE } from '@safainow/constants'
import { supabase } from '../../lib/supabase.js'
import { matchPartnersForBooking } from '../../lib/matching.js'
import { sendExpoPushToMany } from '../../lib/push.js'
import { registerPartnerBookingRoutes } from './partner.js'

const bookings: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /bookings — Create a new booking
   *
   * Auth: requires Supabase JWT (customer)
   * Body: validated by BookingCreateSchema
   */
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      // 1. Validate request body
      const parsed = BookingCreateSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body')
      }
      const input = parsed.data
      const customerId = (request.user as { sub: string }).sub

      // 2. Fetch packages from DB
      const { data: packages, error: pkgError } = await supabase
        .from('packages')
        .select('id, name_en, name_ur, price, type, is_active')
        .in('id', input.package_ids)

      if (pkgError) {
        request.log.error(pkgError, 'Failed to fetch packages')
        return reply.internalServerError('Failed to fetch packages')
      }

      // Verify all requested packages exist and are active
      if (!packages || packages.length !== input.package_ids.length) {
        return reply.badRequest('One or more packages not found or inactive')
      }

      const inactivePackage = packages.find((p) => !p.is_active)
      if (inactivePackage) {
        return reply.badRequest(`Package "${inactivePackage.name_en}" is currently inactive`)
      }

      // 3. Enforce combination rules
      const cleaningPkgs = packages.filter((p) => p.type === PACKAGE_TYPE.CLEANING)
      const standalonePkgs = packages.filter((p) => p.type === PACKAGE_TYPE.STANDALONE)
      const customPkgs = packages.filter((p) => p.type === PACKAGE_TYPE.CUSTOM)

      if (cleaningPkgs.length > 1) {
        return reply.badRequest('Only one cleaning package is allowed per booking')
      }
      if (standalonePkgs.length > 1) {
        return reply.badRequest('Only one standalone package is allowed per booking')
      }
      if (customPkgs.length > 0 && packages.length > 1) {
        return reply.badRequest('Custom package cannot be combined with other packages')
      }
      if (customPkgs.length > 0 && input.custom_service_ids.length === 0) {
        return reply.badRequest('Custom package requires at least one service')
      }
      if (customPkgs.length === 0 && input.custom_service_ids.length > 0) {
        return reply.badRequest('Services can only be selected with a custom package')
      }

      // 4. Fetch custom services if needed
      let services: { id: string; name_en: string; name_ur: string; price: number }[] = []
      if (input.custom_service_ids.length > 0) {
        const { data: svcData, error: svcError } = await supabase
          .from('services')
          .select('id, name_en, name_ur, price, is_active')
          .in('id', input.custom_service_ids)

        if (svcError) {
          request.log.error(svcError, 'Failed to fetch services')
          return reply.internalServerError('Failed to fetch services')
        }

        if (!svcData || svcData.length !== input.custom_service_ids.length) {
          return reply.badRequest('One or more services not found or inactive')
        }

        const inactiveService = svcData.find((s) => !s.is_active)
        if (inactiveService) {
          return reply.badRequest(`Service "${inactiveService.name_en}" is currently inactive`)
        }

        services = svcData
      }

      // 5. Calculate total price
      const packageTotal = packages
        .filter((p) => p.type !== PACKAGE_TYPE.CUSTOM)
        .reduce((sum, p) => sum + p.price, 0)
      const serviceTotal = services.reduce((sum, s) => sum + s.price, 0)
      const totalPrice = packageTotal + serviceTotal

      // 6. Insert booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customerId,
          status: BOOKING_STATUS.PENDING,
          address: input.address_text,
          address_lat: input.address_latitude,
          address_lng: input.address_longitude,
          total_price: totalPrice,
          scheduled_at: input.scheduled_at,
        })
        .select()
        .single()

      if (bookingError || !booking) {
        request.log.error(bookingError, 'Failed to insert booking')
        return reply.internalServerError('Failed to create booking')
      }

      // 7. Insert booking_packages
      const bookingPackageRows = packages.map((p) => ({
        booking_id: booking.id,
        package_id: p.id,
        package_name_en: p.name_en,
        package_name_ur: p.name_ur,
        package_type: p.type,
        price_at_booking: p.type === PACKAGE_TYPE.CUSTOM ? 0 : p.price,
      }))

      const { error: bpError } = await supabase
        .from('booking_packages')
        .insert(bookingPackageRows)

      if (bpError) {
        request.log.error(bpError, 'Failed to insert booking_packages')
        // Rollback: delete the booking
        await supabase.from('bookings').delete().eq('id', booking.id)
        return reply.internalServerError('Failed to create booking packages')
      }

      // 8. Insert booking_custom_services (if any)
      if (services.length > 0) {
        const customServiceRows = services.map((s) => ({
          booking_id: booking.id,
          service_id: s.id,
          service_name_en: s.name_en,
          service_name_ur: s.name_ur,
          price_at_booking: s.price,
        }))

        const { error: bcsError } = await supabase
          .from('booking_custom_services')
          .insert(customServiceRows)

        if (bcsError) {
          request.log.error(bcsError, 'Failed to insert booking_custom_services')
          await supabase.from('booking_packages').delete().eq('booking_id', booking.id)
          await supabase.from('bookings').delete().eq('id', booking.id)
          return reply.internalServerError('Failed to create booking services')
        }
      }

      // 9. Insert booking_timeline — initial 'pending' entry
      const { error: tlError } = await supabase.from('booking_timeline').insert({
        booking_id: booking.id,
        status: BOOKING_STATUS.PENDING,
        actor_type: 'customer',
        actor_id: customerId,
      })

      if (tlError) {
        request.log.error(tlError, 'Failed to insert booking_timeline')
        // Non-critical — booking was already created, log and continue
      }

      // 10. Trigger partner matching — fire and forget (non-blocking)
      if (input.address_latitude != null && input.address_longitude != null) {
        matchPartnersForBooking(booking.id, input.address_latitude, input.address_longitude).catch(
          (err) => request.log.error(err, 'Matching failed')
        )
      }

      // 11. Return created booking
      return reply.code(201).send({
        booking,
        packages: bookingPackageRows,
        custom_services: services.length > 0 ? services : undefined,
      })
    },
  )

  /**
   * DELETE /bookings/:id/cancel — Cancel a pending booking
   *
   * Auth: requires Supabase JWT (customer)
   * Only works when status = 'pending' (pre-acceptance)
   */
  fastify.delete<{ Params: { id: string } }>(
    '/:id/cancel',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params
      const customerId = (request.user as { sub: string }).sub

      // 1. Fetch booking owned by this customer
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('id, status, customer_id')
        .eq('id', id)
        .eq('customer_id', customerId)
        .single()

      if (fetchError || !booking) {
        return reply.notFound('Booking not found')
      }

      // 2. Can only cancel if pending
      if (booking.status !== BOOKING_STATUS.PENDING) {
        return reply.conflict('Booking can only be cancelled while pending')
      }

      // 3. Update status
      const { data: updated, error: updateError } = await supabase
        .from('bookings')
        .update({
          status: BOOKING_STATUS.CANCELLED_BY_CUSTOMER,
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (updateError || !updated) {
        request.log.error(updateError, 'Failed to cancel booking')
        return reply.internalServerError('Failed to cancel booking')
      }

      // 4. Insert timeline entry
      await supabase.from('booking_timeline').insert({
        booking_id: id,
        status: BOOKING_STATUS.CANCELLED_BY_CUSTOMER,
        actor_type: 'customer',
        actor_id: customerId,
      })

      return reply.send({ booking: updated })
    },
  )

  /**
   * POST /bookings/:id/accept
   * Auth: partner JWT required
   */
  fastify.post<{ Params: { id: string } }>(
    '/:id/accept',
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

      const partnerId = partner.id

      // Atomic claim — only succeeds if booking is still pending
      const { data: claimed, error: claimError } = await supabase
        .from('bookings')
        .update({
          partner_id: partnerId,
          status: BOOKING_STATUS.ACCEPTED,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .eq('status', BOOKING_STATUS.PENDING)
        .select('id, total_price')
        .single()

      if (claimError || !claimed) {
        return reply.code(409).send({ error: 'BOOKING_ALREADY_CLAIMED' })
      }

      // Log timeline
      await supabase.from('booking_timeline').insert({
        booking_id: bookingId,
        status: BOOKING_STATUS.ACCEPTED,
        actor_type: 'partner',
        actor_id: partnerId,
      })

      // Create commission ledger entry
      const total = Number(claimed.total_price)
      await supabase.from('commission_ledger').insert({
        booking_id: bookingId,
        partner_id: partnerId,
        total_amount: total,
        commission_amount: total * 0.25,
        partner_amount: total * 0.75,
        status: 'owed',
      })

      // Mark this offer as accepted
      await supabase
        .from('job_offers')
        .update({ accepted: true, responded_at: new Date().toISOString() })
        .eq('booking_id', bookingId)
        .eq('partner_id', partnerId)

      // Dismiss all other pending offers
      const { data: otherOffers } = await supabase
        .from('job_offers')
        .select('partner_id, partners(expo_push_token)')
        .eq('booking_id', bookingId)
        .neq('partner_id', partnerId)
        .is('accepted', null)

      if (otherOffers && otherOffers.length > 0) {
        await supabase
          .from('job_offers')
          .update({ accepted: false, responded_at: new Date().toISOString() })
          .eq('booking_id', bookingId)
          .neq('partner_id', partnerId)

        const dismissTokens = (otherOffers as unknown[])
          .map((o: unknown) => (o as { partners?: { expo_push_token?: string } }).partners?.expo_push_token)
          .filter(Boolean) as string[]

        if (dismissTokens.length > 0) {
          await sendExpoPushToMany(dismissTokens, {
            title: 'کام نہیں ملا',
            body: 'یہ بکنگ کسی اور نے لے لی',
            data: { bookingId, type: 'JOB_DISMISSED' },
          })
        }
      }

      return reply.send({ success: true, bookingId })
    },
  )

  // Register partner-specific booking routes
  await registerPartnerBookingRoutes(fastify)
}

export default bookings
