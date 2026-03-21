import "server-only"
import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _admin: SupabaseClient | null = null

// Server-side only Supabase client (service role key, bypasses RLS)
export function getSupabaseAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _admin
}
