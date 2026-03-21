import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || ""
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const consentVersion = body.consentVersion || "v1.0"

    // Hash IP for audit (not for tracking)
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() || "unknown"
    const encoder = new TextEncoder()
    const data = encoder.encode(ip + process.env.SUPABASE_SERVICE_ROLE_KEY)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const ipHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")

    const userAgent = request.headers.get("user-agent") || "unknown"

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await supabaseAdmin.from("consent_log").insert({
      user_id: user.id,
      consent_version: consentVersion,
      ip_hash: ipHash,
      user_agent: userAgent.slice(0, 500),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Consent logging error:", error)
    return NextResponse.json({ error: "Failed to log consent" }, { status: 500 })
  }
}
