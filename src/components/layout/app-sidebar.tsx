"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sparkles,
  PlusCircle,
  Library,
  Users,
  Moon,
  Mic,
  GraduationCap,
  Globe,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Sparkles },
  { href: "/create", label: "Create Story", icon: PlusCircle },
  { href: "/library", label: "My Bookshelf", icon: Library },
  { href: "/profiles", label: "Child Profiles", icon: Users },
  { href: "/bedtime", label: "Bedtime Mode", icon: Moon },
]

const comingSoonItems = [
  { label: "Voice Recording", icon: Mic },
  { label: "Word Learning", icon: GraduationCap },
  { label: "Languages", icon: Globe },
]

export function AppSidebar() {
  const pathname = usePathname()
  const activeProfile = useAppStore((s) => s.getActiveProfile())

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface border-r border-primary/10 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-primary" />
          <span className="font-heading text-2xl font-bold text-primary">
            PixieTales
          </span>
        </Link>
      </div>

      {/* Active Profile */}
      {activeProfile && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-heading font-bold text-lg">
              {activeProfile.name[0]}
            </div>
            <div>
              <p className="font-heading font-semibold text-text text-sm">
                {activeProfile.name}
              </p>
              <p className="text-xs text-text-muted">
                Age {activeProfile.age}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-text-muted hover:bg-primary/5 hover:text-primary"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}

        {/* Coming Soon */}
        <div className="pt-6 pb-2">
          <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider">
            Coming Soon
          </p>
        </div>
        {comingSoonItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-muted/50 cursor-not-allowed"
          >
            <item.icon className="w-5 h-5" />
            {item.label}
            <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              SOON
            </span>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-primary/10">
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-muted hover:bg-primary/5 hover:text-primary transition-all w-full cursor-pointer">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </aside>
  )
}
