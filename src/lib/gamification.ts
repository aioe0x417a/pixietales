import { getSupabase } from "@/lib/supabase"
import type {
  Companion,
  StoryStamp,
  ReadingStreak,
  UnlockedCompanion,
  StoryCompleteResult,
  PlantTypeId,
} from "@/lib/types"
import { COMPANIONS } from "@/lib/types"
import { plantSeed, getGrowthStage, getPlantType } from "@/lib/garden"

// ── Award a stamp for completing a story ─────────────────

export async function awardStamp(
  childProfileId: string,
  storyId: string
): Promise<StoryStamp | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("story_stamps")
    .upsert(
      {
        child_profile_id: childProfileId,
        story_id: storyId,
        stamp_type: "standard",
      },
      { onConflict: "child_profile_id,story_id" }
    )
    .select()
    .single()

  if (error) {
    console.warn("Failed to award stamp:", error.message)
    return null
  }

  return {
    id: data.id,
    childProfileId: data.child_profile_id,
    storyId: data.story_id,
    stampType: data.stamp_type,
    earnedAt: data.earned_at,
  }
}

// ── Update nightly reading streak ────────────────────────

export async function updateStreak(
  childProfileId: string
): Promise<ReadingStreak> {
  const supabase = getSupabase()
  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

  // Get or create streak record
  const { data: existing } = await supabase
    .from("reading_streaks")
    .select("*")
    .eq("child_profile_id", childProfileId)
    .single()

  let currentStreak = 1
  let longestStreak = 1
  let graceUsed = false

  if (existing) {
    const lastRead = existing.last_read_date

    if (lastRead === today) {
      // Already counted today
      return {
        childProfileId,
        currentStreak: existing.current_streak,
        longestStreak: existing.longest_streak,
        lastReadDate: existing.last_read_date,
        graceUsed: existing.grace_used,
      }
    }

    const yesterday = getDateString(-1)
    const dayBefore = getDateString(-2)

    if (lastRead === yesterday) {
      // Consecutive day -- extend streak
      currentStreak = existing.current_streak + 1
      graceUsed = false
    } else if (lastRead === dayBefore && !existing.grace_used) {
      // Missed one day -- use grace
      currentStreak = existing.current_streak + 1
      graceUsed = true
    } else {
      // Streak broken
      currentStreak = 1
      graceUsed = false
    }

    longestStreak = Math.max(currentStreak, existing.longest_streak)
  }

  const { error } = await supabase.from("reading_streaks").upsert(
    {
      child_profile_id: childProfileId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_read_date: today,
      grace_used: graceUsed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "child_profile_id" }
  )

  if (error) {
    console.warn("Failed to update streak:", error.message)
  }

  return {
    childProfileId,
    currentStreak,
    longestStreak,
    lastReadDate: today,
    graceUsed,
  }
}

// ── Check and unlock companions ──────────────────────────

export async function checkCompanionUnlock(
  childProfileId: string
): Promise<Companion | null> {
  const supabase = getSupabase()

  // Count total stamps for this child
  const { count } = await supabase
    .from("story_stamps")
    .select("*", { count: "exact", head: true })
    .eq("child_profile_id", childProfileId)

  const totalStamps = count || 0

  // Get already unlocked companions
  const { data: unlocked } = await supabase
    .from("unlocked_companions")
    .select("companion_id")
    .eq("child_profile_id", childProfileId)

  const unlockedIds = new Set((unlocked || []).map((u) => u.companion_id))

  // Find newly eligible companions
  let newlyUnlocked: Companion | null = null

  for (const companion of COMPANIONS) {
    if (
      companion.unlockThreshold > 0 &&
      totalStamps >= companion.unlockThreshold &&
      !unlockedIds.has(companion.value)
    ) {
      const { error } = await supabase.from("unlocked_companions").upsert(
        {
          child_profile_id: childProfileId,
          companion_id: companion.value,
        },
        { onConflict: "child_profile_id,companion_id" }
      )

      if (!error) {
        // Return the highest-threshold newly unlocked companion
        newlyUnlocked = companion.value
      }
    }
  }

  return newlyUnlocked
}

// ── Get full gamification state for a child ──────────────

export async function getGamificationState(childProfileId: string): Promise<{
  stamps: StoryStamp[]
  streak: ReadingStreak
  unlockedCompanions: UnlockedCompanion[]
}> {
  const supabase = getSupabase()

  const [stampsResult, streakResult, companionsResult] = await Promise.all([
    supabase
      .from("story_stamps")
      .select("*")
      .eq("child_profile_id", childProfileId)
      .order("earned_at", { ascending: false }),
    supabase
      .from("reading_streaks")
      .select("*")
      .eq("child_profile_id", childProfileId)
      .single(),
    supabase
      .from("unlocked_companions")
      .select("*")
      .eq("child_profile_id", childProfileId),
  ])

  const stamps: StoryStamp[] = (stampsResult.data || []).map((s) => ({
    id: s.id,
    childProfileId: s.child_profile_id,
    storyId: s.story_id,
    stampType: s.stamp_type,
    earnedAt: s.earned_at,
  }))

  const streak: ReadingStreak = streakResult.data
    ? {
        childProfileId: streakResult.data.child_profile_id,
        currentStreak: streakResult.data.current_streak,
        longestStreak: streakResult.data.longest_streak,
        lastReadDate: streakResult.data.last_read_date,
        graceUsed: streakResult.data.grace_used,
      }
    : {
        childProfileId,
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
        graceUsed: false,
      }

  const unlockedCompanions: UnlockedCompanion[] = (
    companionsResult.data || []
  ).map((c) => ({
    childProfileId: c.child_profile_id,
    companionId: c.companion_id,
    unlockedAt: c.unlocked_at,
  }))

  return { stamps, streak, unlockedCompanions }
}

// ── Orchestrator: called when a story is completed ───────

export async function onStoryComplete(
  childProfileId: string,
  storyId: string
): Promise<StoryCompleteResult> {
  // 1. Award stamp
  const stamp = await awardStamp(childProfileId, storyId)

  // 2. Update streak
  const streak = await updateStreak(childProfileId)

  // 3. Check companion unlock
  const companionUnlocked = await checkCompanionUnlock(childProfileId)

  // 4. Plant a garden seed
  const { count: totalStamps } = await getSupabase()
    .from("story_stamps")
    .select("*", { count: "exact", head: true })
    .eq("child_profile_id", childProfileId)

  const stampCount = totalStamps || 0
  const gardenPlant = await plantSeed(childProfileId, stampCount)

  // Check if any existing plant just bloomed (delta went from 1 to 2)
  let gardenPlantBloomed = false
  let bloomedPlantType: PlantTypeId | null = null
  if (stampCount >= 3) {
    // The plant that was planted 2 stories ago just reached bloom
    const bloomedIndex = stampCount - 2
    const stage = getGrowthStage(bloomedIndex, stampCount)
    const prevStage = getGrowthStage(bloomedIndex, stampCount - 1)
    if (stage === "bloom" && prevStage === "sprout") {
      bloomedPlantType = getPlantType(bloomedIndex).id
      gardenPlantBloomed = true
    }
  }

  return {
    stampAwarded: !!stamp,
    streakUpdated: true,
    newStreak: streak.currentStreak,
    companionUnlocked,
    gardenPlantPlanted: !!gardenPlant,
    gardenPlantBloomed,
    bloomedPlantType,
  }
}

// ── Helpers ──────────────────────────────────────────────

function getDateString(offsetDays: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().split("T")[0]
}
