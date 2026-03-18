import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load the existing session from storage on app start
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    // Keep session in sync whenever auth state changes
    // (sign in, sign out, token refresh, OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Sign out automatically if the customer's DB row is deleted (e.g. admin removes them)
  useEffect(() => {
    if (!session?.user.id) return

    const channel = supabase
      .channel('customer-row-watch')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'customers',
          filter: `id=eq.${session.user.id}`,
        },
        () => supabase.auth.signOut()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [session?.user.id])

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
