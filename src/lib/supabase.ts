import { createClient, SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

// Client-side Supabase client (uses anon key, respects RLS)
export function getSupabase() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}
