import { getSupabase } from "@/lib/supabase"
import type { GardenPlant, GrowthStage, PlantTypeId } from "@/lib/types"

// 7 magical plant types that cycle
export const PLANT_TYPES: { id: PlantTypeId; name: string; color: string }[] = [
  { id: "moonflower", name: "Moonflower", color: "#C4B5FD" },
  { id: "starbloom", name: "Starbloom", color: "#FBBF24" },
  { id: "crystal_fern", name: "Crystal Fern", color: "#38BDF8" },
  { id: "nebula_orchid", name: "Nebula Orchid", color: "#F472B6" },
  { id: "aurora_vine", name: "Aurora Vine", color: "#34D399" },
  { id: "void_lily", name: "Void Lily", color: "#8B5CF6" },
  { id: "comet_rose", name: "Comet Rose", color: "#FB923C" },
]

export function getPlantType(stampIndex: number) {
  return PLANT_TYPES[(stampIndex - 1) % PLANT_TYPES.length]
}

export function getGrowthStage(stampIndex: number, totalStamps: number): GrowthStage {
  const delta = totalStamps - stampIndex
  if (delta >= 2) return "bloom"
  if (delta >= 1) return "sprout"
  return "seed"
}

// Plant a seed when a story is completed
export async function plantSeed(
  childProfileId: string,
  stampIndex: number
): Promise<GardenPlant | null> {
  const supabase = getSupabase()
  const plantType = getPlantType(stampIndex)
  // Grid layout: 6 cols x 4 rows = 24 slots
  const slotIndex = (stampIndex - 1) % 24
  const gridCol = slotIndex % 6
  const gridRow = Math.floor(slotIndex / 6)

  const { data, error } = await supabase
    .from("garden_plants")
    .upsert(
      {
        child_profile_id: childProfileId,
        plant_type: plantType.id,
        stamp_index: stampIndex,
        grid_col: gridCol,
        grid_row: gridRow,
      },
      { onConflict: "child_profile_id,stamp_index" }
    )
    .select()
    .single()

  if (error) {
    console.warn("Failed to plant seed:", error.message)
    return null
  }

  return {
    id: data.id,
    childProfileId: data.child_profile_id,
    plantType: data.plant_type,
    stampIndex: data.stamp_index,
    gridCol: data.grid_col,
    gridRow: data.grid_row,
    plantedAt: data.planted_at,
    growthStage: "seed", // just planted
  }
}

// Get all plants for a child with computed growth stages
export async function getGarden(childProfileId: string): Promise<GardenPlant[]> {
  const supabase = getSupabase()

  const [plantsResult, countResult] = await Promise.all([
    supabase
      .from("garden_plants")
      .select("*")
      .eq("child_profile_id", childProfileId)
      .order("stamp_index", { ascending: true }),
    supabase
      .from("story_stamps")
      .select("*", { count: "exact", head: true })
      .eq("child_profile_id", childProfileId),
  ])

  const totalStamps = countResult.count || 0
  const plants = (plantsResult.data || []).map((p) => ({
    id: p.id,
    childProfileId: p.child_profile_id,
    plantType: p.plant_type as PlantTypeId,
    stampIndex: p.stamp_index,
    gridCol: p.grid_col,
    gridRow: p.grid_row,
    plantedAt: p.planted_at,
    growthStage: getGrowthStage(p.stamp_index, totalStamps),
  }))

  return plants
}
