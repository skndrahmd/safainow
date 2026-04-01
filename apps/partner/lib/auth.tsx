import { createContext, useContext, useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Tables } from '@safainow/types'

type Partner = Tables<'partners'>

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
  partner: Partner | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  partner: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [partner, setPartner] = useState<Partner | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setIsLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch partner profile when session changes
  useEffect(() => {
    if (!session?.user?.id) {
      setPartner(null)
      return
    }
    supabase
      .from('partners')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) setPartner(data)
      })
  }, [session?.user?.id])

  async function signOut() {
    await supabase.auth.signOut()
    setPartner(null)
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, partner, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
