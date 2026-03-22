"use client"

import { useState, useEffect } from "react"
import { Flower2, Loader2, PlusCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { GardenGrid } from "@/components/garden/garden-grid"
import { getGarden, PLANT_TYPES } from "@/lib/garden"
import type { GardenPlant } from "@/lib/types"

export default function GardenPage() {
  const activeProfile = useAppStore((s) => s.getActiveProfile())
  const [plants, setPlants] = useState<GardenPlant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeProfile?.id) return
    setLoading(true)
    getGarden(activeProfile.id)
      .then(setPlants)
      .finally(() => setLoading(false))
  }, [activeProfile?.id])

  const bloomCount = plants.filter((p) => p.growthStage === "bloom").length
  const sproutCount = plants.filter((p) => p.growthStage === "sprout").length
  const seedCount = plants.filter((p) => p.growthStage === "seed").length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text flex items-center gap-3">
            <Flower2 className="w-8 h-8 text-primary-light" />
            {activeProfile?.name ? `${activeProfile.name}'s` : "My"} Garden
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Finish stories to plant seeds and watch them grow
          </p>
        </div>
        {plants.length > 0 && (
          <div className="text-right text-sm text-text-muted space-y-1">
            <div>{bloomCount} bloomed</div>
            <div>{sproutCount} growing</div>
            <div>{seedCount} seeds</div>
          </div>
        )}
      </div>

      {/* Garden Grid */}
      <GardenGrid plants={plants} />

      {/* Plant Legend */}
      {plants.length > 0 && (
        <div className="bg-surface rounded-2xl border border-primary/10 p-6">
          <h2 className="font-heading text-lg font-semibold text-text mb-4">Your Plants</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {PLANT_TYPES.map((pt) => {
              const count = plants.filter((p) => p.plantType === pt.id).length
              if (count === 0) return null
              return (
                <div
                  key={pt.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-surface-alt"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: pt.color, boxShadow: `0 0 6px ${pt.color}40` }}
                  />
                  <span className="text-sm text-text">{pt.name}</span>
                  <span className="text-xs text-text-muted ml-auto">x{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state CTA */}
      {plants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-text-muted mb-4">Your garden is waiting for its first seed!</p>
          <Link href="/create">
            <Button>
              <PlusCircle className="w-5 h-5" />
              Create a Story
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
