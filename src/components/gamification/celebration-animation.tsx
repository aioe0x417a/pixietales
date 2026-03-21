"use client"

import { useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Sparkles } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ParticleType = "star" | "sparkle" | "firefly"

interface Particle {
  id: number
  type: ParticleType
  angle: number       // radians
  distance: number    // px
  size: number        // px
  rotation: number    // degrees
  delay: number       // seconds
  duration: number    // seconds
}

// ---------------------------------------------------------------------------
// Deterministic particle generation (no Math.random → no hydration mismatch)
// ---------------------------------------------------------------------------

function generateParticles(count: number): Particle[] {
  const types: ParticleType[] = ["star", "sparkle", "firefly"]

  return Array.from({ length: count }, (_, i) => {
    // Spread particles evenly around 360° with a slight golden-ratio offset so
    // they don't clump even when count changes.
    const goldenAngle = 2.39996323 // radians ≈ 137.5°
    const angle = i * goldenAngle

    // Use trigonometric stepping to get pseudo-random values that are fully
    // deterministic and safe for SSR.
    const t1 = Math.abs(Math.sin(i * 17.3 + 1.1))   // 0–1
    const t2 = Math.abs(Math.sin(i * 31.7 + 2.3))   // 0–1
    const t3 = Math.abs(Math.sin(i * 7.91 + 3.7))   // 0–1
    const t4 = Math.abs(Math.sin(i * 11.1 + 0.5))   // 0–1
    const t5 = Math.abs(Math.sin(i * 43.1 + 5.1))   // 0–1

    const distance = 150 + t1 * 250          // 150–400 px
    const size     = 12  + t2 * 16           // 12–28 px
    const rotation = t3  * 720 - 360         // –360 to +360 deg
    const delay    = t4  * 0.3               // 0–0.3 s
    const duration = 1.5 + t5 * 1.0          // 1.5–2.5 s
    const type     = types[i % 3]

    return { id: i, type, angle, distance, size, rotation, delay, duration }
  })
}

const PARTICLES = generateParticles(28)

// ---------------------------------------------------------------------------
// Particle colours
// ---------------------------------------------------------------------------

const PARTICLE_COLORS: Record<ParticleType, string> = {
  star:     "#FFD700",
  sparkle:  "var(--color-primary)",
  firefly:  "#FFF4B8",
}

// ---------------------------------------------------------------------------
// Single animated particle
// ---------------------------------------------------------------------------

function ParticleNode({ p }: { p: Particle }) {
  const dx = Math.cos(p.angle) * p.distance
  const dy = Math.sin(p.angle) * p.distance
  const color = PARTICLE_COLORS[p.type]

  const particleVariants = {
    hidden: {
      x: 0,
      y: 0,
      opacity: 0,
      scale: 0,
      rotate: 0,
    },
    visible: {
      x: dx,
      y: dy,
      opacity: [0, 1, 1, 0],
      scale: [0, 1.2, 1, 0.6],
      rotate: p.rotation,
      transition: {
        duration: p.duration,
        delay: p.delay,
        ease: "easeOut" as const,
        opacity: {
          times: [0, 0.15, 0.7, 1],
          duration: p.duration,
          delay: p.delay,
        },
        scale: {
          times: [0, 0.15, 0.7, 1],
          duration: p.duration,
          delay: p.delay,
          ease: "easeOut" as const,
        },
      },
    },
  }

  const iconProps = {
    size: p.size,
    color,
    style: { filter: p.type === "firefly" ? `drop-shadow(0 0 6px ${color})` : `drop-shadow(0 0 3px ${color})` },
  }

  return (
    <motion.div
      className="absolute top-1/2 left-1/2 pointer-events-none"
      style={{ marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
      variants={particleVariants}
      initial="hidden"
      animate="visible"
    >
      {p.type === "star" && <Star {...iconProps} fill={color} />}
      {p.type === "sparkle" && <Sparkles {...iconProps} />}
      {p.type === "firefly" && (
        <div
          style={{
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: color,
            boxShadow: `0 0 ${p.size}px ${p.size / 2}px ${color}`,
          }}
        />
      )}
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Streak lines (subtle radial lines behind particles)
// ---------------------------------------------------------------------------

function StreakLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: "visible" }}
    >
      {PARTICLES.filter((_, i) => i % 2 === 0).map((p) => {
        const cx = 0   // relative to center via transform
        const cy = 0
        const ex = Math.cos(p.angle) * (p.distance * 0.55)
        const ey = Math.sin(p.angle) * (p.distance * 0.55)
        const color = PARTICLE_COLORS[p.type]

        return (
          <motion.line
            key={p.id}
            x1={cx}
            y1={cy}
            x2={ex}
            y2={ey}
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: [0, 0.5, 0], pathLength: [0, 1, 1] }}
            transition={{
              duration: p.duration * 0.6,
              delay: p.delay,
              ease: "easeOut",
            }}
            style={{
              transformOrigin: "center",
              // Position lines from center of screen
              transform: "translate(50vw, 50vh)",
            }}
          />
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CelebrationAnimation({ onComplete }: { onComplete: () => void }) {
  const reducedMotion =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false

  const calledRef = useRef(false)

  useEffect(() => {
    const delay = reducedMotion ? 2000 : 3000
    const timer = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true
        onComplete()
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [onComplete, reducedMotion])

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        style={{ background: "rgba(10, 5, 30, 0.72)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Streak lines layer */}
        {!reducedMotion && <StreakLines />}

        {/* Particles layer */}
        {!reducedMotion && (
          <div className="absolute inset-0" aria-hidden="true">
            {PARTICLES.map((p) => (
              <ParticleNode key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* Center "Well Done!" text */}
        <motion.div
          className="relative z-10 flex flex-col items-center gap-3 select-none"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 18,
            delay: reducedMotion ? 0 : 0.1,
          }}
        >
          {/* Glowing ring behind text */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 220,
              height: 220,
              background:
                "radial-gradient(circle, rgba(255,215,0,0.18) 0%, rgba(124,58,237,0.12) 60%, transparent 100%)",
              filter: "blur(12px)",
            }}
            animate={
              reducedMotion
                ? {}
                : {
                    scale: [1, 1.15, 1],
                    opacity: [0.7, 1, 0.7],
                  }
            }
            transition={{
              repeat: Infinity,
              duration: 1.8,
              ease: "easeInOut",
            }}
          />

          <motion.h2
            className="font-heading text-6xl sm:text-7xl font-bold text-white drop-shadow-lg relative z-10"
            style={{
              textShadow:
                "0 0 24px rgba(255,215,0,0.7), 0 2px 8px rgba(0,0,0,0.6)",
              letterSpacing: "-0.01em",
            }}
            animate={
              reducedMotion
                ? {}
                : {
                    scale: [1, 1.04, 1],
                  }
            }
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeInOut",
            }}
          >
            Well Done!
          </motion.h2>

          <motion.p
            className="text-white/80 text-lg sm:text-xl font-medium relative z-10"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reducedMotion ? 0.1 : 0.4, duration: 0.5 }}
          >
            You finished the story!
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
