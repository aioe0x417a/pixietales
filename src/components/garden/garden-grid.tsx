"use client"

import { motion } from "framer-motion"
import { PlantSprite } from "./plant-sprite"
import type { GardenPlant } from "@/lib/types"

interface GardenGridProps {
  plants: GardenPlant[]
  compact?: boolean // for dashboard preview
}

// 8 deterministic star positions for background
const STARS = [
  { x: 10, y: 12, size: 2, delay: 0 },
  { x: 75, y: 8, size: 1.5, delay: 0.4 },
  { x: 45, y: 18, size: 2.5, delay: 0.8 },
  { x: 88, y: 25, size: 1, delay: 1.2 },
  { x: 22, y: 80, size: 2, delay: 1.6 },
  { x: 60, y: 75, size: 1.5, delay: 2.0 },
  { x: 35, y: 90, size: 2, delay: 2.4 },
  { x: 82, y: 85, size: 1, delay: 2.8 },
]

export function GardenGrid({ plants, compact = false }: GardenGridProps) {
  // Build a lookup: "col-row" -> plant
  const plantMap = new Map<string, GardenPlant>()
  for (const plant of plants) {
    plantMap.set(`${plant.gridCol}-${plant.gridRow}`, plant)
  }

  const cols = 6
  const rows = 4
  const cellSize = compact ? "w-10 h-12" : "w-16 h-20"

  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-primary/10"
      style={{ background: "linear-gradient(180deg, #0B0D1F 0%, #0F1520 60%, #101A18 100%)" }}
      role="img"
      aria-label={`Magical garden with ${plants.length} plants growing`}
    >
      {/* Stars */}
      {STARS.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            backgroundColor: "#C4B5FD",
            opacity: 0.4,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}

      {/* Grid */}
      <div className={`relative z-10 grid grid-cols-6 gap-1 ${compact ? "p-3" : "p-6"}`}>
        <motion.div
          className="contents"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {Array.from({ length: rows * cols }, (_, i) => {
            const col = i % cols
            const row = Math.floor(i / cols)
            const plant = plantMap.get(`${col}-${row}`)

            return (
              <motion.div
                key={`${col}-${row}`}
                variants={{
                  hidden: { opacity: 0, y: 5 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`${cellSize} flex items-center justify-center rounded-lg`}
                title={plant ? `${plant.plantType} (${plant.growthStage})` : "Empty plot"}
              >
                {plant ? (
                  <PlantSprite
                    plantType={plant.plantType}
                    growthStage={plant.growthStage}
                  />
                ) : (
                  /* Empty dirt mound */
                  <div className="w-3 h-1.5 rounded-full bg-primary/10" />
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Empty state overlay */}
      {plants.length === 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <p className={`text-text-muted ${compact ? "text-xs" : "text-sm"} text-center px-4`}>
            Finish a story to plant your first seed!
          </p>
        </div>
      )}
    </div>
  )
}
