import { NextRequest, NextResponse } from "next/server"

// CSRF / Origin validation for API routes.
// Allows: same-origin requests, Stripe webhooks (no Origin header), and server-side calls.
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin")
  const host = request.headers.get("host")

  // Only check mutating methods on API routes
  if (
    request.nextUrl.pathname.startsWith("/api/") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)
  ) {
    // Stripe webhooks don't send Origin — allow if path matches and has signature
    if (
      request.nextUrl.pathname.startsWith("/api/stripe/webhook") &&
      request.headers.get("stripe-signature")
    ) {
      return NextResponse.next()
    }

    // Server-side calls (no Origin header but have Authorization) are allowed
    if (!origin && request.headers.get("authorization")) {
      return NextResponse.next()
    }

    // If Origin is present, it must match the Host
    if (origin) {
      const originHost = new URL(origin).host
      if (originHost !== host) {
        return NextResponse.json(
          { error: "Forbidden: cross-origin request" },
          { status: 403 }
        )
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}
