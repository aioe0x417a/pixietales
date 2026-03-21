"use client"

import { createContext, useContext, useRef, useCallback, useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import type { AmbientSoundId } from "@/lib/ambient-sounds"
import { getSoundUrl } from "@/lib/ambient-sounds"

interface AmbientAudioContextType {
  isPlaying: boolean
  currentSoundId: AmbientSoundId | null
  volume: number
  play: (soundId: AmbientSoundId) => void
  stop: () => void
  setVolume: (vol: number) => void
  toggle: (soundId: AmbientSoundId) => void
  fadeIn: (soundId: AmbientSoundId, targetVolume: number, durationMs?: number) => void
  fadeOut: (durationMs?: number) => void
}

const AmbientAudioContext = createContext<AmbientAudioContextType>({
  isPlaying: false,
  currentSoundId: null,
  volume: 0.4,
  play: () => {},
  stop: () => {},
  setVolume: () => {},
  toggle: () => {},
  fadeIn: () => {},
  fadeOut: () => {},
})

export function useAmbientAudio() {
  return useContext(AmbientAudioContext)
}

// Fetch and decode audio into an AudioBuffer (cached)
const bufferCache = new Map<string, AudioBuffer>()

async function loadAudioBuffer(ctx: AudioContext, soundId: AmbientSoundId): Promise<AudioBuffer> {
  const cached = bufferCache.get(soundId)
  if (cached) return cached

  const url = getSoundUrl(soundId)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load sound: ${soundId}`)

  const arrayBuffer = await response.arrayBuffer()
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
  bufferCache.set(soundId, audioBuffer)
  return audioBuffer
}

export function AmbientAudioProvider({ children }: { children: React.ReactNode }) {
  const storeVolume = useAppStore((s) => s.ambientVolume)
  const storeSoundId = useAppStore((s) => s.ambientSoundId)
  const storeEnabled = useAppStore((s) => s.ambientEnabled)
  const setAmbientSound = useAppStore((s) => s.setAmbientSound)
  const setAmbientVolume = useAppStore((s) => s.setAmbientVolume)
  const setAmbientEnabled = useAppStore((s) => s.setAmbientEnabled)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentSoundRef = useRef<AmbientSoundId | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSoundId, setCurrentSoundId] = useState<AmbientSoundId | null>(null)
  const [volume, setVolumeState] = useState(storeVolume)

  function getAudioContext() {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
      gainRef.current = audioCtxRef.current.createGain()
      gainRef.current.gain.value = volume
      gainRef.current.connect(audioCtxRef.current.destination)
    }
    // Resume if suspended (autoplay policy)
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  function clearFadeTimer() {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }

  function stopSource() {
    try {
      sourceRef.current?.stop()
    } catch {
      // Already stopped
    }
    sourceRef.current = null
  }

  const play = useCallback(async (soundId: AmbientSoundId) => {
    try {
      const ctx = getAudioContext()
      const gain = gainRef.current!

      // Stop current sound if different
      if (currentSoundRef.current && currentSoundRef.current !== soundId) {
        stopSource()
      } else if (currentSoundRef.current === soundId && sourceRef.current) {
        // Already playing this sound
        return
      }

      clearFadeTimer()

      const buffer = await loadAudioBuffer(ctx, soundId)

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      source.start(0)

      sourceRef.current = source
      currentSoundRef.current = soundId

      gain.gain.value = volume

      setIsPlaying(true)
      setCurrentSoundId(soundId)
      setAmbientSound(soundId)
      setAmbientEnabled(true)
    } catch (err) {
      console.error("Ambient audio play failed:", err)
    }
  }, [volume, setAmbientSound, setAmbientEnabled])

  const stop = useCallback(() => {
    clearFadeTimer()
    stopSource()
    currentSoundRef.current = null

    setIsPlaying(false)
    setCurrentSoundId(null)
    setAmbientSound(null)
    setAmbientEnabled(false)
  }, [setAmbientSound, setAmbientEnabled])

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol))
    setVolumeState(clamped)
    setAmbientVolume(clamped)
    if (gainRef.current) {
      gainRef.current.gain.value = clamped
    }
  }, [setAmbientVolume])

  const toggle = useCallback((soundId: AmbientSoundId) => {
    if (currentSoundRef.current === soundId && isPlaying) {
      stop()
    } else {
      play(soundId)
    }
  }, [isPlaying, play, stop])

  const fadeIn = useCallback((soundId: AmbientSoundId, targetVolume: number, durationMs = 2000) => {
    const startVolume = 0
    const steps = durationMs / 50
    const increment = targetVolume / steps
    let current = startVolume

    // Set volume to 0 before playing
    if (gainRef.current) {
      gainRef.current.gain.value = 0
    }

    play(soundId).then(() => {
      if (gainRef.current) {
        gainRef.current.gain.value = 0
      }

      clearFadeTimer()
      fadeTimerRef.current = setInterval(() => {
        current += increment
        if (current >= targetVolume) {
          current = targetVolume
          clearFadeTimer()
        }
        if (gainRef.current) {
          gainRef.current.gain.value = current
        }
        setVolumeState(current)
      }, 50)
    })
  }, [play])

  const fadeOut = useCallback((durationMs = 1500) => {
    if (!gainRef.current || !isPlaying) return

    const startVolume = gainRef.current.gain.value
    const steps = durationMs / 50
    const decrement = startVolume / steps
    let current = startVolume

    clearFadeTimer()
    fadeTimerRef.current = setInterval(() => {
      current -= decrement
      if (current <= 0) {
        current = 0
        clearFadeTimer()
        stop()
        return
      }
      if (gainRef.current) {
        gainRef.current.gain.value = current
      }
    }, 50)
  }, [isPlaying, stop])

  // Restore ambient sound on mount if store says it was enabled
  useEffect(() => {
    if (storeEnabled && storeSoundId) {
      // Use a small delay to allow user gesture context from navigation
      const timer = setTimeout(() => {
        play(storeSoundId)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- restore once on mount only

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearFadeTimer()
      stopSource()
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [])

  return (
    <AmbientAudioContext.Provider
      value={{
        isPlaying,
        currentSoundId,
        volume,
        play,
        stop,
        setVolume,
        toggle,
        fadeIn,
        fadeOut,
      }}
    >
      {children}
    </AmbientAudioContext.Provider>
  )
}
