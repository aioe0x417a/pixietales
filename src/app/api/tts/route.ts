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
    const { allowed } = await rateLimit(`tts:${user.id}`)
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

    if (!/^[a-zA-Z0-9_-]+$/.test(storyId)) {
      return NextResponse.json(
        { error: "Invalid storyId format" },
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
    const { data: existingFiles } = await supabaseAdmin.storage
      .from("story-audio")
      .list(`${user.id}/${storyId}`)

    const fileExists = existingFiles?.some((f) => f.name === `${chapterIndex}.mp3`)

    if (fileExists) {
      const { data: cachedUrl } = await supabaseAdmin.storage
        .from("story-audio")
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7) // 7-day signed URL
      if (cachedUrl?.signedUrl) {
        return NextResponse.json({ audioUrl: cachedUrl.signedUrl })
      }
    }

    // Determine prosody from voice category
    const voiceInfo = NARRATION_VOICES.find((v) => v.value === voice)
    const prosody = CATEGORY_PROSODY[voiceInfo?.category || "storyteller"]

    // Generate TTS audio
    let audioBuffer: Buffer
    try {
      const tts = new EdgeTTS()
      await tts.synthesize(text, voice, prosody)
      audioBuffer = tts.toBuffer()
      if (!audioBuffer || audioBuffer.length === 0) {
        console.error("TTS returned empty buffer for voice:", voice)
        return NextResponse.json(
          { error: "TTS returned empty audio. Try a different voice." },
          { status: 500 }
        )
      }
    } catch (ttsErr) {
      console.error("EdgeTTS synthesize error:", ttsErr)
      return NextResponse.json(
        { error: `TTS synthesis failed: ${(ttsErr as Error).message}` },
        { status: 500 }
      )
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("story-audio")
      .upload(storagePath, audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: "Audio storage failed. Please try again." },
        { status: 500 }
      )
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

    // Verify story ownership before updating
    const { data: storyOwner } = await supabaseAdmin
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .eq("user_id", user.id)
      .single()

    if (storyOwner) {
      // Store raw storage path (not signed URL) so it can be re-signed later
      await supabaseAdmin
        .from("story_chapters")
        .update({ audio_url: storagePath })
        .eq("story_id", storyId)
        .eq("chapter_index", chapterIndex)
    }

    return NextResponse.json({ audioUrl: signedUrl.signedUrl })
  } catch (error) {
    console.error("TTS route error:", error)
    const msg = (error as Error).message || "Unknown error"
    return NextResponse.json(
      { error: `Failed to generate audio: ${msg}` },
      { status: 500 }
    )
  }
}
