"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function CallbackExchangePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    const redirect = searchParams.get("redirect") || "/dashboard"

    async function exchange() {
      if (code) {
        await getSupabase().auth.exchangeCodeForSession(code)
      }

      // Also handle hash fragment tokens (implicit flow fallback)
      // The Supabase client auto-detects hash tokens on init

      // Clean redirect
      router.replace(redirect)
    }

    exchange()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-text-muted text-sm">Signing you in...</p>
      </div>
    </div>
  )
}
