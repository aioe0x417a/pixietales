import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { EdgeTTS } from "@andresaya/edge-tts"
import { rateLimit } from "@/lib/rate-limit"
import { NARRATION_VOICES, type VoiceCategory } from "@/lib/types"

const VALID_VOICES = NARRATION_VOICES.map((v) => v.value)

// Prosody settings per voice category for expressive narration
const CATEGORY_PROSODY: Record<VoiceCategory, { rate: string; pitch: string; volume: string }> = {
  storyteller: { rate: "-15%", pitch: "-3Hz", volume: "+0%" },   // Slow, calm, soothing
  child: { rate: "+0%", pitch: "+3Hz", volume: "+5%" },          // Bright, energetic
  character: { rate: "-5%", pitch: "+0Hz", volume: "+0%" },      // Natural, expressive
}

// Force Node.js runtime (edge-tts uses WebSocket which needs Node)
export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // Auth check
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

    // Rate limit: 20 TTS requests per minute per user
    const { allowed } = rateLimit(`tts:${user.id}`, 20, 60_000)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { text, voice, storyId, chapterIndex } = body

    // Validate inputs
    if (!text || typeof text !== "string" || text.length > 10_000) {
      return NextResponse.json(
        { error: "Invalid text" },
        { status: 400 }
      )
    }

    if (!voice || !VALID_VOICES.includes(voice)) {
      return NextResponse.json(
        { error: "Invalid voice" },
        { status: 400 }
      )
    }

    if (!storyId || typeof storyId !== "string") {
      return NextResponse.json(
        { error: "Invalid storyId" },
        { status: 400 }
      )
    }

    if (typeof chapterIndex !== "number" || chapterIndex < 0 || chapterIndex > 10) {
      return NextResponse.json(
        { error: "Invalid chapterIndex" },
        { status: 400 }
      )
    }

    // Use admin client for storage operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Cache check: see if audio already exists in storage
    const storagePath = `${user.id}/${storyId}/${chapterIndex}.mp3`
    const { data: existing } = await supabaseAdmin.storage
      .from("story-audio")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7) // 7-day signed URL

    if (existing?.signedUrl) {
      return NextResponse.json({ audioUrl: existing.signedUrl })
    }

    // Determine prosody from voice category
    const voiceInfo = NARRATION_VOICES.find((v) => v.value === voice)
    const prosody = CATEGORY_PROSODY[voiceInfo?.category || "storyteller"]

    // Generate TTS audio
    const tts = new EdgeTTS()
    await tts.synthesize(text, voice, prosody)

    const audioBuffer = tts.toBuffer()

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("story-audio")
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      // Fall back to returning base64 inline if upload fails
      const base64 = audioBuffer.toString("base64")
      return NextResponse.json({
        audioUrl: `data:audio/mpeg;base64,${base64}`,
      })
    }

    // Get a signed URL for the uploaded file
    const { data: signedUrl } = await supabaseAdmin.storage
      .from("story-audio")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7) // 7-day signed URL

    if (!signedUrl?.signedUrl) {
      // Fall back to public URL
      const { data: publicUrl } = supabaseAdmin.storage
        .from("story-audio")
        .getPublicUrl(storagePath)
      return NextResponse.json({ audioUrl: publicUrl.publicUrl })
    }

    // Also update the story_chapters table with the audio URL
    await supabaseAdmin
      .from("story_chapters")
      .update({ audio_url: signedUrl.signedUrl })
      .eq("story_id", storyId)
      .eq("chapter_index", chapterIndex)

    return NextResponse.json({ audioUrl: signedUrl.signedUrl })
  } catch (error) {
    console.error("TTS error:", error)
    const message = error instanceof Error ? error.message : "Failed to generate audio"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
