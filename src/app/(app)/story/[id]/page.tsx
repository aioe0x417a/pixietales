"use client"

import { useState, useEffect, useRef, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  VolumeX,
  Pause,
  Play,
  Trash2,
  Home,
  Loader2,
  Music2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { getSupabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { useAmbientAudio } from "@/components/audio/ambient-audio-provider"
import { getSoundForTheme, AMBIENT_SOUNDS } from "@/lib/ambient-sounds"
import { toast } from "sonner"

export default function StoryReaderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const story = useAppStore((s) => s.getStory(id))
  const removeStory = useAppStore((s) => s.removeStory)
  const updateChapterAudioUrl = useAppStore((s) => s.updateChapterAudioUrl)

  const narrationVoice = story?.narrationVoice || "en-US-JennyNeural"
  const bedtimeMode = useAppStore((s) => s.bedtimeMode)
  const ambient = useAmbientAudio()

  const [currentChapter, setCurrentChapter] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Cache audio URLs per chapter+voice combo in this session
  const audioCache = useRef<Map<string, string>>(new Map())

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

  // Stop playback when chapter changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setIsPlaying(false)
    setAudioProgress(0)
    setAudioDuration(0)
  }, [currentChapter])

  const getCacheKey = useCallback(
    (chapterIdx: number) => `${id}-${chapterIdx}-${narrationVoice}`,
    [id, narrationVoice]
  )

  const generateAudio = useCallback(async (chapterIdx: number): Promise<string | null> => {
    const cacheKey = getCacheKey(chapterIdx)

    // Check in-memory session cache
    const cached = audioCache.current.get(cacheKey)
    if (cached) return cached

    // Check if story already has a stored audioUrl for this chapter
    const chap = story?.chapters[chapterIdx]
    if (chap?.audioUrl && !chap.audioUrl.startsWith("data:")) {
      audioCache.current.set(cacheKey, chap.audioUrl)
      return chap.audioUrl
    }

    try {
      const { data: { session } } = await getSupabase().auth.getSession()
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          text: chap?.content || "",
          voice: narrationVoice,
          storyId: id,
          chapterIndex: chapterIdx,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `TTS failed (${response.status})`)
      }

      const { audioUrl } = await response.json()
      audioCache.current.set(cacheKey, audioUrl)

      // Persist the URL to the store (syncs to Supabase)
      updateChapterAudioUrl(id, chapterIdx, audioUrl)

      return audioUrl
    } catch (err) {
      console.error("TTS generation error:", err)
      toast.error((err as Error).message || "Failed to generate narration")
      return null
    }
  }, [id, narrationVoice, story?.chapters, getCacheKey, updateChapterAudioUrl])

  // Prefetch audio for current chapter when chapter changes
  useEffect(() => {
    if (story?.narrationEnabled !== false) {
      generateAudio(currentChapter).catch(() => {})
    }
  }, [currentChapter, story?.narrationEnabled])

  // Auto-start ambient sound when narration starts playing
  useEffect(() => {
    if (isPlaying && !ambient.isPlaying && story?.theme) {
      const soundId = getSoundForTheme(story.theme)
      ambient.fadeIn(soundId, 0.6, 2000)
    }
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps -- trigger on narration play state

  async function playChapter(chapterIdx: number) {
    setIsLoading(true)

    const audioUrl = await generateAudio(chapterIdx)
    if (!audioUrl) {
      setIsLoading(false)
      return
    }

    // Create or reuse audio element
    if (!audioRef.current) {
      audioRef.current = new Audio()
    }

    const audio = audioRef.current
    audio.src = audioUrl
    audio.load()

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration)
    }

    audio.ontimeupdate = () => {
      setAudioProgress(audio.currentTime)
    }

    audio.onended = () => {
      setIsPlaying(false)
      setAudioProgress(0)
      // Auto-advance to next chapter
      if (story && chapterIdx < story.chapters.length - 1) {
        const nextIdx = chapterIdx + 1
        setCurrentChapter(nextIdx)
        // Auto-play next chapter after a brief pause
        setTimeout(() => playChapter(nextIdx), 500)
      }
    }

    audio.onerror = () => {
      setIsPlaying(false)
      setIsLoading(false)
      toast.error("Audio playback failed")
    }

    try {
      await audio.play()
      setIsPlaying(true)
      // Prefetch next chapter audio
      if (story && chapterIdx < story.chapters.length - 1) {
        generateAudio(chapterIdx + 1).catch(() => {})
      }
    } catch {
      toast.error("Audio playback failed")
    }
    setIsLoading(false)
  }

  function togglePlayback() {
    if (isLoading) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else if (audioRef.current?.src && audioRef.current.src !== window.location.href) {
      // Resume existing audio
      audioRef.current.play()
      setIsPlaying(true)
    } else {
      // Start fresh
      playChapter(currentChapter)
    }
  }

  function stopPlayback() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setIsPlaying(false)
    setAudioProgress(0)
    setAudioDuration(0)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setAudioProgress(time)
    }
  }

  function handleDelete() {
    if (confirm("Delete this story? This cannot be undone.")) {
      stopPlayback()
      removeStory(story!.id)
      toast.success("Story deleted")
      router.push("/library")
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  if (!story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BookOpen className="w-16 h-16 text-primary/30 mb-6" />
        <h1 className="font-heading text-2xl font-bold text-text mb-4">
          Story Not Found
        </h1>
        <Button onClick={() => router.push("/library")}>
          Go to Library
        </Button>
      </div>
    )
  }

  const chapter = story.chapters[currentChapter]
  const isFirst = currentChapter === 0
  const isLast = currentChapter === story.chapters.length - 1

  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BookOpen className="w-16 h-16 text-primary/30 mb-6" />
        <h1 className="font-heading text-2xl font-bold text-text mb-4">
          Chapter Not Found
        </h1>
        <Button onClick={() => router.push("/library")}>
          Go to Library
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            stopPlayback()
            router.push("/library")
          }}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            aria-label="Delete this story"
          >
            <Trash2 className="w-5 h-5 text-error" />
          </Button>
        </div>
      </div>

      {/* Story Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-heading text-3xl font-bold text-text mb-2">
          {story.title}
        </h1>
        <p className="text-text-muted text-sm">
          A story for {story.childName} &middot; {story.chapters.length}{" "}
          chapters
        </p>
      </motion.div>

      {/* Chapter Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentChapter}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Chapter Image */}
          {chapter.imageUrl && (chapter.imageUrl.startsWith("data:image/") || chapter.imageUrl.startsWith("https://")) ? (
            <div className="rounded-2xl overflow-hidden shadow-lg border border-primary/10">
              <img
                src={chapter.imageUrl}
                alt={chapter.title}
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 aspect-[4/3] flex items-center justify-center border border-primary/10">
              <BookOpen className="w-16 h-16 text-primary/20" />
            </div>
          )}

          {/* Chapter Title */}
          <div className="text-center">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Chapter {currentChapter + 1}
            </span>
            <h2 className="font-heading text-2xl font-bold text-text mt-1">
              {chapter.title}
            </h2>
          </div>

          {/* Chapter Content */}
          <div className="prose prose-lg max-w-none">
            <p className="text-text leading-relaxed text-lg whitespace-pre-wrap">
              {chapter.content}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Audio Player Bar (inline) */}
      {story.narrationEnabled !== false && (
        <div className="mt-8 max-w-md mx-auto">
          <div className="bg-surface border border-primary/10 rounded-2xl shadow-lg px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayback}
                disabled={isLoading}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer",
                  isPlaying
                    ? "bg-primary text-white"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
                aria-label={isPlaying ? "Pause narration" : "Play narration"}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              {/* Progress + Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-text truncate">
                    Ch. {currentChapter + 1}: {chapter.title}
                  </p>
                  {audioDuration > 0 && (
                    <span className="text-[10px] text-text-muted ml-2 shrink-0">
                      {formatTime(audioProgress)} / {formatTime(audioDuration)}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <input
                  type="range"
                  min={0}
                  max={audioDuration || 0}
                  step={0.1}
                  value={audioProgress}
                  onChange={handleSeek}
                  className="w-full h-1 bg-primary/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  aria-label="Audio progress"
                />
              </div>

              {/* Stop Button */}
              {(isPlaying || audioProgress > 0) && (
                <button
                  onClick={stopPlayback}
                  className="text-text-muted hover:text-error transition-colors cursor-pointer p-1"
                  aria-label="Stop narration"
                >
                  <VolumeX className="w-4 h-4" />
                </button>
              )}

              {/* Ambient Sound Toggle */}
              <button
                onClick={() => {
                  if (ambient.isPlaying) {
                    ambient.fadeOut(800)
                  } else {
                    const soundId = getSoundForTheme(story.theme)
                    ambient.fadeIn(soundId, 0.6, 800)
                  }
                }}
                aria-label={ambient.isPlaying
                  ? `Stop ambient sound (${AMBIENT_SOUNDS.find((s) => s.id === ambient.currentSoundId)?.name || ""})`
                  : "Play ambient sound"
                }
                aria-pressed={ambient.isPlaying}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer",
                  ambient.isPlaying
                    ? "bg-accent/20 text-accent"
                    : "bg-surface-alt text-text-muted hover:text-accent"
                )}
                title={ambient.isPlaying
                  ? `${AMBIENT_SOUNDS.find((s) => s.id === ambient.currentSoundId)?.name || "Ambient"} playing`
                  : "Ambient sound off"
                }
              >
                {ambient.isPlaying ? (
                  <Music2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-primary/10 pb-8">
        <Button
          variant="outline"
          onClick={() => setCurrentChapter((p) => p - 1)}
          disabled={isFirst}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </Button>

        {/* Chapter dots */}
        <div className="flex items-center gap-2">
          {story.chapters.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentChapter(i)}
              aria-label={`Go to chapter ${i + 1}`}
              aria-current={i === currentChapter ? "true" : undefined}
              className={cn(
                "w-3 h-3 rounded-full transition-all cursor-pointer",
                i === currentChapter
                  ? "bg-primary scale-125"
                  : "bg-primary/20 hover:bg-primary/40"
              )}
            />
          ))}
        </div>

        {isLast ? (
          <Button onClick={() => {
            stopPlayback()
            router.push("/dashboard")
          }}>
            <Home className="w-4 h-4" />
            Finish
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentChapter((p) => p + 1)}
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
