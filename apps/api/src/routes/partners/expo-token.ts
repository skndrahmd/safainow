import type { FastifyInstance } from 'fastify'
import { supabase } from '../../lib/supabase.js'

export async function registerExpoTokenRoute(fastify: FastifyInstance) {
  fastify.patch(
    '/me/expo-token',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { expoPushToken } = request.body as { expoPushToken: string }
      const authUserId = (request.user as { sub: string }).sub

      if (!expoPushToken) {
        return reply.badRequest('expoPushToken is required')
      }

      const { error } = await supabase
        .from('partners')
        .update({ expo_push_token: expoPushToken })
        .eq('auth_user_id', authUserId)

      if (error) {
        return reply.internalServerError('Failed to store push token')
      }

      return reply.send({ success: true })
    }
  )
}