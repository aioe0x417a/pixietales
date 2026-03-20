import { NextRequest, NextResponse } from "next/server"
import { generateStory, generateStoryFromDrawing, generateImage } from "@/lib/ai"
import { rateLimit } from "@/lib/rate-limit"
import type { StoryGenerationRequest, StoryChapter } from "@/lib/types"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 stories per minute per IP
    const ip = request.headers.get("x-forwarded-for") || "anonymous"
    const { allowed } = rateLimit(ip, 10, 60_000)
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
    } = body as StoryGenerationRequest & { generateImages?: boolean }

    // Input validation
    if (!childName || typeof childName !== "string" || childName.length > 50) {
      return NextResponse.json(
        { error: "Invalid child name" },
        { status: 400 }
      )
    }

    if (!childAge || typeof childAge !== "number" || childAge < 1 || childAge > 6) {
      return NextResponse.json(
        { error: "Age must be between 1 and 6" },
        { status: 400 }
      )
    }

    if (!companion) {
      return NextResponse.json(
        { error: "Missing required fields: companion" },
        { status: 400 }
      )
    }

    // Generate story text
    let story
    if (drawingBase64) {
      story = await generateStoryFromDrawing(
        drawingBase64,
        childName,
        childAge,
        companion
      )
    } else {
      story = await generateStory({
        childName,
        childAge,
        theme: theme || "adventure",
        customPrompt,
        companion,
        chapterCount,
      })
    }

    // Generate images for each chapter (if enabled and API key available)
    if (generateImages && process.env.OPENAI_API_KEY) {
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
    return NextResponse.json(
      { error: "Failed to generate story. Please try again." },
      { status: 500 }
    )
  }
}
