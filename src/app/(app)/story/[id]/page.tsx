"use client"

import { useState, useEffect, useRef, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Trash2,
  Home,
  Loader2,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
import { NARRATION_VOICES, getVoicesForLanguage, getDefaultVoice, type NarrationVoiceOption, type StoryLanguage } from "@/lib/types"
import { getSupabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
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
  const narrationVoice = useAppStore((s) => s.narrationVoice)
  const setNarrationVoice = useAppStore((s) => s.setNarrationVoice)
  const updateChapterAudioUrl = useAppStore((s) => s.updateChapterAudioUrl)

  const [currentChapter, setCurrentChapter] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showVoiceMenu, setShowVoiceMenu] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const voiceMenuRef = useRef<HTMLDivElement>(null)
  // Cache audio URLs per chapter+voice combo in this session
  const audioCache = useRef<Map<string, string>>(new Map())

  // Close voice menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (voiceMenuRef.current && !voiceMenuRef.current.contains(e.target as Node)) {
        setShowVoiceMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  // Auto-select default voice for the story's language
  useEffect(() => {
    const storyLang = story?.language || "en"
    const currentVoice = NARRATION_VOICES.find(v => v.value === narrationVoice)
    if (!currentVoice || currentVoice.language !== storyLang) {
      setNarrationVoice(getDefaultVoice(storyLang as StoryLanguage))
    }
  }, [story?.language])

  const getCacheKey = useCallback(
    (chapterIdx: number) => `${id}-${chapterIdx}-${narrationVoice}`,
    [id, narrationVoice]
  )

  async function generateAudio(chapterIdx: number): Promise<string | null> {
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
  }

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

  function handleVoiceChange(voice: string) {
    setNarrationVoice(voice)
    setShowVoiceMenu(false)
    // Stop current playback since voice changed
    stopPlayback()
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
  const storyLang = (story.language || "en") as StoryLanguage
  const availableVoices = getVoicesForLanguage(storyLang)
  const selectedVoice = availableVoices.find((v) => v.value === narrationVoice)

  const categoryLabels: Record<string, string> = {
    storyteller: "Storyteller",
    child: "Child",
    character: "Character",
  }
  const groupedVoices = availableVoices.reduce<Record<string, NarrationVoiceOption[]>>((acc, v) => {
    if (!acc[v.category]) acc[v.category] = []
    acc[v.category].push(v)
    return acc
  }, {})

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
          {/* Voice Selector */}
          <div className="relative" ref={voiceMenuRef}>
            <button
              onClick={() => setShowVoiceMenu(!showVoiceMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold text-text-muted hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
              aria-label="Select narration voice"
            >
              <Volume2 className="w-4 h-4" />
              {selectedVoice?.label || "Voice"}
              <ChevronDown className={cn(
                "w-3 h-3 transition-transform",
                showVoiceMenu && "rotate-180"
              )} />
            </button>

            <AnimatePresence>
              {showVoiceMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-surface border border-primary/10 rounded-xl shadow-xl z-50 overflow-hidden min-w-[200px]"
                >
                  <div className="p-2">
                    <p className="px-3 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                      Narration Voice
                    </p>
                    {Object.entries(groupedVoices).map(([category, voices]) => (
                      <div key={category}>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                          {categoryLabels[category] || category}
                        </p>
                        {voices.map((voice) => (
                          <button
                            key={voice.value}
                            onClick={() => handleVoiceChange(voice.value)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer",
                              narrationVoice === voice.value
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-primary/5 text-text"
                            )}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold">{voice.label}</p>
                                <span className="text-[10px] text-text-muted">
                                  {voice.gender === "female" ? "♀" : "♂"}
                                </span>
                              </div>
                              <p className="text-xs text-text-muted">{voice.description}</p>
                            </div>
                            {narrationVoice === voice.value && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
          </div>
        </div>
      </div>

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
