"use client"

import { getSupabase } from "@/lib/supabase"
import { generateId } from "@/lib/utils"
import type { ChildProfile, Story } from "@/lib/types"

type SyncOpType = "upsert-profile" | "delete-profile" | "upsert-story" | "delete-story"

interface SyncOperation {
  id: string
  type: SyncOpType
  payload: unknown
  createdAt: string
  attempts: number
}

const QUEUE_KEY = "pixietales-sync-queue"
const MAX_ATTEMPTS = 5

function readQueue(): SyncOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? (JSON.parse(raw) as SyncOperation[]) : []
  } catch {
    return []
  }
}

function writeQueue(ops: SyncOperation[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(ops))
  } catch (e) {
    console.error("sync-queue: failed to write queue to localStorage", e)
  }
}

export function enqueue(type: SyncOpType, payload: unknown): void {
  const op: SyncOperation = {
    id: crypto.randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  }
  const queue = readQueue()
  queue.push(op)
  writeQueue(queue)
}

export function getQueueSize(): number {
  return readQueue().length
}

async function executeOp(op: SyncOperation): Promise<void> {
  const supabase = getSupabase()

  switch (op.type) {
    case "upsert-profile": {
      const profile = op.payload as ChildProfile & { userId: string }
      const { error } = await supabase.from("child_profiles").upsert({
        id: profile.id,
        user_id: profile.userId,
        name: profile.name,
        age: profile.age,
        companion: profile.companion,
        favorite_themes: profile.favoriteThemes || [],
        created_at: profile.createdAt,
      })
      if (error) throw error
      break
    }

    case "delete-profile": {
      const { id } = op.payload as { id: string }
      const { error } = await supabase.from("child_profiles").delete().eq("id", id)
      if (error) throw error
      break
    }

    case "upsert-story": {
      const story = op.payload as Story & { userId: string }
      const { error: storyError } = await supabase.from("stories").upsert({
        id: story.id,
        user_id: story.userId,
        child_profile_id: story.childProfileId,
        title: story.title,
        theme: story.theme,
        child_name: story.childName,
        prompt: story.prompt || null,
        language: story.language || "en",
        created_at: story.createdAt,
      })
      if (storyError) throw storyError

      // Sync chapters: delete then re-insert
      const { error: deleteError } = await supabase
        .from("story_chapters")
        .delete()
        .eq("story_id", story.id)
      if (deleteError) throw deleteError

      if (story.chapters.length > 0) {
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
        const { error: insertError } = await supabase.from("story_chapters").insert(chapters)
        if (insertError) throw insertError
      }
      break
    }

    case "delete-story": {
      const { id } = op.payload as { id: string }
      // Chapters cascade-delete via FK
      const { error } = await supabase.from("stories").delete().eq("id", id)
      if (error) throw error
      break
    }

    default:
      console.error("sync-queue: unknown op type", (op as SyncOperation).type)
  }
}

export async function processQueue(): Promise<void> {
  const queue = readQueue()
  if (queue.length === 0) return

  const remaining: SyncOperation[] = []

  for (const op of queue) {
    try {
      await executeOp(op)
      // Success -- drop from queue (don't push to remaining)
    } catch (e) {
      const updated = { ...op, attempts: op.attempts + 1 }
      if (updated.attempts >= MAX_ATTEMPTS) {
        console.error(
          `sync-queue: op ${op.type}(${op.id}) failed after ${MAX_ATTEMPTS} attempts, discarding.`,
          e
        )
        // Discard -- don't push to remaining
      } else {
        remaining.push(updated)
      }
    }
  }

  writeQueue(remaining)
}

export function initSyncQueue(): void {
  // Process any queued ops on startup
  processQueue().catch((e) => console.warn("sync-queue: processQueue on init failed", e))

  // Re-process when connectivity returns
  if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
      processQueue().catch((e) => console.warn("sync-queue: processQueue on online failed", e))
    })
  }
}
