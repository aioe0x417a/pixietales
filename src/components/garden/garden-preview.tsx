"use client"

import { useState, useEffect } from "react"
import { Flower2, Loader2 } from "lucide-react"
import Link from "next/link"
import { GardenGrid } from "./garden-grid"
import { getGarden } from "@/lib/garden"
import type { GardenPlant } from "@/lib/types"

interface GardenPreviewProps {
  childProfileId: string
}

export function GardenPreview({ childProfileId }: GardenPreviewProps) {
  const [plants, setPlants] = useState<GardenPlant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!childProfileId) return
    setLoading(true)
    getGarden(childProfileId)
      .then(setPlants)
      .finally(() => setLoading(false))
  }, [childProfileId])

  const bloomCount = plants.filter((p) => p.growthStage === "bloom").length

  return (
    <Link href="/garden" className="block">
      <div className="bg-surface rounded-2xl border border-primary/10 p-4 hover:border-primary/30 transition-all cursor-pointer glow-card">
        <div className="flex items-center gap-2 mb-3">
          <Flower2 className="w-5 h-5 text-primary-light" />
          <h3 className="font-heading text-sm font-semibold text-text">Magical Garden</h3>
          {plants.length > 0 && (
            <span className="ml-auto text-xs text-text-muted">
              {bloomCount} bloomed / {plants.length} planted
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </div>
        ) : (
          <GardenGrid plants={plants} compact />
        )}
      </div>
    </Link>
  )
}
