"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ChildProfile, Story, StoryChapter, NarrationVoice, StoryLanguage } from "./types"
import type { AmbientSoundId } from "./ambient-sounds"
import { generateId } from "./utils"
import { getSupabase } from "./supabase"

export interface AppStore {
  // Child Profiles
  profiles: ChildProfile[]
  activeProfileId: string | null
  addProfile: (profile: Omit<ChildProfile, "id" | "createdAt">) => string
  updateProfile: (id: string, data: Partial<ChildProfile>) => void
  removeProfile: (id: string) => void
  setActiveProfile: (id: string | null) => void
  getActiveProfile: () => ChildProfile | null

  // Stories
  stories: Story[]
  addStory: (story: Omit<Story, "id" | "createdAt">) => string
  removeStory: (id: string) => void
  getStoriesForProfile: (profileId: string) => Story[]
  getStory: (id: string) => Story | undefined

  // UI State
  bedtimeMode: boolean
  setBedtimeMode: (on: boolean) => void

  // Ambient Sound (persisted preferences -- actual audio lives in AmbientAudioProvider)
  ambientSoundId: AmbientSoundId | null
  ambientVolume: number
  ambientEnabled: boolean
  setAmbientSound: (id: AmbientSoundId | null) => void
  setAmbientVolume: (vol: number) => void
  setAmbientEnabled: (on: boolean) => void

  // Narration
  narrationVoice: NarrationVoice
  setNarrationVoice: (voice: NarrationVoice) => void
  updateChapterAudioUrl: (storyId: string, chapterIndex: number, audioUrl: string) => void

  // Supabase sync
  loadFromSupabase: () => Promise<void>
  resetStore: () => void
}

// Fire-and-forget Supabase writes (don't block UI)
async function syncProfileToSupabase(profile: ChildProfile) {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from("child_profiles").upsert({
      id: profile.id,
      user_id: user.id,
      name: profile.name,
      age: profile.age,
      companion: profile.companion,
      favorite_themes: profile.favoriteThemes || [],
      created_at: profile.createdAt,
    })
  } catch (e) {
    console.warn("Supabase profile sync failed:", e)
  }
}

async function deleteProfileFromSupabase(id: string) {
  try {
    const supabase = getSupabase()
    await supabase.from("child_profiles").delete().eq("id", id)
  } catch (e) {
    console.warn("Supabase profile delete failed:", e)
  }
}

async function syncStoryToSupabase(story: Story) {
  try {
    const supabase = getSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Insert story
    await supabase.from("stories").upsert({
      id: story.id,
      user_id: user.id,
      child_profile_id: story.childProfileId,
      title: story.title,
      theme: story.theme,
      child_name: story.childName,
      prompt: story.prompt || null,
      language: story.language || "en",
      created_at: story.createdAt,
    })

    // Delete existing chapters then insert fresh (avoids duplicate IDs)
    await supabase.from("story_chapters").delete().eq("story_id", story.id)

    const chapters = story.chapters.map((ch, i) => ({
      id: generateId(),
      story_id: story.id,
      chapter_index: i,
      title: ch.title,
      content: ch.content,
      image_prompt: ch.imagePrompt || null,
      image_url: ch.imageUrl || null,
      audio_url: ch.audioUrl || null,
    }))

    await supabase.from("story_chapters").insert(chapters)
  } catch (e) {
    console.warn("Supabase story sync failed:", e)
  }
}

async function deleteStoryFromSupabase(id: string) {
  try {
    const supabase = getSupabase()
    // Chapters cascade delete via FK
    await supabase.from("stories").delete().eq("id", id)
  } catch (e) {
    console.warn("Supabase story delete failed:", e)
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Child Profiles
      profiles: [],
      activeProfileId: null,

      addProfile: (data) => {
        const id = generateId()
        const profile = { ...data, id, createdAt: new Date().toISOString() } as ChildProfile
        set((s) => ({
          profiles: [...s.profiles, profile],
          activeProfileId: s.activeProfileId ?? id,
        }))
        syncProfileToSupabase(profile)
        return id
      },

      updateProfile: (id, data) => {
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        }))
        const updated = get().profiles.find((p) => p.id === id)
        if (updated) syncProfileToSupabase(updated)
      },

      removeProfile: (id) => {
        set((s) => ({
          profiles: s.profiles.filter((p) => p.id !== id),
          activeProfileId:
            s.activeProfileId === id
              ? s.profiles.find((p) => p.id !== id)?.id ?? null
              : s.activeProfileId,
        }))
        deleteProfileFromSupabase(id)
      },

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get()
        return profiles.find((p) => p.id === activeProfileId) ?? null
      },

      // Stories
      stories: [],

      addStory: (data) => {
        const id = generateId()
        const story = { ...data, id, createdAt: new Date().toISOString() } as Story
        set((s) => ({
          stories: [story, ...s.stories],
        }))
        syncStoryToSupabase(story)
        return id
      },

      removeStory: (id) => {
        set((s) => ({
          stories: s.stories.filter((st) => st.id !== id),
        }))
        deleteStoryFromSupabase(id)
      },

      getStoriesForProfile: (profileId) =>
        get().stories.filter((s) => s.childProfileId === profileId),

      getStory: (id) => get().stories.find((s) => s.id === id),

      // UI State
      bedtimeMode: false,
      setBedtimeMode: (on) => set({ bedtimeMode: on }),

      // Ambient Sound
      ambientSoundId: null,
      ambientVolume: 0.4,
      ambientEnabled: false,
      setAmbientSound: (id) => set({ ambientSoundId: id }),
      setAmbientVolume: (vol) => set({ ambientVolume: vol }),
      setAmbientEnabled: (on) => set({ ambientEnabled: on }),

      // Narration
      narrationVoice: "en-US-JennyNeural" as NarrationVoice,
      setNarrationVoice: (voice) => set({ narrationVoice: voice }),
      updateChapterAudioUrl: (storyId, chapterIndex, audioUrl) => {
        set((s) => ({
          stories: s.stories.map((story) => {
            if (story.id !== storyId) return story
            const chapters = story.chapters.map((ch, i) =>
              i === chapterIndex ? { ...ch, audioUrl } : ch
            )
            return { ...story, chapters }
          }),
        }))
        // Sync updated story to Supabase
        const updated = get().stories.find((s) => s.id === storyId)
        if (updated) syncStoryToSupabase(updated)
      },

      // Reset store on sign-out (clear user data from localStorage)
      resetStore: () => set({
        profiles: [],
        activeProfileId: null,
        stories: [],
        bedtimeMode: false,
        narrationVoice: "en-US-JennyNeural" as NarrationVoice,
        ambientSoundId: null,
        ambientVolume: 0.4,
        ambientEnabled: false,
      }),

      // Supabase sync: load all data for the logged-in user
      loadFromSupabase: async () => {
        try {
          const supabase = getSupabase()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          // Load profiles
          const { data: profiles } = await supabase
            .from("child_profiles")
            .select("*")
            .order("created_at", { ascending: true })

          // Load stories with chapters
          const { data: stories } = await supabase
            .from("stories")
            .select("*")
            .order("created_at", { ascending: false })

          if (stories && stories.length > 0) {
            const { data: chapters } = await supabase
              .from("story_chapters")
              .select("*")
              .in("story_id", stories.map((s) => s.id))
              .order("chapter_index", { ascending: true })

            const chaptersByStory = new Map<string, StoryChapter[]>()
            for (const ch of chapters || []) {
              const arr = chaptersByStory.get(ch.story_id) || []
              arr.push({
                title: ch.title,
                content: ch.content,
                imagePrompt: ch.image_prompt || undefined,
                imageUrl: ch.image_url || undefined,
                audioUrl: ch.audio_url || undefined,
              })
              chaptersByStory.set(ch.story_id, arr)
            }

            const mappedStories: Story[] = stories.map((s) => ({
              id: s.id,
              title: s.title,
              theme: s.theme,
              childProfileId: s.child_profile_id,
              childName: s.child_name,
              prompt: s.prompt || undefined,
              language: s.language || "en",
              chapters: chaptersByStory.get(s.id) || [],
              createdAt: s.created_at,
            }))

            set({ stories: mappedStories })
          }

          if (profiles && profiles.length > 0) {
            const mappedProfiles: ChildProfile[] = profiles.map((p) => ({
              id: p.id,
              name: p.name,
              age: p.age,
              companion: p.companion,
              favoriteThemes: p.favorite_themes || [],
              createdAt: p.created_at,
            }))

            set((s) => ({
              profiles: mappedProfiles,
              activeProfileId: s.activeProfileId ?? mappedProfiles[0]?.id ?? null,
            }))
          }
        } catch (e) {
          console.warn("Failed to load from Supabase:", e)
        }
      },
    }),
    {
      name: "pixietales-storage",
      // Strip base64 image data before saving to localStorage (too large, ~5MB limit)
      // Images are synced to Supabase and restored on login via loadFromSupabase
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          return str ? JSON.parse(str) : null
        },
        setItem: (name, value) => {
          const clone = JSON.parse(JSON.stringify(value))
          if (clone?.state?.stories) {
            for (const story of clone.state.stories) {
              if (story.chapters) {
                for (const ch of story.chapters) {
                  if (ch.imageUrl?.startsWith("data:")) {
                    ch.imageUrl = undefined
                  }
                }
              }
            }
          }
          localStorage.setItem(name, JSON.stringify(clone))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
