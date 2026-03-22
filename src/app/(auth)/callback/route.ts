import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  let redirect = searchParams.get("redirect") || "/dashboard"

  // Prevent open redirect -- only use the pathname
  try {
    const parsed = new URL(redirect, request.url)
    redirect = parsed.pathname + parsed.search
  } catch {
    redirect = "/dashboard"
  }
  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    redirect = "/dashboard"
  }

  if (code) {
    // Pass the code to a client page that can exchange it with the browser Supabase client
    // This ensures the session cookie is set properly
    const url = new URL("/callback/exchange", request.url)
    url.searchParams.set("code", code)
    url.searchParams.set("redirect", redirect)
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(new URL(redirect, request.url))
}
