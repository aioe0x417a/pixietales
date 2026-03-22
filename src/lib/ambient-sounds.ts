import type { Theme } from "./types"

export const AMBIENT_SOUNDS = [
  { id: "rain", name: "Gentle Rain", icon: "CloudRain", color: "#38BDF8" },
  { id: "ocean", name: "Ocean Waves", icon: "Waves", color: "#22D3EE" },
  { id: "forest", name: "Forest Night", icon: "TreePine", color: "#4ADE80" },
  { id: "wind", name: "Gentle Wind", icon: "Wind", color: "#C4B5FD" },
  { id: "lullaby", name: "Lullaby", icon: "Music", color: "#F472B6" },
  { id: "white-noise", name: "White Noise", icon: "CloudMoon", color: "#9CA3AF" },
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
