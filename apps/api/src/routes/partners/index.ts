import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { supabase } from '../../lib/supabase.js'

const partners: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /partners/login
   * No auth required — this IS the login endpoint.
   * Body: { phone: string, passcode: string }
   */
  fastify.post('/login', async (request, reply) => {
    const { phone, passcode } = request.body as { phone: string; passcode: string }

    if (!phone || !passcode) {
      return reply.badRequest('phone and passcode are required')
    }

    // 1. Look up partner by phone
    const { data: partner, error } = await supabase
      .from('partners')
      .select('id, full_name, phone, passcode_hash, is_active, profile_picture_url')
      .eq('phone', phone.trim())
      .single()

    if (error || !partner) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    // 2. Check if suspended
    if (!partner.is_active) {
      return reply.code(403).send({ error: 'ACCOUNT_SUSPENDED' })
    }

    // 3. Verify passcode
    const valid = await bcrypt.compare(passcode, partner.passcode_hash ?? '')
    if (!valid) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    // 4. Sign in via Supabase Auth using the phone@safainow.local hack
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: `${phone.trim()}@safainow.local`,
      password: passcode,
    })

    if (authError || !authData.session) {
      return reply.code(401).send({ error: 'INVALID_CREDENTIALS' })
    }

    return reply.send({
      session: authData.session,
      partner: {
        id: partner.id,
        name: partner.full_name,
        phone: partner.phone,
        profile_picture_url: partner.profile_picture_url,
      },
    })
  })
}

export default partners
