"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Volume2,
  VolumeX,
  Moon,
  Trash2,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/lib/store"
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

  const [currentChapter, setCurrentChapter] = useState(0)
  const [readAloud, setReadAloud] = useState(false)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  useEffect(() => {
    if (readAloud && story) {
      speakChapter(currentChapter)
    } else {
      window.speechSynthesis?.cancel()
    }
  }, [currentChapter, readAloud])

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

  function speakChapter(index: number) {
    window.speechSynthesis?.cancel()
    const chap = story!.chapters[index]
    if (!chap) return

    const utterance = new SpeechSynthesisUtterance(chap.content)
    utterance.rate = 0.85
    utterance.pitch = 1.1
    utterance.volume = 0.9

    // Try to find a good voice
    const voices = window.speechSynthesis?.getVoices() || []
    const preferred = voices.find(
      (v) =>
        v.name.includes("Samantha") ||
        v.name.includes("Karen") ||
        v.name.includes("female") ||
        v.lang.startsWith("en")
    )
    if (preferred) utterance.voice = preferred

    utterance.onend = () => {
      if (!isLast) {
        setCurrentChapter((prev) => prev + 1)
      } else {
        setReadAloud(false)
      }
    }

    synthRef.current = utterance
    window.speechSynthesis?.speak(utterance)
  }

  function toggleReadAloud() {
    if (readAloud) {
      window.speechSynthesis?.cancel()
      setReadAloud(false)
    } else {
      setReadAloud(true)
    }
  }

  function handleDelete() {
    if (confirm("Delete this story? This cannot be undone.")) {
      removeStory(story!.id)
      toast.success("Story deleted")
      router.push("/library")
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/library")}
          className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleReadAloud}
            aria-label={readAloud ? "Stop reading aloud" : "Read story aloud"}
          >
            {readAloud ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
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

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-primary/10">
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
          <Button onClick={() => router.push("/dashboard")}>
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

      {/* Reading indicator */}
      {readAloud && (
        <div className="fixed bottom-20 lg:bottom-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-50">
          <Volume2 className="w-5 h-5 animate-pulse" />
          <span className="font-semibold text-sm">Reading aloud...</span>
          <button
            onClick={toggleReadAloud}
            className="text-white/80 hover:text-white cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  )
}
