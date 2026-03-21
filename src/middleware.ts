import { NextRequest, NextResponse } from "next/server"

// Middleware is minimal -- auth is checked client-side via AuthProvider.
// This just ensures API routes and static assets pass through cleanly.
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
