"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Wand2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ImagePlus,
  Volume2,
  VolumeX,
  BookOpen,
  Palette,
  Mic,
  Compass,
  PawPrint,
  Rocket,
  Waves,
  HeartHandshake,
  Bone,
  Crown,
  Shield,
  Leaf,
  X,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { getSupabase } from "@/lib/supabase"
import {
  THEMES, COMPANIONS, BASE_COMPANIONS, COLLECTIBLE_COMPANIONS,
  STORY_LANGUAGES, NARRATION_VOICES, VOICE_AGE_LABELS,
  getVoicesForLanguage, getDefaultVoice,
  type Theme, type Companion, type StoryLanguage, type VoiceAge,
} from "@/lib/types"
import { getGamificationState } from "@/lib/gamification"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Step = "theme" | "customize" | "generating"

const THEME_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  compass: Compass,
  "paw-print": PawPrint,
  rocket: Rocket,
  waves: Waves,
  "heart-handshake": HeartHandshake,
  "wand-2": Wand2,
  bone: Bone,
  crown: Crown,
  shield: Shield,
  leaf: Leaf,
  sparkles: Sparkles,
}

const CHAPTER_READ_TIMES: Record<number, string> = {
  1: "~2 min",
  2: "~5 min",
  3: "~8 min",
  4: "~12 min",
}

const GENERATION_STEPS = [
  { label: "Writing your story...", Icon: BookOpen },
  { label: "Creating illustrations...", Icon: Palette },
  { label: "Preparing narration...", Icon: Mic },
  { label: "Almost ready...", Icon: Sparkles },
]


export default function CreateStoryPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}>
      <CreateStoryPage />
    </Suspense>
  )
}

function CreateStoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTheme = searchParams.get("theme") as Theme | null

  const activeProfile = useAppStore((s) => s.getActiveProfile())
  const addStory = useAppStore((s) => s.addStory)

  const [step, setStep] = useState<Step>(preselectedTheme ? "customize" : "theme")
  const [selectedTheme, setSelectedTheme] = useState<Theme | "custom" | null>(
    preselectedTheme
  )
  const [customPrompt, setCustomPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<StoryLanguage>("en")
  const [chapterCount, setChapterCount] = useState(4)
  const [narrationEnabled, setNarrationEnabled] = useState(true)
  const [selectedGender, setSelectedGender] = useState<"male" | "female">("female")
  const [selectedAge, setSelectedAge] = useState<VoiceAge>("adult")
  const [selectedVoice, setSelectedVoice] = useState(getDefaultVoice("en"))
  const [drawingMode, setDrawingMode] = useState(false)
  const [drawingBase64, setDrawingBase64] = useState<string | null>(null)
  const [drawingPreview, setDrawingPreview] = useState<string | null>(null)
  const [drawingMimeType, setDrawingMimeType] = useState<string>("image/jpeg")
  const [generationStep, setGenerationStep] = useState(0)
  const [selectedCompanion, setSelectedCompanion] = useState<Companion>(
    activeProfile?.companion || "bunny"
  )
  const [unlockedCompanionIds, setUnlockedCompanionIds] = useState<Set<Companion>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Multi-step generation progress indicator
  // When narration is enabled: steps 0-1 are time-based (story text + images in one API call),
  // steps 2-3 are driven by handleGenerate when TTS starts/finishes.
  // When narration is off: all steps are time-based.
  useEffect(() => {
    if (!isGenerating) {
      setGenerationStep(0)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setGenerationStep(1), 8000))
    if (!narrationEnabled) {
      timers.push(setTimeout(() => setGenerationStep(2), 18000))
      timers.push(setTimeout(() => setGenerationStep(3), 28000))
    }
    return () => timers.forEach(clearTimeout)
  }, [isGenerating, narrationEnabled])

  // Browser navigation guard during generation
  useEffect(() => {
    if (!isGenerating) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isGenerating])

  // Fetch unlocked companions for the active profile
  useEffect(() => {
    if (!activeProfile) return
    getGamificationState(activeProfile.id)
      .then(({ unlockedCompanions }) => {
        setUnlockedCompanionIds(
          new Set(unlockedCompanions.map((u) => u.companionId))
        )
      })
      .catch(console.error)
  }, [activeProfile?.id])

  if (!activeProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Sparkles className="w-16 h-16 text-primary/30 mb-6" />
        <h1 className="font-heading text-2xl font-bold text-text mb-4">
          Select a Child Profile First
        </h1>
        <p className="text-text-muted mb-6">
          You need an active child profile to create a story.
        </p>
        <Button onClick={() => router.push("/profiles")}>
          Go to Profiles
        </Button>
      </div>
    )
  }

  // Derived voice lists for cascading dropdowns
  const voicesForLang = getVoicesForLanguage(selectedLanguage)
  const availableGenders = [...new Set(voicesForLang.map((v) => v.gender))]
  const voicesForGender = voicesForLang.filter((v) => v.gender === selectedGender)
  const availableAges = [...new Set(voicesForGender.map((v) => v.age))]
  const voicesForAge = voicesForGender.filter((v) => v.age === selectedAge)

  // Auto-correct selections when language changes
  function handleLanguageChange(lang: StoryLanguage) {
    setSelectedLanguage(lang)
    const voices = getVoicesForLanguage(lang)
    // Reset to first available voice for this language
    const firstFemale = voices.find((v) => v.gender === "female")
    if (firstFemale) {
      setSelectedGender("female")
      setSelectedAge(firstFemale.age)
      setSelectedVoice(firstFemale.value)
    } else if (voices.length > 0) {
      setSelectedGender(voices[0].gender)
      setSelectedAge(voices[0].age)
      setSelectedVoice(voices[0].value)
    }
  }

  function handleGenderChange(gender: "male" | "female") {
    setSelectedGender(gender)
    const filtered = voicesForLang.filter((v) => v.gender === gender)
    if (filtered.length > 0) {
      setSelectedAge(filtered[0].age)
      setSelectedVoice(filtered[0].value)
    } else {
      setSelectedVoice("")
    }
  }

  function handleAgeChange(age: VoiceAge) {
    setSelectedAge(age)
    const filtered = voicesForLang.filter((v) => v.gender === selectedGender && v.age === age)
    if (filtered.length > 0) {
      setSelectedVoice(filtered[0].value)
    } else {
      setSelectedVoice("")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Maximum 5MB.")
      return
    }

    // Client-side magic byte pre-check (defense in depth -- server re-validates with Sharp)
    const headerReader = new FileReader()
    headerReader.onload = (hev) => {
      const arr = new Uint8Array(hev.target?.result as ArrayBuffer)
      const isJpeg = arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff
      const isPng = arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4e && arr[3] === 0x47
      const isGif = arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38
      const isWebp = arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46
        && arr[8] === 0x57 && arr[9] === 0x45 && arr[10] === 0x42 && arr[11] === 0x50
      const isBmp = arr[0] === 0x42 && arr[1] === 0x4d

      if (!isJpeg && !isPng && !isGif && !isWebp && !isBmp) {
        toast.error("Invalid image file. Please upload a JPEG, PNG, GIF, or WebP image.")
        return
      }

      // Magic bytes look good -- proceed with base64 encoding
      const base64Reader = new FileReader()
      base64Reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        const base64 = dataUrl?.split(",")[1]
        if (base64) {
          setDrawingMimeType(file.type || "image/jpeg")
          setDrawingBase64(base64)
          setDrawingPreview(dataUrl)
          setDrawingMode(true)
          setSelectedTheme("custom")
          setStep("customize")
        }
      }
      base64Reader.readAsDataURL(file)
    }
    headerReader.readAsArrayBuffer(file.slice(0, 12))
  }

  const updateChapterAudioUrl = useAppStore((s) => s.updateChapterAudioUrl)

  const handleGenerate = async () => {
    if (!selectedTheme && !drawingBase64) {
      toast.error("Please select a theme or upload a drawing")
      return
    }

    if (narrationEnabled && (!selectedVoice || !NARRATION_VOICES.some((v) => v.value === selectedVoice))) {
      toast.error("Please select a valid narration voice")
      return
    }

    setStep("generating")
    setIsGenerating(true)

    let succeeded = false
    try {
      abortControllerRef.current = new AbortController()
      const { data: { session } } = await getSupabase().auth.getSession()
      const response = await fetch("/api/story/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || ""}`,
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          childName: activeProfile.name,
          childAge: activeProfile.age,
          theme: selectedTheme || "adventure",
          customPrompt: customPrompt || undefined,
          companion: selectedCompanion,
          drawingBase64: drawingBase64 || undefined,
          chapterCount,
          generateImages: true,
          language: selectedLanguage,
          childProfileId: activeProfile.id,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `Failed to generate story (${response.status})`)
      }

      const story = await response.json()

      // Save story to store immediately to get an ID
      const storyId = addStory({
        title: story.title,
        chapters: story.chapters,
        theme: drawingBase64 ? "drawing" : (selectedTheme as Theme) || "adventure",
        childProfileId: activeProfile.id,
        childName: activeProfile.name,
        prompt: customPrompt || undefined,
        language: selectedLanguage,
        narrationVoice: narrationEnabled ? selectedVoice : undefined,
        narrationEnabled,
      })

      // Pre-generate narration for all chapters in parallel while still on this page
      if (narrationEnabled && selectedVoice) {
        setGenerationStep(2) // "Preparing narration..."
        const token = session?.access_token || ""
        const ttsPromises = story.chapters.map(
          (chapter: { content: string }, idx: number) =>
            fetch("/api/tts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                text: chapter.content,
                voice: selectedVoice,
                storyId,
                chapterIndex: idx,
              }),
            })
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (data?.audioUrl) {
                  updateChapterAudioUrl(storyId, idx, data.audioUrl)
                }
              })
              .catch((e) => console.warn("TTS pre-gen failed for chapter", idx, e)) // Non-fatal -- story page will retry on demand
        )
        await Promise.all(ttsPromises)
        setGenerationStep(3) // "Almost ready..."
      }

      succeeded = true
      toast.success("Story created!")
      router.push(`/story/${storyId}`)
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        toast.info("Story generation cancelled")
      } else {
        console.error("Generation error:", error)
        toast.error((error as Error).message || "Failed to generate story. Please try again.")
      }
    } finally {
      if (!succeeded) {
        setStep("customize")
        setIsGenerating(false)
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-text">
          Create a Story for {activeProfile.name}
        </h1>
        <p className="text-text-muted mt-1">
          Pick a theme, customize, and let the magic happen.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Theme Selection */}
        {step === "theme" && (
          <motion.div
            key="theme"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="font-heading text-xl font-semibold text-text mb-6">
              What kind of story tonight?
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {THEMES.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => {
                    setSelectedTheme(theme.value)
                    setStep("customize")
                  }}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all cursor-pointer hover:scale-105 ${
                    selectedTheme === theme.value
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-primary/10 hover:border-primary/30"
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${theme.color}15` }}
                  >
                    {(() => {
                      const ThemeIcon = THEME_ICONS[theme.icon] || Sparkles
                      return <ThemeIcon className="w-7 h-7" style={{ color: theme.color }} />
                    })()}
                  </div>
                  <span className="font-heading font-semibold text-text">
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Drawing upload option */}
            <div className="border-t border-primary/10 pt-6">
              <h3 className="font-heading text-lg font-semibold text-text mb-3">
                Or upload a drawing
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-primary/20 rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center gap-3"
              >
                <ImagePlus className="w-10 h-10 text-primary/40" />
                <span className="text-text-muted font-semibold">
                  Upload your child&apos;s drawing
                </span>
                <span className="text-sm text-text-muted/60">
                  We&apos;ll turn it into a magical story
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </motion.div>
        )}

        {/* Step 2: Customize */}
        {step === "customize" && (
          <motion.div
            key="customize"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => {
                setStep("theme")
                setSelectedTheme(null)
                setDrawingBase64(null)
                setDrawingPreview(null)
                setDrawingMode(false)
              }}
              className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to themes
            </button>

            <div className="space-y-6">
              {/* Selected theme display */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-text-muted mb-1">
                  {drawingMode ? "Drawing Story" : "Theme"}
                </p>
                <p className="font-heading font-semibold text-text">
                  {drawingMode
                    ? "Story from drawing"
                    : THEMES.find((t) => t.value === selectedTheme)?.label ||
                      "Custom Story"}
                </p>
              </div>

              {/* Language selector */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Story Language
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {STORY_LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => handleLanguageChange(lang.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all cursor-pointer text-center",
                        selectedLanguage === lang.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-primary/10 hover:border-primary/30"
                      )}
                    >
                      <span className="text-sm font-semibold text-text">{lang.nativeLabel}</span>
                      {lang.value !== "en" && (
                        <span className="text-[10px] text-text-muted">{lang.label}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapter count */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Number of Chapters
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setChapterCount(n)}
                      className={cn(
                        "flex-1 py-3 rounded-xl border-2 font-semibold transition-all cursor-pointer flex flex-col items-center gap-0.5",
                        chapterCount === n
                          ? "border-primary bg-primary/5 text-primary shadow-md"
                          : "border-primary/10 text-text-muted hover:border-primary/30"
                      )}
                    >
                      <span>{n}</span>
                      <span className="text-[10px] font-normal text-text-muted">
                        {CHAPTER_READ_TIMES[n]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Companion selector */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Story Companion
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {BASE_COMPANIONS.map((companion) => (
                    <button
                      key={companion.value}
                      onClick={() => setSelectedCompanion(companion.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all cursor-pointer",
                        selectedCompanion === companion.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-primary/10 hover:border-primary/30"
                      )}
                      aria-label={companion.label}
                    >
                      <span className="text-2xl">{companion.emoji}</span>
                      <span className="text-[10px] font-semibold text-text truncate w-full text-center">
                        {companion.label}
                      </span>
                    </button>
                  ))}
                  {COLLECTIBLE_COMPANIONS.map((companion) => {
                    const isUnlocked = unlockedCompanionIds.has(companion.value)
                    return (
                      <button
                        key={companion.value}
                        onClick={() => isUnlocked && setSelectedCompanion(companion.value)}
                        disabled={!isUnlocked}
                        title={
                          isUnlocked
                            ? companion.label
                            : `Read ${companion.unlockThreshold} more stories to unlock`
                        }
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all relative",
                          isUnlocked
                            ? cn(
                                "cursor-pointer",
                                selectedCompanion === companion.value
                                  ? "border-secondary bg-secondary/5 shadow-md"
                                  : "border-primary/10 hover:border-primary/30"
                              )
                            : "cursor-not-allowed border-primary/5 opacity-50"
                        )}
                        aria-label={
                          isUnlocked
                            ? companion.label
                            : `${companion.label} — locked`
                        }
                      >
                        <span
                          className={cn(
                            "text-2xl",
                            !isUnlocked && "grayscale"
                          )}
                        >
                          {companion.emoji}
                        </span>
                        <span className="text-[10px] font-semibold text-text-muted truncate w-full text-center">
                          {companion.label}
                        </span>
                        {!isUnlocked && (
                          <Lock className="absolute top-1.5 right-1.5 w-2.5 h-2.5 text-text-muted/60" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Narration toggle + voice selector */}
              <div className="p-4 rounded-xl border border-primary/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {narrationEnabled ? (
                      <Volume2 className="w-5 h-5 text-primary" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-text-muted" />
                    )}
                    <label className="text-sm font-semibold text-text">
                      Voice Narration
                    </label>
                  </div>
                  <button
                    onClick={() => setNarrationEnabled(!narrationEnabled)}
                    className={cn(
                      "relative w-12 h-7 rounded-full transition-colors cursor-pointer",
                      narrationEnabled ? "bg-primary" : "bg-primary/20"
                    )}
                    aria-label="Toggle narration"
                  >
                    <div className={cn(
                      "absolute top-1 w-5 h-5 rounded-full bg-text shadow transition-transform",
                      narrationEnabled ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>

                {narrationEnabled && (
                  <div className="space-y-3 pt-2 border-t border-primary/10">
                    {/* Gender */}
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                        Gender
                      </label>
                      <div className="flex gap-2">
                        {(["female", "male"] as const).filter((g) => availableGenders.includes(g)).map((g) => (
                          <button
                            key={g}
                            onClick={() => handleGenderChange(g)}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer",
                              selectedGender === g
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-primary/10 text-text-muted hover:border-primary/30"
                            )}
                          >
                            {g === "female" ? "Female" : "Male"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                        Voice Type
                      </label>
                      <div className="flex gap-2">
                        {(["child", "adult", "elderly"] as const).filter((a) => availableAges.includes(a)).map((a) => (
                          <button
                            key={a}
                            onClick={() => handleAgeChange(a)}
                            className={cn(
                              "flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer",
                              selectedAge === a
                                ? "border-primary bg-primary/5 text-primary"
                                : "border-primary/10 text-text-muted hover:border-primary/30"
                            )}
                          >
                            {VOICE_AGE_LABELS[a]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Voice */}
                    <div>
                      <label className="block text-xs font-semibold text-text-muted mb-1.5 uppercase tracking-wider">
                        Voice
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {voicesForAge.map((voice) => (
                          <button
                            key={voice.value}
                            onClick={() => setSelectedVoice(voice.value)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all cursor-pointer",
                              selectedVoice === voice.value
                                ? "border-primary bg-primary/5"
                                : "border-primary/10 hover:border-primary/30"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm font-semibold truncate",
                                selectedVoice === voice.value ? "text-primary" : "text-text"
                              )}>
                                {voice.label}
                              </p>
                              <p className="text-[11px] text-text-muted truncate">{voice.description}</p>
                            </div>
                            {selectedVoice === voice.value && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </button>
                        ))}
                        {voicesForAge.length === 0 && (
                          <p className="col-span-2 text-sm text-text-muted py-2 text-center">
                            No voices available for this combination
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawing preview */}
              {drawingBase64 && (
                <div className="relative rounded-xl overflow-hidden border border-primary/10">
                  <img
                    src={drawingPreview || `data:${drawingMimeType};base64,${drawingBase64}`}
                    alt="Uploaded drawing"
                    className="w-full max-h-64 object-contain bg-surface-alt"
                  />
                  <button
                    onClick={() => {
                      setDrawingBase64(null)
                      setDrawingPreview(null)
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Remove drawing"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Custom prompt */}
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Add details (optional)
                </label>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder={`E.g., "Include a rainbow bridge and a friendly owl" or "A story about sharing toys with friends"`}
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-text-muted mt-1 text-right">
                  {(customPrompt?.length || 0)}/500
                </p>
              </div>

              {/* Story settings summary */}
              <div className="p-4 rounded-xl bg-surface-alt border border-primary/5">
                <h3 className="font-heading font-semibold text-text text-sm mb-3">
                  Story Settings
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-text-muted">Child:</span>{" "}
                    <span className="font-semibold">{activeProfile.name}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Age:</span>{" "}
                    <span className="font-semibold">{activeProfile.age}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Companion:</span>{" "}
                    <span className="font-semibold">
                      {COMPANIONS.find((c) => c.value === selectedCompanion)?.emoji}{" "}
                      {COMPANIONS.find((c) => c.value === selectedCompanion)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Chapters:</span>{" "}
                    <span className="font-semibold">{chapterCount}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">Language:</span>{" "}
                    <span className="font-semibold">
                      {STORY_LANGUAGES.find((l) => l.value === selectedLanguage)?.label || "English"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-muted">Narration:</span>{" "}
                    <span className="font-semibold">
                      {narrationEnabled
                        ? NARRATION_VOICES.find((v) => v.value === selectedVoice)?.label || "On"
                        : "Off"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Generate button */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerate}
              >
                <Wand2 className="w-5 h-5" />
                Create Story
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Generating */}
        {step === "generating" && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[50vh] text-center"
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center pulse-glow">
                <Wand2 className="w-12 h-12 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute twinkle"
                    style={{
                      left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 6)}%`,
                      top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 6)}%`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-secondary" />
                  </div>
                ))}
              </div>
            </div>
            <h2 className="font-heading text-2xl font-bold text-text mb-3">
              Creating {activeProfile.name}&apos;s Story...
            </h2>

            {/* Multi-step progress indicator */}
            <div className="w-full max-w-sm mt-4 space-y-2">
              {GENERATION_STEPS.map((s, idx) => {
                const isActive = idx === generationStep
                const isDone = idx < generationStep
                const { Icon } = s
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                      isActive
                        ? "border-primary bg-primary/5 text-primary"
                        : isDone
                        ? "border-primary/20 bg-primary/5 text-primary/50"
                        : "border-primary/10 text-text-muted/40"
                    )}
                  >
                    {isActive ? (
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{s.label}</span>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => {
                abortControllerRef.current?.abort()
                setStep("customize")
                setIsGenerating(false)
              }}
              className="mt-6 text-sm text-text-muted hover:text-error transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
