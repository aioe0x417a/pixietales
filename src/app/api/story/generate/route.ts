import { NextRequest, NextResponse } from "next/server"
import { generateStory, generateStoryFromDrawing, generateImage } from "@/lib/ai"
import type { StoryGenerationRequest, StoryChapter } from "@/lib/types"

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
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

    if (!childName || !childAge || !companion) {
      return NextResponse.json(
        { error: "Missing required fields: childName, childAge, companion" },
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
