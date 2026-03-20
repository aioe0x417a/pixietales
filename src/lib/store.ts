"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ChildProfile, Story } from "./types"
import { generateId } from "./utils"

interface AppState {
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Child Profiles
      profiles: [],
      activeProfileId: null,

      addProfile: (data) => {
        const id = generateId()
        set((s) => ({
          profiles: [
            ...s.profiles,
            { ...data, id, createdAt: new Date().toISOString() },
          ],
          activeProfileId: s.activeProfileId ?? id,
        }))
        return id
      },

      updateProfile: (id, data) =>
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
        })),

      removeProfile: (id) =>
        set((s) => ({
          profiles: s.profiles.filter((p) => p.id !== id),
          activeProfileId:
            s.activeProfileId === id
              ? s.profiles.find((p) => p.id !== id)?.id ?? null
              : s.activeProfileId,
        })),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      getActiveProfile: () => {
        const { profiles, activeProfileId } = get()
        return profiles.find((p) => p.id === activeProfileId) ?? null
      },

      // Stories
      stories: [],

      addStory: (data) => {
        const id = generateId()
        set((s) => ({
          stories: [
            { ...data, id, createdAt: new Date().toISOString() },
            ...s.stories,
          ],
        }))
        return id
      },

      removeStory: (id) =>
        set((s) => ({
          stories: s.stories.filter((st) => st.id !== id),
        })),

      getStoriesForProfile: (profileId) =>
        get().stories.filter((s) => s.childProfileId === profileId),

      getStory: (id) => get().stories.find((s) => s.id === id),

      // UI State
      bedtimeMode: false,
      setBedtimeMode: (on) => set({ bedtimeMode: on }),
    }),
    {
      name: "pixietales-storage",
    }
  )
)
