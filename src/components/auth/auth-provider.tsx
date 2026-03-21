"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase"
import { useAppStore } from "@/lib/store"
import { Loader2, Sparkles } from "lucide-react"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const loadFromSupabase = useAppStore((s) => s.loadFromSupabase)

  useEffect(() => {
    const supabase = getSupabase()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadFromSupabase()
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (event === "SIGNED_IN" && session?.user) {
          loadFromSupabase()
        }
        if (event === "SIGNED_OUT") {
          useAppStore.getState().resetStore()
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadFromSupabase])

  const signOut = async () => {
    await getSupabase().auth.signOut()
    setUser(null)
    setSession(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Sparkles className="w-10 h-10 text-primary" />
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
