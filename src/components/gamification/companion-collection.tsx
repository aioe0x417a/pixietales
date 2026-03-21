"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Lock } from "lucide-react"
import { getGamificationState } from "@/lib/gamification"
import {
  COMPANIONS,
  BASE_COMPANIONS,
  COLLECTIBLE_COMPANIONS,
  type Companion,
} from "@/lib/types"

interface CompanionCollectionProps {
  childProfileId: string
}

export function CompanionCollection({ childProfileId }: CompanionCollectionProps) {
  const [unlockedIds, setUnlockedIds] = useState<Set<Companion>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGamificationState(childProfileId)
      .then(({ unlockedCompanions }) => {
        const ids = new Set<Companion>(unlockedCompanions.map((u) => u.companionId))
        setUnlockedIds(ids)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [childProfileId])

  const unlockedCollectibles = COLLECTIBLE_COMPANIONS.filter((c) =>
    unlockedIds.has(c.value)
  )
  const lockedCollectibles = COLLECTIBLE_COMPANIONS.filter(
    (c) => !unlockedIds.has(c.value)
  )
  const totalUnlocked = BASE_COMPANIONS.length + unlockedCollectibles.length

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {COMPANIONS.map((c) => (
          <div
            key={c.value}
            className="h-24 rounded-2xl bg-surface animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-muted">
          {totalUnlocked} / {COMPANIONS.length} companions collected
        </p>
        <div className="h-2 flex-1 mx-4 rounded-full bg-primary/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(totalUnlocked / COMPANIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Your Companions section */}
      <div>
        <h3 className="font-heading text-base font-semibold text-text mb-3">
          Your Companions
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {BASE_COMPANIONS.map((companion) => (
            <motion.div
              key={companion.value}
              whileHover={{ scale: 1.06 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-primary/15 bg-surface cursor-default select-none"
            >
              <span className="text-3xl" role="img" aria-label={companion.label}>
                {companion.emoji}
              </span>
              <span className="text-xs font-semibold text-text text-center leading-tight">
                {companion.label}
              </span>
              <span className="text-[10px] font-semibold text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded-full">
                Unlocked!
              </span>
            </motion.div>
          ))}
          {unlockedCollectibles.map((companion) => (
            <motion.div
              key={companion.value}
              whileHover={{ scale: 1.06 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-secondary/20 bg-secondary/5 cursor-default select-none"
            >
              <span className="text-3xl" role="img" aria-label={companion.label}>
                {companion.emoji}
              </span>
              <span className="text-xs font-semibold text-text text-center leading-tight">
                {companion.label}
              </span>
              <span className="text-[10px] font-semibold text-secondary/80 bg-secondary/10 px-1.5 py-0.5 rounded-full">
                Unlocked!
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Locked section */}
      {lockedCollectibles.length > 0 && (
        <div>
          <h3 className="font-heading text-base font-semibold text-text-muted mb-3">
            Locked
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {lockedCollectibles.map((companion) => (
              <div
                key={companion.value}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 border-primary/5 bg-surface/50 cursor-default select-none relative overflow-hidden"
              >
                <div className="relative">
                  <span
                    className="text-3xl grayscale opacity-30"
                    role="img"
                    aria-label={companion.label}
                  >
                    {companion.emoji}
                  </span>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-text-muted" />
                  </div>
                </div>
                <span className="text-xs font-semibold text-text-muted text-center leading-tight">
                  {companion.label}
                </span>
                <span className="text-[9px] text-text-muted/60 text-center leading-tight">
                  Read {companion.unlockThreshold} more stories
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
