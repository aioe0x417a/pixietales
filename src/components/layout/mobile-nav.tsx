"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, PlusCircle, Library, Users, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Sparkles },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/library", label: "Library", icon: Library },
  { href: "/profiles", label: "Profiles", icon: Users },
  { href: "/bedtime", label: "Bedtime", icon: Moon },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
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
                  ? "text-primary"
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
      </div>
    </nav>
  )
}
