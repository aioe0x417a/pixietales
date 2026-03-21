import type { Theme } from "./types"

export const AMBIENT_SOUNDS = [
  { id: "rain", name: "Gentle Rain", icon: "CloudRain", color: "#0EA5E9" },
  { id: "ocean", name: "Ocean Waves", icon: "Waves", color: "#06B6D4" },
  { id: "forest", name: "Forest Night", icon: "TreePine", color: "#22C55E" },
  { id: "wind", name: "Gentle Wind", icon: "Wind", color: "#A78BFA" },
  { id: "lullaby", name: "Lullaby", icon: "Music", color: "#EC4899" },
  { id: "white-noise", name: "White Noise", icon: "CloudMoon", color: "#6B7280" },
] as const

export type AmbientSoundId = (typeof AMBIENT_SOUNDS)[number]["id"]

/** Map each story theme to its default ambient sound */
export const THEME_SOUND_MAP: Record<Theme | "custom" | "drawing", AmbientSoundId> = {
  adventure: "forest",
  animals: "forest",
  space: "wind",
  ocean: "ocean",
  friendship: "lullaby",
  magic: "lullaby",
  dinosaurs: "forest",
  princesses: "lullaby",
  superheroes: "wind",
  nature: "forest",
  custom: "rain",
  drawing: "rain",
}

export function getSoundForTheme(theme: Theme | "custom" | "drawing"): AmbientSoundId {
  return THEME_SOUND_MAP[theme] ?? "rain"
}

export function getSoundUrl(soundId: AmbientSoundId): string {
  return `/sounds/${soundId}.mp3`
}
