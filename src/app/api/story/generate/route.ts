import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { generateStory, generateStoryFromDrawing, generateImage } from "@/lib/ai"
import { rateLimit } from "@/lib/rate-limit"
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
    const { allowed } = rateLimit(user.id, 10, 60_000)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
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
    } = body as StoryGenerationRequest & { generateImages?: boolean }

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
      })
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
