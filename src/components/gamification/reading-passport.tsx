"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { BookMarked, Star, BookOpen } from "lucide-react"
import { getGamificationState } from "@/lib/gamification"
import type { StoryStamp } from "@/lib/types"
import { useAppStore } from "@/lib/store"

const PASSPORT_SIZE = 24 // total stamp slots to display

interface ReadingPassportProps {
  childProfileId: string
}

export function ReadingPassport({ childProfileId }: ReadingPassportProps) {
  const [stamps, setStamps] = useState<StoryStamp[]>([])
  const [loading, setLoading] = useState(true)
  const stories = useAppStore((s) => s.stories)

  useEffect(() => {
    if (!childProfileId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const state = await getGamificationState(childProfileId)
        if (!cancelled) setStamps(state.stamps)
      } catch {
        // silently fail -- gamification is non-critical
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [childProfileId])

  // Build the grid: earned stamps + empty slots up to PASSPORT_SIZE
  const totalSlots = Math.max(PASSPORT_SIZE, stamps.length)
  const slots = Array.from({ length: totalSlots }, (_, i) => stamps[i] || null)

  // Look up story title for a stamp
  function getStoryTitle(storyId: string) {
    return stories.find((s) => s.id === storyId)?.title || "Story"
  }

  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.04,
      },
    },
  }

  const stampVariants = {
    hidden: { opacity: 0, scale: 0.6 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 300, damping: 20 },
    },
  }

  return (
    <section
      aria-label="Reading Passport"
      className="rounded-2xl border border-primary/10 bg-surface p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <BookMarked className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-heading text-lg font-semibold text-text leading-tight">
            Reading Passport
          </h2>
          <p className="text-sm text-text-muted">
            {loading ? "Loading stamps..." : `${stamps.length} ${stamps.length === 1 ? "stamp" : "stamps"} collected`}
          </p>
        </div>
      </div>

      {/* Stamp grid */}
      {loading ? (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
          aria-hidden="true"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-full border-2 border-dashed border-primary/15 bg-primary/5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid gap-3 sm:gap-4"
          style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {slots.map((stamp, i) =>
            stamp ? (
              // Earned stamp
              <motion.div
                key={stamp.id}
                variants={stampVariants}
                className="flex flex-col items-center gap-1.5 group"
                title={getStoryTitle(stamp.storyId)}
              >
                <div
                  className="aspect-square w-full max-w-[72px] mx-auto rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform"
                  aria-label={`Stamp for ${getStoryTitle(stamp.storyId)}`}
                >
                  {stamp.stampType === "bonus" ? (
                    <Star className="w-5 h-5 text-white fill-white" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-[10px] text-text-muted text-center leading-tight line-clamp-2 w-full max-w-[72px] px-0.5">
                  {getStoryTitle(stamp.storyId)}
                </span>
              </motion.div>
            ) : (
              // Empty slot
              <motion.div
                key={`empty-${i}`}
                variants={stampVariants}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="aspect-square w-full max-w-[72px] mx-auto rounded-full border-2 border-dashed border-primary/20 bg-primary/5 flex items-center justify-center"
                  aria-label="Empty stamp slot"
                >
                  <span className="text-text-muted/40 font-heading font-bold text-lg select-none">
                    ?
                  </span>
                </div>
                <span className="text-[10px] text-transparent select-none">-</span>
              </motion.div>
            )
          )}
        </motion.div>
      )}

      {/* Footer note */}
      {!loading && stamps.length === 0 && (
        <p className="text-center text-sm text-text-muted mt-6">
          Finish your first story to earn a stamp!
        </p>
      )}
    </section>
  )
}
