"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { RequireAuth } from "@/components/auth/require-auth"
import { AmbientAudioProvider } from "@/components/audio/ambient-audio-provider"
import { Toaster } from "sonner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
    <AmbientAudioProvider>
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "var(--font-body)",
            borderRadius: "12px",
          },
        }}
      />
    </div>
    </AmbientAudioProvider>
    </RequireAuth>
  )
}
