"use client"

import { motion } from "framer-motion"

// Plant type colors
const PLANT_COLORS: Record<string, string> = {
  moonflower: "#C4B5FD",
  starbloom: "#FBBF24",
  crystal_fern: "#38BDF8",
  nebula_orchid: "#F472B6",
  aurora_vine: "#34D399",
  void_lily: "#8B5CF6",
  comet_rose: "#FB923C",
}

interface PlantSpriteProps {
  plantType: string
  growthStage: "seed" | "sprout" | "bloom"
  isNew?: boolean // triggers entrance animation
}

export function PlantSprite({ plantType, growthStage, isNew }: PlantSpriteProps) {
  const color = PLANT_COLORS[plantType] || "#8B5CF6"

  // Seed: tiny glowing dot
  if (growthStage === "seed") {
    return (
      <motion.div
        initial={isNew ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        className="w-3 h-3 rounded-full twinkle"
        style={{ backgroundColor: `${color}40`, boxShadow: `0 0 6px ${color}30` }}
      />
    )
  }

  // Sprout: stem + small leaf shape
  if (growthStage === "sprout") {
    return (
      <motion.div
        initial={isNew ? { scale: 0, y: 10 } : false}
        animate={{ scale: 1, y: 0 }}
        className="flex flex-col items-center float"
      >
        {/* Leaf */}
        <div
          className="w-4 h-5 rounded-full"
          style={{
            backgroundColor: `${color}60`,
            boxShadow: `0 0 8px ${color}30`,
            borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          }}
        />
        {/* Stem */}
        <div className="w-0.5 h-3" style={{ backgroundColor: `${color}50` }} />
      </motion.div>
    )
  }

  // Bloom: full flower with petals
  return (
    <motion.div
      initial={isNew ? { scale: 0, rotate: -180 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 12 }}
      className="relative flex flex-col items-center"
    >
      {/* Glow */}
      <div
        className="absolute -inset-1 rounded-full pulse-glow opacity-50"
        style={{ backgroundColor: `${color}15` }}
      />
      {/* Petals - 5 arranged in a circle */}
      <div className="relative w-10 h-10">
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <div
            key={i}
            className="absolute w-3.5 h-5 rounded-full"
            style={{
              backgroundColor: color,
              opacity: 0.8,
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-6px)`,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              boxShadow: `0 0 6px ${color}40`,
            }}
          />
        ))}
        {/* Center */}
        <div
          className="absolute w-3 h-3 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ backgroundColor: `${color}`, boxShadow: `0 0 10px ${color}60` }}
        />
      </div>
      {/* Stem */}
      <div className="w-0.5 h-3 -mt-1" style={{ backgroundColor: `${color}50` }} />
    </motion.div>
  )
}
