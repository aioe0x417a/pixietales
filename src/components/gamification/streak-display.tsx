"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getGamificationState } from "@/lib/gamification"
import type { ReadingStreak } from "@/lib/types"

interface StreakDisplayProps {
  childProfileId: string
}

// Determine moon phase character and style class based on streak count
function getMoonConfig(streak: number, graceUsed: boolean) {
  if (streak === 0) {
    return {
      symbol: "🌑",
      label: "New moon",
      colorClass: "text-text-muted",
      glowClass: "",
    }
  }
  if (streak <= 2) {
    return {
      symbol: "🌙",
      label: "Crescent moon",
      colorClass: "text-text-muted",
      glowClass: "",
    }
  }
  if (streak <= 6) {
    return {
      symbol: "🌓",
      label: "Half moon",
      colorClass: "text-secondary",
      glowClass: "",
    }
  }
  if (streak <= 13) {
    return {
      symbol: "🌕",
      label: "Full moon",
      colorClass: "text-primary",
      glowClass: "",
    }
  }
  // 14+ nights: golden glow full moon
  return {
    symbol: "🌕",
    label: "Golden full moon",
    colorClass: "text-primary",
    glowClass: "golden-moon-glow",
  }
}

// Determine if the streak is "active" (last read was today or yesterday)
function isStreakActive(streak: ReadingStreak | null): boolean {
  if (!streak || streak.currentStreak === 0) return false
  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  return (
    streak.lastReadDate === today || streak.lastReadDate === yesterday
  )
}

export function StreakDisplay({ childProfileId }: StreakDisplayProps) {
  const [streak, setStreak] = useState<ReadingStreak | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!childProfileId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const state = await getGamificationState(childProfileId)
        if (!cancelled) setStreak(state.streak)
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [childProfileId])

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/10 bg-surface animate-pulse"
        aria-label="Loading streak"
      >
        <div className="w-7 h-7 rounded-full bg-primary/10" />
        <div className="w-16 h-4 rounded bg-primary/10" />
      </div>
    )
  }

  const current = streak?.currentStreak ?? 0
  const longest = streak?.longestStreak ?? 0
  const graceUsed = streak?.graceUsed ?? false
  const active = isStreakActive(streak)
  const moon = getMoonConfig(current, graceUsed)

  return (
    <div
      className="flex flex-col gap-0.5 px-3 py-2 rounded-xl border border-primary/10 bg-surface"
      role="status"
      aria-label={`Nightly reading streak: ${current} nights`}
    >
      <div className="flex items-center gap-2">
        {/* Moon icon with optional flicker for grace day */}
        <motion.span
          className={`text-2xl leading-none ${moon.colorClass} ${moon.glowClass}`}
          aria-label={moon.label}
          animate={
            graceUsed
              ? { opacity: [1, 0.45, 1] }
              : current >= 14
              ? {
                  filter: [
                    "drop-shadow(0 0 0px rgba(var(--color-primary),0))",
                    "drop-shadow(0 0 6px rgba(var(--color-primary),0.7))",
                    "drop-shadow(0 0 0px rgba(var(--color-primary),0))",
                  ],
                }
              : {}
          }
          transition={
            graceUsed
              ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
              : current >= 14
              ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
              : {}
          }
        >
          {moon.symbol}
        </motion.span>

        {/* Streak count */}
        <div className="flex flex-col leading-tight">
          <span className="font-heading font-bold text-text text-sm">
            {current} {current === 1 ? "night" : "nights"}
          </span>
          {active && current > 0 && (
            <span className="text-[10px] text-primary font-medium">
              Keep it going!
            </span>
          )}
        </div>
      </div>

      {/* Longest streak */}
      {longest > 0 && (
        <p className="text-[10px] text-text-muted pl-9">
          Best: {longest} {longest === 1 ? "night" : "nights"}
        </p>
      )}
    </div>
  )
}
