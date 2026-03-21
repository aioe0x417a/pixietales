import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStory, generateStoryFromDrawing, generateImage } from "@/lib/ai"
import { rateLimit } from "@/lib/rate-limit"
import { moderateContent } from "@/lib/content-filter"
import { validateAndReencodeImage } from "@/lib/image-validator"
import type { StoryGenerationRequest, StoryChapter } from "@/lib/types"

const VALID_COMPANIONS = ["bunny", "dragon", "bear", "cat", "unicorn"]
const VALID_THEMES = ["adventure", "animals", "space", "ocean", "friendship", "magic", "dinosaurs", "princesses", "superheroes", "nature", "custom"]
const VALID_LANGUAGES = ["en", "ms", "zh", "ta", "th"]

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Auth check: require valid Supabase session
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "") || ""
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Rate limit: 10 stories per minute per user
    const { allowed } = await rateLimit(user.id)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      )
    }

    // Plan enforcement
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: family } = await supabaseAdmin
      .from("families")
      .select("plan, stories_used_this_month")
      .eq("user_id", user.id)
      .single()

    const plan = family?.plan || "free"
    const used = family?.stories_used_this_month || 0

    if (plan === "free" && used >= 3) {
      return NextResponse.json(
        { error: "Free plan limit reached. Upgrade to create unlimited stories.", upgrade: true },
        { status: 402 }
      )
    }

    const body = await request.json()
    const {
      childName,
      childAge,
      theme,
      customPrompt,
      companion,
      drawingBase64,
      chapterCount = 4,
      generateImages = true,
      language = "en",
      childProfileId,
    } = body as StoryGenerationRequest & { generateImages?: boolean; childProfileId?: string }

    // Input validation
    if (!childName || typeof childName !== "string" || childName.length > 50) {
      return NextResponse.json(
        { error: "Invalid child name" },
        { status: 400 }
      )
    }

    if (!childAge || typeof childAge !== "number" || !Number.isInteger(childAge) || childAge < 1 || childAge > 8) {
      return NextResponse.json(
        { error: "Age must be between 1 and 8" },
        { status: 400 }
      )
    }

    if (!companion || !VALID_COMPANIONS.includes(companion)) {
      return NextResponse.json(
        { error: "Invalid companion" },
        { status: 400 }
      )
    }

    if (theme && !VALID_THEMES.includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme" },
        { status: 400 }
      )
    }

    if (language && !VALID_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { error: "Invalid language" },
        { status: 400 }
      )
    }

    // Sanitize customPrompt - cap length and strip control characters
    const sanitizedPrompt = customPrompt
      ? String(customPrompt).slice(0, 500).replace(/[\x00-\x1f]/g, "")
      : undefined

    if (sanitizedPrompt) {
      const { safe, reason } = await moderateContent(sanitizedPrompt)
      if (!safe) {
        return NextResponse.json(
          { error: reason || "Content not suitable for children's stories." },
          { status: 400 }
        )
      }
    }

    // Cap chapter count
    const safeChapterCount = Math.min(Math.max(Number(chapterCount) || 4, 1), 6)

    // Validate drawing size (max ~5MB base64)
    if (drawingBase64 && drawingBase64.length > 7_000_000) {
      return NextResponse.json(
        { error: "Drawing file is too large. Max 5MB." },
        { status: 400 }
      )
    }

    // Validate and re-encode drawing image (strips metadata, payloads, polyglot attacks)
    let cleanDrawingBase64: string | undefined
    if (drawingBase64) {
      try {
        cleanDrawingBase64 = await validateAndReencodeImage(drawingBase64)
      } catch (err) {
        return NextResponse.json(
          { error: (err as Error).message || "Invalid image file" },
          { status: 400 }
        )
      }
    }

    // Fetch recurring characters for story context
    let recurringCharacters: { character_name: string; description: string }[] = []
    if (childProfileId) {
      const { data: characters } = await supabase
        .from("character_log")
        .select("character_name, description")
        .eq("child_profile_id", childProfileId)
        .order("created_at", { ascending: false })
        .limit(5)

      if (characters && characters.length > 0) {
        recurringCharacters = characters
      }
    }

    // Generate story text
    let story
    if (cleanDrawingBase64) {
      story = await generateStoryFromDrawing(
        cleanDrawingBase64,
        childName,
        childAge,
        companion,
        language
      )
    } else {
      story = await generateStory({
        childName,
        childAge,
        theme: theme || "adventure",
        customPrompt: sanitizedPrompt,
        companion,
        chapterCount: safeChapterCount,
        language,
      }, recurringCharacters)
    }

    // Generate images for each chapter (if enabled and image API key available)
    const hasImageKey =
      (process.env.IMAGE_MODEL_PROVIDER === "gemini" && process.env.GOOGLE_API_KEY) ||
      (process.env.IMAGE_MODEL_PROVIDER === "openai" && process.env.OPENAI_API_KEY) ||
      process.env.GOOGLE_API_KEY ||
      process.env.OPENAI_API_KEY
    if (generateImages && hasImageKey) {
      const chaptersWithImages: StoryChapter[] = await Promise.all(
        story.chapters.map(async (chapter) => {
          try {
            if (chapter.imagePrompt) {
              const imageUrl = await generateImage(chapter.imagePrompt)
              return { ...chapter, imageUrl }
            }
            return chapter
          } catch (err) {
            console.error("Image generation failed for chapter:", chapter.title, err)
            return chapter
          }
        })
      )
      story.chapters = chaptersWithImages
    }

    // Extract and save new characters (fire and forget)
    if (childProfileId && story.chapters.length > 0) {
      const allText = story.chapters.map((c: StoryChapter) => c.content).join(" ")
      // Simple proper noun extraction: capitalized words that aren't the child's name
      // or common words, appearing 2+ times
      const words = allText.match(/\b[A-Z][a-z]{2,}\b/g) || []
      const nameCounts = new Map<string, number>()
      const commonWords = new Set([
        "The", "And", "But", "When", "Then", "Once", "This", "That", "They",
        "Their", "There", "With", "From", "Into", "What", "Chapter", "Little",
        "After", "Before", "Every", "Could", "Would", "Should", "About",
        "Very", "Just", "Even", "Still", "Over", "Under", "Around",
      ])

      for (const word of words) {
        if (word !== childName && !commonWords.has(word)) {
          nameCounts.set(word, (nameCounts.get(word) || 0) + 1)
        }
      }

      const newCharacters = Array.from(nameCounts.entries())
        .filter(([, count]) => count >= 2)
        .slice(0, 3)
        .map(([name]) => ({
          child_profile_id: childProfileId,
          character_name: name,
          description: `A character from "${story.title}"`,
          appeared_in_story_id: null as string | null,
        }))

      if (newCharacters.length > 0) {
        supabase.from("character_log").insert(newCharacters).then(() => {})
      }
    }

    // Increment story usage counter
    await supabaseAdmin
      .from("families")
      .upsert({
        user_id: user.id,
        stories_used_this_month: used + 1,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    return NextResponse.json(story)
  } catch (error) {
    console.error("Story generation error:", error)
    const message = "Failed to generate story. Please try again."
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
