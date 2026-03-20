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
}

export interface StoryGenerationRequest {
  childName: string
  childAge: number
  theme: Theme | "custom"
  customPrompt?: string
  companion: Companion
  drawingBase64?: string
  chapterCount?: number
}

export interface StoryGenerationResponse {
  title: string
  chapters: StoryChapter[]
}
