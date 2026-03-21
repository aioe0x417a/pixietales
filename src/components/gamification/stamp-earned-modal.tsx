"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, X } from "lucide-react"

const AUTO_DISMISS_MS = 2500

interface StampEarnedModalProps {
  visible: boolean
  onClose: () => void
}

export function StampEarnedModal({ visible, onClose }: StampEarnedModalProps) {
  // Auto-dismiss after 2.5 s
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && (
        // Backdrop
        <motion.div
          key="stamp-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Stamp earned celebration"
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

          {/* Card */}
          <motion.div
            key="stamp-modal-card"
            className="relative z-10 w-full max-w-xs rounded-2xl bg-surface border border-amber-300/40 shadow-2xl p-8 flex flex-col items-center gap-4 text-center"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Pulsing golden star */}
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center shadow-lg"
              animate={{
                scale: [1, 1.12, 1],
                boxShadow: [
                  "0 0 0px 0px rgba(245,158,11,0)",
                  "0 0 24px 6px rgba(245,158,11,0.45)",
                  "0 0 0px 0px rgba(245,158,11,0)",
                ],
              }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              aria-hidden="true"
            >
              <Star className="w-10 h-10 text-white fill-white" />
            </motion.div>

            {/* Text */}
            <div>
              <h2 className="font-heading text-2xl font-bold text-text">
                Stamp Earned!
              </h2>
              <p className="text-text-muted text-sm mt-1">
                A new stamp has been added to your Reading Passport.
              </p>
            </div>

            {/* Sparkle row */}
            <SparkleRow />

            {/* Dismiss hint */}
            <p className="text-xs text-text-muted/60">Tap anywhere to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Lightweight sparkle decoration -- no external deps
function SparkleRow() {
  const sparkles = ["✦", "★", "✦", "★", "✦"]
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {sparkles.map((s, i) => (
        <motion.span
          key={i}
          className="text-amber-400 text-sm"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        >
          {s}
        </motion.span>
      ))}
    </div>
  )
}
