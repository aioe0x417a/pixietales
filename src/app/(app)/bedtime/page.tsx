"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Moon,
  CloudMoon,
  CloudRain,
  Wind,
  Waves,
  TreePine,
  Music,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Timer,
  BookOpen,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { useAmbientAudio } from "@/components/audio/ambient-audio-provider"
import { AMBIENT_SOUNDS, type AmbientSoundId } from "@/lib/ambient-sounds"
import { cn } from "@/lib/utils"
import Link from "next/link"

const ICON_MAP: Record<string, React.ElementType> = {
  CloudRain,
  Waves,
  TreePine,
  Wind,
  Music,
  CloudMoon,
}

const BREATHING_STEPS = [
  { label: "Breathe In", duration: 4 },
  { label: "Hold", duration: 4 },
  { label: "Breathe Out", duration: 6 },
]

export default function BedtimePage() {
  const bedtimeMode = useAppStore((s) => s.bedtimeMode)
  const setBedtimeMode = useAppStore((s) => s.setBedtimeMode)
  const activeProfile = useAppStore((s) => s.getActiveProfile())

  const { isPlaying, currentSoundId, volume, toggle, stop, setVolume } = useAmbientAudio()

  const [showBreathing, setShowBreathing] = useState(false)
  const [breathingStep, setBreathingStep] = useState(0)
  const [breathingProgress, setBreathingProgress] = useState(0)
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null)
  const [timerRemaining, setTimerRemaining] = useState<number | null>(null)

  // Breathing exercise timer
  useEffect(() => {
    if (!showBreathing) return

    const step = BREATHING_STEPS[breathingStep]
    const interval = setInterval(() => {
      setBreathingProgress((p) => {
        if (p >= 100) {
          setBreathingStep((s) => (s + 1) % BREATHING_STEPS.length)
          return 0
        }
        return p + 100 / (step.duration * 10)
      })
    }, 100)

    return () => clearInterval(interval)
  }, [showBreathing, breathingStep])

  // Sleep timer
  useEffect(() => {
    if (timerMinutes === null) return

    setTimerRemaining(timerMinutes * 60)
    const interval = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev === null || prev <= 0) {
          stop()
          setTimerMinutes(null)
          setBedtimeMode(false)
          return null
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerMinutes, stop, setBedtimeMode])

  function handleToggleSound(soundId: AmbientSoundId) {
    toggle(soundId)
  }

  function handleVolumeChange(newVol: number) {
    setVolume(newVol)
  }

  function handleExitBedtime() {
    stop()
    setBedtimeMode(false)
    setTimerMinutes(null)
    setTimerRemaining(null)
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div
      className={cn(
        "transition-all duration-1000",
        bedtimeMode && "bedtime-mode"
      )}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold">
            <Moon className="w-8 h-8 inline-block mr-2 text-primary" />
            Bedtime Mode
          </h1>
          <p className="text-text-muted mt-1">
            Wind down with calming sounds, breathing exercises, and a story.
          </p>
        </div>
        <Button
          variant={bedtimeMode ? "secondary" : "primary"}
          onClick={() => {
            if (bedtimeMode) {
              handleExitBedtime()
            } else {
              setBedtimeMode(true)
            }
          }}
        >
          {bedtimeMode ? (
            <>
              <Sun className="w-5 h-5" />
              Exit Bedtime
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              Start Bedtime
            </>
          )}
        </Button>
      </div>

      {/* Bedtime Routine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sleep Sounds */}
        <div>
          <h2 className="font-heading text-xl font-semibold mb-4">
            Sleep Sounds
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AMBIENT_SOUNDS.map((sound) => {
              const isActive = currentSoundId === sound.id
              const Icon = ICON_MAP[sound.icon] || CloudMoon
              return (
                <button
                  key={sound.id}
                  onClick={() => handleToggleSound(sound.id)}
                  aria-pressed={isActive}
                  aria-label={`${sound.name} sound${isActive ? " (playing)" : ""}`}
                  className={cn(
                    "flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all cursor-pointer",
                    isActive
                      ? "border-primary/40 shadow-lg"
                      : "border-primary/10 hover:border-primary/20"
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: `${sound.color}10`,
                          borderColor: sound.color,
                        }
                      : {}
                  }
                >
                  <Icon
                    className={cn(
                      "w-8 h-8 transition-all",
                      isActive && "animate-pulse"
                    )}
                    style={{ color: isActive ? sound.color : undefined }}
                  />
                  <span className="text-sm font-semibold">{sound.name}</span>
                  {isActive && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: sound.color }}
                    >
                      Playing
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Volume */}
          {isPlaying && (
            <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-surface-alt">
              <VolumeX className="w-4 h-4 text-text-muted" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 accent-primary"
                aria-label="Volume"
              />
              <Volume2 className="w-4 h-4 text-text-muted" />
            </div>
          )}

          {/* Timer */}
          <div className="mt-6">
            <h3 className="font-heading font-semibold text-sm mb-3">
              <Timer className="w-4 h-4 inline-block mr-1" />
              Sleep Timer
            </h3>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() =>
                    setTimerMinutes(timerMinutes === mins ? null : mins)
                  }
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                    timerMinutes === mins
                      ? "bg-primary text-white"
                      : "bg-surface-alt text-text-muted hover:bg-primary/10"
                  )}
                >
                  {mins}m
                </button>
              ))}
            </div>
            {timerRemaining !== null && (
              <p className="text-sm text-primary font-semibold mt-2">
                Time remaining: {formatTime(timerRemaining)}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Breathing Exercise */}
          <div>
            <h2 className="font-heading text-xl font-semibold mb-4">
              Breathing Exercise
            </h2>
            <div className="p-6 rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/5 to-accent/5 text-center">
              {showBreathing ? (
                <div>
                  <motion.div
                    animate={{
                      scale:
                        breathingStep === 0
                          ? [1, 1.3]
                          : breathingStep === 1
                            ? 1.3
                            : [1.3, 1],
                    }}
                    transition={{
                      duration: BREATHING_STEPS[breathingStep].duration,
                    }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center"
                  >
                    <Wind className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="font-heading text-2xl font-bold text-primary mb-2">
                    {BREATHING_STEPS[breathingStep].label}
                  </p>
                  <p className="text-sm text-text-muted">
                    {BREATHING_STEPS[breathingStep].duration} seconds
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBreathing(false)}
                    className="mt-4"
                  >
                    Stop
                  </Button>
                </div>
              ) : (
                <div>
                  <Wind className="w-12 h-12 text-primary/40 mx-auto mb-3" />
                  <p className="text-text-muted mb-4">
                    A calming 4-4-6 breathing pattern to help wind down.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBreathing(true)
                      setBreathingStep(0)
                      setBreathingProgress(0)
                    }}
                  >
                    <Play className="w-4 h-4" />
                    Start Breathing
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Story */}
          <div>
            <h2 className="font-heading text-xl font-semibold mb-4">
              Bedtime Story
            </h2>
            <Link href="/create">
              <div className="p-6 rounded-2xl border border-primary/10 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer text-center group">
                <BookOpen className="w-12 h-12 text-primary/40 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-heading font-semibold text-text mb-1">
                  {activeProfile
                    ? `Create a bedtime story for ${activeProfile.name}`
                    : "Create a bedtime story"}
                </p>
                <p className="text-sm text-text-muted">
                  A gentle, calming tale to end the day
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
