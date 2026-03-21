"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { RequireAuth } from "@/components/auth/require-auth"
import { AmbientAudioProvider } from "@/components/audio/ambient-audio-provider"
import { ReducedMotionProvider } from "@/components/reduced-motion-provider"
import { Toaster } from "sonner"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const bedtimeMode = useAppStore((s) => s.bedtimeMode)

  return (
    <RequireAuth>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-xl focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <AmbientAudioProvider>
        <ReducedMotionProvider>
          <div className={cn("min-h-screen bg-background", bedtimeMode && "bedtime-mode")}>
            {/* Desktop sidebar */}
            <div className="hidden lg:block">
              <AppSidebar />
            </div>

            {/* Main content */}
            <main id="main-content" className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
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
        </ReducedMotionProvider>
      </AmbientAudioProvider>
    </RequireAuth>
  )
}
