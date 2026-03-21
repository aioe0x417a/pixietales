"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { BookOpen, ChevronRight, Sparkles } from "lucide-react"

const DEMO_STORY = {
  title: "Luna and the Starlight Garden",
  childName: "Luna",
  chapters: [
    {
      title: "The Glowing Seed",
      content:
        "One quiet evening, a little girl named Luna found a tiny glowing seed in her garden. It sparkled like a fallen star. \"I wonder what you'll grow into,\" she whispered, planting it gently in the soft earth. The seed hummed a warm little melody, and Luna smiled.",
    },
    {
      title: "The Moonflower Blooms",
      content:
        "By morning, a shimmering flower had sprouted — taller than Luna herself! Its petals glowed silver and gold, and tiny fireflies danced around it. \"Welcome to my garden,\" Luna said. The moonflower bent down as if to say hello, and the whole garden seemed to sing.",
    },
    {
      title: "Goodnight, Garden",
      content:
        "As the stars came out, Luna sat beside her magical flower. The fireflies made patterns in the sky like a bedtime lullaby. \"Goodnight, moonflower,\" she yawned. The flower wrapped its warm glow around her like a blanket, and Luna drifted into the sweetest dreams.",
    },
  ],
}

const CHAPTER_ICONS = ["🌱", "🌸", "🌙"]

export function DemoStoryPlayer() {
  const [activeChapter, setActiveChapter] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goToChapter = (index: number) => {
    if (index === activeChapter) return
    setIsAnimating(true)
    setTimeout(() => {
      setActiveChapter(index)
      setIsAnimating(false)
    }, 200)
  }

  const advanceChapter = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setActiveChapter((prev) => (prev + 1) % DEMO_STORY.chapters.length)
      setIsAnimating(false)
    }, 200)
  }

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(advanceChapter, 6000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused])

  const chapter = DEMO_STORY.chapters[activeChapter]

  return (
    <div
      className="relative max-w-4xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Gradient border wrapper */}
      <div className="rounded-2xl p-[2px] bg-gradient-to-br from-primary via-accent to-secondary shadow-2xl shadow-primary/20">
        <div className="rounded-2xl bg-background overflow-hidden">
          {/* Header bar */}
          <div className="px-6 py-4 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/10 border-b border-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-text-muted uppercase tracking-widest leading-none mb-0.5">
                  Demo Story
                </p>
                <h3 className="font-heading text-base font-bold text-text leading-tight">
                  {DEMO_STORY.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-xs text-text-muted font-medium hidden sm:inline">
                AI Generated
              </span>
            </div>
          </div>

          {/* Chapter content */}
          <div className="px-6 pt-6 pb-5 min-h-[200px] flex flex-col justify-between">
            <div
              className="transition-all duration-200"
              style={{ opacity: isAnimating ? 0 : 1, transform: isAnimating ? "translateY(6px)" : "translateY(0)" }}
            >
              {/* Chapter icon + title */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="text-2xl"
                  role="img"
                  aria-hidden="true"
                >
                  {CHAPTER_ICONS[activeChapter]}
                </span>
                <h4 className="font-heading text-xl font-semibold text-primary">
                  {chapter.title}
                </h4>
                <span className="ml-auto text-xs text-text-muted font-medium">
                  {activeChapter + 1} / {DEMO_STORY.chapters.length}
                </span>
              </div>

              {/* Story text */}
              <p className="text-text-muted leading-relaxed text-base sm:text-lg">
                {chapter.content}
              </p>
            </div>

            {/* Chapter dots */}
            <div className="flex items-center justify-center gap-2.5 mt-6">
              {DEMO_STORY.chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => goToChapter(i)}
                  aria-label={`Go to chapter: ${ch.title}`}
                  className={`rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 ${
                    i === activeChapter
                      ? "w-6 h-2.5 bg-gradient-to-r from-primary to-accent"
                      : "w-2.5 h-2.5 bg-primary/20 hover:bg-primary/40"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* CTA footer */}
          <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-accent/5 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-text-muted text-center sm:text-left">
              Every story is unique — personalised with your child&apos;s name
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-white text-sm font-heading font-semibold hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
            >
              Create Your Own Story
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Auto-advance progress bar */}
      {!isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
          <div
            key={activeChapter}
            className="h-full bg-gradient-to-r from-primary via-accent to-secondary"
            style={{
              animation: "progress-bar 6s linear forwards",
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progress-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
