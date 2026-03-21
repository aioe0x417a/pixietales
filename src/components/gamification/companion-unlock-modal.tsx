"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { COMPANIONS, type Companion } from "@/lib/types"

interface CompanionUnlockModalProps {
  companion: Companion | null
  visible: boolean
  onClose: () => void
}

export function CompanionUnlockModal({
  companion,
  visible,
  onClose,
}: CompanionUnlockModalProps) {
  const companionDef = companion ? COMPANIONS.find((c) => c.value === companion) : null

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && companionDef && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label={`New companion unlocked: ${companionDef.label}`}
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto w-full max-w-xs rounded-3xl bg-surface border-2 border-primary/20 shadow-2xl p-8 flex flex-col items-center gap-4 text-center cursor-pointer"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-text-muted" />
              </button>

              {/* Stars burst */}
              <div className="relative flex items-center justify-center">
                {[...Array(8)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-sm"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0.5],
                      x: Math.cos((i * Math.PI * 2) / 8) * 48,
                      y: Math.sin((i * Math.PI * 2) / 8) * 48,
                    }}
                    transition={{ delay: 0.15 + i * 0.05, duration: 0.8 }}
                  >
                    ✨
                  </motion.span>
                ))}

                {/* Companion emoji with bounce-in */}
                <motion.span
                  className="text-6xl"
                  role="img"
                  aria-label={companionDef.label}
                  initial={{ scale: 0, rotate: -20, opacity: 1 }}
                  animate={{ scale: [0, 1.3, 1], rotate: [-20, 10, 0] }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 350, damping: 18 }}
                >
                  {companionDef.emoji}
                </motion.span>
              </div>

              {/* Text */}
              <div className="space-y-1">
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-primary/70">
                  New Companion!
                </p>
                <p className="font-heading text-2xl font-bold text-text">
                  {companionDef.label}
                </p>
                <p className="text-sm text-text-muted">
                  {companionDef.label} has joined your adventure!
                </p>
              </div>

              {/* Auto-dismiss hint */}
              <p className="text-xs text-text-muted/50">
                Tap anywhere to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
