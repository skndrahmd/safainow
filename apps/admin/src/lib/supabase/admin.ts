import { createClient } from '@supabase/supabase-js'
import type { Database } from '@safainow/types'

/**
 * Service-role Supabase client — never expose to the browser.
 * Used only in server actions for admin auth operations (createUser, updateUser).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
