"use client"

import { useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Wand2,
  Upload,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ImagePlus,
  Volume2,
  VolumeX,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/input"
import { useAppStore } from "@/lib/store"
import { getSupabase } from "@/lib/supabase"
import {
  THEMES, COMPANIONS, STORY_LANGUAGES, NARRATION_VOICES, VOICE_AGE_LABELS,
  getVoicesForLanguage, getDefaultVoice,
  type Theme, type Companion, type StoryLanguage, type VoiceAge,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Step = "theme" | "customize" | "generating"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
    }
  }

  function handleAgeChange(age: VoiceAge) {
    setSelectedAge(age)
    const filtered = voicesForLang.filter((v) => v.gender === selectedGender && v.age === age)
    if (filtered.length > 0) {
      setSelectedVoice(filtered[0].value)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string)?.split(",")[1]
      if (base64) {
        setDrawingBase64(base64)
        setDrawingMode(true)
        setSelectedTheme("custom")
        setStep("customize")
      }
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!selectedTheme && !drawingBase64) {
      toast.error("Please select a theme or upload a drawing")
      return
    }

    setStep("generating")
    setIsGenerating(true)

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
          companion: activeProfile.companion,
          drawingBase64: drawingBase64 || undefined,
          chapterCount,
          generateImages: true,
          language: selectedLanguage,
        }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.error || `Failed to generate story (${response.status})`)
      }

      const story = await response.json()

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

      toast.success("Story created!")
      router.push(`/story/${storyId}`)
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        toast.info("Story generation cancelled")
      } else {
        console.error("Generation error:", error)
        toast.error((error as Error).message || "Failed to generate story. Please try again.")
      }
      setStep("customize")
      setIsGenerating(false)
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
                    <Sparkles
                      className="w-7 h-7"
                      style={{ color: theme.color }}
                    />
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
                accept="image/*"
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
                setDrawingBase64(null)
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
                        "flex-1 py-3 rounded-xl border-2 font-semibold transition-all cursor-pointer",
                        chapterCount === n
                          ? "border-primary bg-primary/5 text-primary shadow-md"
                          : "border-primary/10 text-text-muted hover:border-primary/30"
                      )}
                    >
                      {n}
                    </button>
                  ))}
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
                      "absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform",
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
                <div className="rounded-xl overflow-hidden border border-primary/10">
                  <img
                    src={`data:image/jpeg;base64,${drawingBase64}`}
                    alt="Uploaded drawing"
                    className="w-full max-h-64 object-contain bg-white"
                  />
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
                />
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
                      {COMPANIONS.find(
                        (c) => c.value === activeProfile.companion
                      )?.emoji}{" "}
                      {COMPANIONS.find(
                        (c) => c.value === activeProfile.companion
                      )?.label}
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
            <p className="text-text-muted max-w-md">
              Our storyteller is weaving a magical tale with beautiful
              illustrations. This usually takes about 30 seconds.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating chapters and illustrations...
            </div>
            <button
              onClick={() => {
                abortControllerRef.current?.abort()
                setStep("customize")
                setIsGenerating(false)
              }}
              className="mt-4 text-sm text-text-muted hover:text-error transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
