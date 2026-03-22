"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, PlusCircle, Library, Flower2, Users, Menu, LogOut, Moon, Settings, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Sparkles },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/library", label: "Library", icon: Library },
  { href: "/garden", label: "Garden", icon: Flower2 },
  { href: "/profiles", label: "Profiles", icon: Users },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [showMenu, setShowMenu] = useState(false)

  return (
    <>
      {/* Overlay menu */}
      {showMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMenu(false)}
          />
          <div role="menu" className="absolute bottom-[calc(4rem+env(safe-area-inset-bottom))] right-3 bg-surface border border-primary/10 rounded-2xl shadow-xl p-3 min-w-[200px] z-50">
            <Link
              role="menuitem"
              href="/bedtime"
              onClick={() => setShowMenu(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                pathname === "/bedtime"
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-primary/5 hover:text-primary"
              )}
            >
              <Moon className="w-5 h-5" />
              Bedtime Mode
            </Link>
            <Link
              role="menuitem"
              href="/settings"
              onClick={() => setShowMenu(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                pathname === "/settings"
                  ? "bg-primary/10 text-primary"
                  : "text-text-muted hover:bg-primary/5 hover:text-primary"
              )}
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <div className="my-1 border-t border-primary/10" />
            {user && (
              <p className="px-4 py-2 text-xs text-text-muted truncate">
                {user.email}
              </p>
            )}
            <button
              role="menuitem"
              onClick={() => {
                setShowMenu(false)
                signOut()
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-text-muted hover:bg-error/10 hover:text-error transition-all w-full cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-primary/10 z-50 lg:hidden safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 cursor-pointer min-w-[56px]",
                  isActive
                    ? "text-primary bg-primary/10 rounded-xl"
                    : "text-text-muted hover:text-primary"
                )}
              >
                <item.icon
                  className={cn("w-6 h-6", isActive && "drop-shadow-sm")}
                />
                <span className="text-[10px] font-semibold">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            )
          })}
          {/* More menu with sign out */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 cursor-pointer min-w-[56px]",
              showMenu ? "text-primary" : "text-text-muted hover:text-primary"
            )}
          >
            {showMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
            <span className="text-[10px] font-semibold">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
