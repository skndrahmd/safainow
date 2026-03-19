import fp from 'fastify-plugin'
import fjwt from '@fastify/jwt'
import buildGetJwks from 'get-jwks'
import type { FastifyReply, FastifyRequest } from 'fastify'

const SUPABASE_ISSUER = `${process.env.SUPABASE_URL}/auth/v1`

/**
 * Auth plugin — verifies Supabase-issued JWTs using the JWKS endpoint.
 *
 * Uses `get-jwks` to fetch and cache the public key from the Supabase JWKS
 * endpoint, supporting ES256 (Elliptic Curve) which new Supabase projects use.
 *
 * After verification, `request.user.sub` contains the Supabase auth user ID.
 */
export default fp(async (fastify) => {
  const getJwks = buildGetJwks({
    ttl: 60 * 60 * 1000, // cache keys for 1 hour
    issuersWhitelist: [SUPABASE_ISSUER],
  })

  fastify.register(fjwt, {
    decode: { complete: true },
    secret: (_request, token, callback) => {
      const {
        header: { kid, alg },
        payload: { iss },
      } = token as {
        header: { kid: string; alg: string }
        payload: { iss: string }
      }

      getJwks
        .getPublicKey({ kid, domain: iss, alg })
        .then(
          (publicKey) => callback(null, publicKey),
          (err) => callback(err, ''),
        )
    },
  })

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify()
      } catch {
        return reply.unauthorized('Invalid or expired token')
      }
    },
  )
})

/** Supabase JWT payload shape */
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      aud: string
      role: string
      iss: string
      email?: string
    }
    user: {
      sub: string
      aud: string
      role: string
      iss: string
      email?: string
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
