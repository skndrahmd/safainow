import type { FastifyPluginAsync } from 'fastify'
import { supabase } from '../../lib/supabase.js'

const customers: FastifyPluginAsync = async (fastify) => {
  /**
   * DELETE /customers/me — Delete the authenticated customer's account
   *
   * Auth: requires Supabase JWT (customer)
   * Steps: delete customer row → delete auth user
   */
  fastify.delete(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub

      // 1. Delete customer row (cascade will handle related data)
      const { error: deleteRowError } = await supabase
        .from('customers')
        .delete()
        .eq('id', userId)

      if (deleteRowError) {
        request.log.error(deleteRowError, 'Failed to delete customer row')
        return reply.internalServerError('Failed to delete account')
      }

      // 2. Delete auth user (requires service_role key — our supabase client has it)
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(userId)

      if (deleteAuthError) {
        request.log.error(deleteAuthError, 'Failed to delete auth user')
        return reply.internalServerError('Failed to delete account')
      }

      return reply.send({ success: true })
    },
  )
}

export default customers
