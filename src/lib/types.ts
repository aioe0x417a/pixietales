export type Theme =
  | "adventure"
  | "animals"
  | "space"
  | "ocean"
  | "friendship"
  | "magic"
  | "dinosaurs"
  | "princesses"
  | "superheroes"
  | "nature"

export const THEMES: { value: Theme; label: string; icon: string; color: string }[] = [
  { value: "adventure", label: "Adventure", icon: "compass", color: "#F59E0B" },
  { value: "animals", label: "Animals", icon: "rabbit", color: "#10B981" },
  { value: "space", label: "Space", icon: "rocket", color: "#6366F1" },
  { value: "ocean", label: "Ocean", icon: "waves", color: "#0EA5E9" },
  { value: "friendship", label: "Friendship", icon: "heart-handshake", color: "#EC4899" },
  { value: "magic", label: "Magic", icon: "sparkles", color: "#A855F7" },
  { value: "dinosaurs", label: "Dinosaurs", icon: "bone", color: "#EF4444" },
  { value: "princesses", label: "Princesses", icon: "crown", color: "#F472B6" },
  { value: "superheroes", label: "Superheroes", icon: "shield", color: "#3B82F6" },
  { value: "nature", label: "Nature", icon: "tree-pine", color: "#22C55E" },
]

export type Companion = "bunny" | "dragon" | "bear" | "cat" | "unicorn"

export const COMPANIONS: { value: Companion; label: string; emoji: string }[] = [
  { value: "bunny", label: "Bunny", emoji: "\u{1F430}" },
  { value: "dragon", label: "Dragon", emoji: "\u{1F409}" },
  { value: "bear", label: "Bear", emoji: "\u{1F43B}" },
  { value: "cat", label: "Cat", emoji: "\u{1F431}" },
  { value: "unicorn", label: "Unicorn", emoji: "\u{1F984}" },
]

export interface ChildProfile {
  id: string
  name: string
  age: number
  favoriteThemes: Theme[]
  companion: Companion
  avatar?: string
  createdAt: string
}

export interface StoryChapter {
  title: string
  content: string
  imageUrl?: string
  imagePrompt?: string
  audioUrl?: string
}

// ── Languages ──────────────────────────────────────────────

export type StoryLanguage = "en" | "ms" | "zh" | "ta" | "th"

export const STORY_LANGUAGES: { value: StoryLanguage; label: string; nativeLabel: string }[] = [
  { value: "en", label: "English", nativeLabel: "English" },
  { value: "ms", label: "Malay", nativeLabel: "Bahasa Melayu" },
  { value: "zh", label: "Chinese", nativeLabel: "中文" },
  { value: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { value: "th", label: "Thai", nativeLabel: "ไทย" },
]

// ── Narration Voices ───────────────────────────────────────

export type NarrationVoice = string

export type VoiceCategory = "storyteller" | "child" | "character"
export type VoiceAge = "child" | "adult" | "elderly"

export interface NarrationVoiceOption {
  value: string
  label: string
  description: string
  language: StoryLanguage
  category: VoiceCategory
  gender: "male" | "female"
  age: VoiceAge
}

export const VOICE_AGE_LABELS: Record<VoiceAge, string> = {
  child: "Child",
  adult: "Adult",
  elderly: "Grandparent",
}

export const NARRATION_VOICES: NarrationVoiceOption[] = [
  // ── English ──────────────────────────────────
  { value: "en-US-JennyNeural", label: "Jenny", description: "Warm & gentle", language: "en", category: "storyteller", gender: "female", age: "adult" },
  { value: "en-US-SaraNeural", label: "Sara", description: "Soft & gentle", language: "en", category: "storyteller", gender: "female", age: "adult" },
  { value: "en-US-MichelleNeural", label: "Michelle", description: "Gentle & soothing", language: "en", category: "storyteller", gender: "female", age: "elderly" },
  { value: "en-US-GuyNeural", label: "Guy", description: "Warm male", language: "en", category: "storyteller", gender: "male", age: "adult" },
  { value: "en-GB-RyanNeural", label: "Ryan", description: "British narrator", language: "en", category: "storyteller", gender: "male", age: "elderly" },
  { value: "en-IE-EmilyNeural", label: "Emily", description: "Irish fairy tale", language: "en", category: "storyteller", gender: "female", age: "elderly" },
  { value: "en-US-AnaNeural", label: "Ana", description: "Child voice (US)", language: "en", category: "child", gender: "female", age: "child" },
  { value: "en-GB-MaisieNeural", label: "Maisie", description: "Child voice (British)", language: "en", category: "child", gender: "female", age: "child" },
  { value: "en-US-AriaNeural", label: "Aria", description: "Confident narrator", language: "en", category: "character", gender: "female", age: "adult" },
  { value: "en-US-RogerNeural", label: "Roger", description: "Lively & expressive", language: "en", category: "character", gender: "male", age: "adult" },
  { value: "en-GB-SoniaNeural", label: "Sonia", description: "Warm British", language: "en", category: "character", gender: "female", age: "adult" },

  // ── Malay ────────────────────────────────────
  { value: "ms-MY-YasminNeural", label: "Yasmin", description: "Friendly female", language: "ms", category: "storyteller", gender: "female", age: "adult" },
  { value: "ms-MY-OsmanNeural", label: "Osman", description: "Friendly male", language: "ms", category: "storyteller", gender: "male", age: "adult" },

  // ── Chinese (Mandarin) ──────────────────────
  { value: "zh-CN-XiaoxiaoNeural", label: "Xiaoxiao", description: "Warm female", language: "zh", category: "storyteller", gender: "female", age: "adult" },
  { value: "zh-CN-YunxiNeural", label: "Yunxi", description: "Lively narrator", language: "zh", category: "storyteller", gender: "male", age: "adult" },
  { value: "zh-CN-YunxiaNeural", label: "Yunxia", description: "Cute child voice", language: "zh", category: "child", gender: "male", age: "child" },
  { value: "zh-CN-XiaoyiNeural", label: "Xiaoyi", description: "Lively & playful", language: "zh", category: "character", gender: "female", age: "adult" },
  { value: "zh-CN-YunyangNeural", label: "Yunyang", description: "Professional narrator", language: "zh", category: "character", gender: "male", age: "adult" },

  // ── Tamil ───────────────────────────────────
  { value: "ta-IN-PallaviNeural", label: "Pallavi", description: "Friendly female", language: "ta", category: "storyteller", gender: "female", age: "adult" },
  { value: "ta-IN-ValluvarNeural", label: "Valluvar", description: "Friendly male", language: "ta", category: "storyteller", gender: "male", age: "adult" },
  { value: "ta-MY-KaniNeural", label: "Kani", description: "Malaysian Tamil", language: "ta", category: "storyteller", gender: "female", age: "adult" },
  { value: "ta-MY-SuryaNeural", label: "Surya", description: "Malaysian Tamil male", language: "ta", category: "storyteller", gender: "male", age: "adult" },

  // ── Thai ────────────────────────────────────
  { value: "th-TH-PremwadeeNeural", label: "Premwadee", description: "Friendly female", language: "th", category: "storyteller", gender: "female", age: "adult" },
  { value: "th-TH-NiwatNeural", label: "Niwat", description: "Friendly male", language: "th", category: "storyteller", gender: "male", age: "adult" },
]

export function getVoicesForLanguage(lang: StoryLanguage): NarrationVoiceOption[] {
  return NARRATION_VOICES.filter((v) => v.language === lang)
}

export function getDefaultVoice(lang: StoryLanguage): string {
  const voices = getVoicesForLanguage(lang)
  const storyteller = voices.find((v) => v.category === "storyteller" && v.gender === "female")
  return storyteller?.value || voices[0]?.value || "en-US-JennyNeural"
}

export function isValidVoice(voice: string): boolean {
  return NARRATION_VOICES.some((v) => v.value === voice)
}

export interface Story {
  id: string
  title: string
  chapters: StoryChapter[]
  theme: Theme | "custom" | "drawing"
  childProfileId: string
  childName: string
  prompt?: string
  drawingUrl?: string
  createdAt: string
  duration?: number
  language?: StoryLanguage
  narrationVoice?: string
  narrationEnabled?: boolean
}

export interface StoryGenerationRequest {
  childName: string
  childAge: number
  theme: Theme | "custom" | "drawing"
  customPrompt?: string
  companion: Companion
  drawingBase64?: string
  chapterCount?: number
  language?: StoryLanguage
}

export interface StoryGenerationResponse {
  title: string
  chapters: StoryChapter[]
}
