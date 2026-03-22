"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PlantSprite } from "./plant-sprite"

// Plant name lookup
const PLANT_NAMES: Record<string, string> = {
  moonflower: "Moonflower",
  starbloom: "Starbloom",
  crystal_fern: "Crystal Fern",
  nebula_orchid: "Nebula Orchid",
  aurora_vine: "Aurora Vine",
  void_lily: "Void Lily",
  comet_rose: "Comet Rose",
}

interface GardenBloomModalProps {
  plantType: string
  onClose: () => void
}

export function GardenBloomModal({ plantType, onClose }: GardenBloomModalProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const name = PLANT_NAMES[plantType] || "Plant"

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-surface rounded-3xl p-8 text-center border border-primary/20 shadow-xl max-w-xs mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Plant display */}
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 flex items-center justify-center">
              <PlantSprite plantType={plantType} growthStage="bloom" isNew />
            </div>
          </div>

          <h3 className="font-heading text-xl font-bold text-text mb-2">
            Your garden bloomed!
          </h3>
          <p className="text-text-muted text-sm">
            {name} has reached full bloom
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
