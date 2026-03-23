import OpenAI from "openai"
import type { StoryGenerationRequest, StoryGenerationResponse, StoryChapter } from "./types"
import { getWordCount } from "./utils"

// Lazy-initialized clients (server-side only)
let _openai: OpenAI | null = null
let _openrouter: OpenAI | null = null

function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" })
  }
  return _openai
}

function getOpenRouter() {
  if (!_openrouter) {
    _openrouter = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY || "",
      baseURL: "https://openrouter.ai/api/v1",
    })
  }
  return _openrouter
}

function getStoryClient() {
  if (process.env.STORY_MODEL_PROVIDER === "openrouter") return getOpenRouter()
  return getOpenAI()
}

function getStoryModelId() {
  return process.env.STORY_MODEL_ID || "anthropic/claude-haiku-4.5"
}

const STORY_JSON_SCHEMA = {
  name: "story",
  strict: true,
  schema: {
    type: "object" as const,
    additionalProperties: false,
    required: ["title", "chapters"],
    properties: {
      title: { type: "string" as const },
      chapters: {
        type: "array" as const,
        items: {
          type: "object" as const,
          additionalProperties: false,
          required: ["title", "content", "imagePrompt"],
          properties: {
            title: { type: "string" as const },
            content: { type: "string" as const },
            imagePrompt: { type: "string" as const },
          },
        },
      },
    },
  },
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ms: "Bahasa Melayu (Malay)",
  zh: "中文 (Mandarin Chinese)",
  ta: "தமிழ் (Tamil)",
  th: "ไทย (Thai)",
}

export async function generateStory(
  req: StoryGenerationRequest,
  recurringCharacters?: { character_name: string; description: string }[]
): Promise<StoryGenerationResponse> {
  const { childName, childAge, theme, customPrompt, companion, chapterCount = 4, language = "en" } = req
  const wordRange = getWordCount(childAge)
  const client = getStoryClient()
  const model = getStoryModelId()

  const companionNames: Record<string, string> = {
    bunny: "a fluffy bunny friend",
    dragon: "a tiny friendly dragon",
    bear: "a cuddly bear companion",
    cat: "a curious little cat",
    unicorn: "a sparkly unicorn friend",
  }

  const themeDescriptions: Record<string, string> = {
    adventure: "an exciting adventure",
    animals: "a heartwarming animal story",
    space: "an amazing space exploration",
    ocean: "a magical ocean journey",
    friendship: "a beautiful story about friendship",
    magic: "a magical enchanted tale",
    dinosaurs: "a fun dinosaur adventure",
    princesses: "a royal princess story",
    superheroes: "a brave superhero tale",
    nature: "a wonderful nature story",
    custom: customPrompt || "a magical bedtime story",
  }

  const langName = LANGUAGE_NAMES[language] || "English"
  const langInstruction = language !== "en"
    ? `\n- IMPORTANT: Write the ENTIRE story (title, chapter titles, and content) in ${langName}. All text must be in ${langName}.`
    : ""

  const systemPrompt = `You are a children's storyteller creating bedtime stories for a ${childAge}-year-old child named ${childName}.

Rules:
- Use simple, age-appropriate vocabulary for a ${childAge}-year-old
- Each chapter should be ${wordRange.min}-${wordRange.max} words
- Include ${childName}'s companion: ${companionNames[companion] || "a friendly companion"}
- The story should be calming and end peacefully (it's a bedtime story)
- Use vivid but gentle imagery
- Include sensory details (soft sounds, warm colors, gentle feelings)
- End with ${childName} feeling safe, happy, and sleepy
- No scary elements, violence, or anything anxiety-inducing
- Weave in gentle moral lessons naturally${langInstruction}
- imagePrompt must always be in English regardless of story language, describing a soft watercolor children's book illustration of the scene${
    recurringCharacters && recurringCharacters.length > 0
      ? `\n\nCharacters from previous stories that ${childName} loves (you may include them as friendly cameos or references):\n${recurringCharacters.map((c) => `- ${c.character_name}: ${c.description}`).join("\n")}`
      : ""
  }`

  const userPrompt = `Create a bedtime story about ${themeDescriptions[theme] || "a magical adventure"} with ${chapterCount} chapters for ${childName} (age ${childAge}).${
    customPrompt ? `\n\nSpecific request: ${customPrompt}` : ""
  }${language !== "en" ? `\n\nWrite the story in ${langName}.` : ""}`

  const useOpenRouter = process.env.STORY_MODEL_PROVIDER === "openrouter"

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: language !== "en" ? 8000 : 6000,
    response_format: { type: "json_schema", json_schema: STORY_JSON_SCHEMA } as never,
    ...(useOpenRouter ? { plugins: [{ id: "response-healing" }] } as never : {}),
  } as never)

  // Detect truncated responses before attempting JSON parse
  const finishReason = response.choices[0]?.finish_reason
  if (finishReason === "length") {
    throw new Error("The story was too long and got cut off. Try fewer chapters or a younger age.")
  }

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No story generated")

  return parseStoryJSON(content)
}

function sanitizeForJSON(str: string): string {
  // Walk the string, track whether we're inside a JSON string value,
  // and only escape control characters when inside a string.
  // Structural whitespace (between fields) is left untouched.
  let result = ""
  let inString = false
  let escaped = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (escaped) { result += ch; escaped = false; continue }
    if (ch === "\\" && inString) { result += ch; escaped = true; continue }
    if (ch === '"') { inString = !inString; result += ch; continue }
    if (inString && ch.charCodeAt(0) < 0x20) {
      if (ch === "\n") { result += "\\n"; continue }
      if (ch === "\r") { result += "\\r"; continue }
      if (ch === "\t") { result += "\\t"; continue }
      continue // skip other control chars
    }
    result += ch
  }
  return result
}

function parseStoryJSON(content: string): StoryGenerationResponse {
  // Try multiple extraction strategies, with and without control-char sanitization

  // 1. Try code fence extraction
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as StoryGenerationResponse
    } catch { /* fall through */ }
    try {
      return JSON.parse(sanitizeForJSON(fenceMatch[1].trim())) as StoryGenerationResponse
    } catch { /* fall through */ }
  }

  // 2. Try finding outermost { ... } in the content
  const firstBrace = content.indexOf("{")
  const lastBrace = content.lastIndexOf("}")
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = content.slice(firstBrace, lastBrace + 1)
    try {
      return JSON.parse(jsonCandidate) as StoryGenerationResponse
    } catch { /* fall through */ }
    try {
      return JSON.parse(sanitizeForJSON(jsonCandidate)) as StoryGenerationResponse
    } catch { /* fall through */ }
  }

  // 3. Try the raw content
  try {
    return JSON.parse(content.trim()) as StoryGenerationResponse
  } catch { /* fall through */ }
  try {
    return JSON.parse(sanitizeForJSON(content.trim())) as StoryGenerationResponse
  } catch { /* fall through */ }

  console.error("Failed to parse AI response. Length:", content.length, "Start:", content.slice(0, 300), "End:", content.slice(-200))
  throw new Error("Story format error — please try again.")
}

// Vision-capable model for drawing-to-story (the default text model may not support images)
function getVisionClient() {
  const visionProvider = process.env.VISION_MODEL_PROVIDER || process.env.STORY_MODEL_PROVIDER
  if (visionProvider === "openrouter") return getOpenRouter()
  return getOpenAI()
}

function getVisionModelId() {
  // Dedicated vision model env var, falls back to the story model (haiku-4.5 supports vision on OpenRouter)
  return process.env.VISION_MODEL_ID || getStoryModelId()
}

export async function generateStoryFromDrawing(
  imageBase64: string,
  childName: string,
  childAge: number,
  companion: string,
  language: string = "en"
): Promise<StoryGenerationResponse> {
  const wordRange = getWordCount(childAge)
  const client = getVisionClient()
  const model = getVisionModelId()

  const langName = LANGUAGE_NAMES[language] || "English"
  const langInstruction = language !== "en"
    ? `\n- Write the ENTIRE story in ${langName}`
    : ""

  // Vision + json_schema response_format is not supported by most providers.
  // Instead, instruct the model to return JSON in the prompt and parse it ourselves.
  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: `You are a children's storyteller. Analyze the child's drawing and create a magical bedtime story inspired by it for ${childName} (age ${childAge}).

Rules:
- Create 3-4 chapters, each ${wordRange.min}-${wordRange.max} words
- Include their companion: ${companion}
- Make it a gentle bedtime story
- End peacefully${langInstruction}
- imagePrompt must always be in English, describing a soft watercolor children's book illustration of the scene

IMPORTANT: Respond with ONLY a JSON object in this exact format, no other text:
{"title": "Story Title", "chapters": [{"title": "Ch Title", "content": "Story text...", "imagePrompt": "A soft watercolor..."}]}`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Create a bedtime story inspired by this drawing:${language !== "en" ? ` Write in ${langName}.` : ""}` },
          { type: "image_url", image_url: { url: `data:image/png;base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.8,
    max_tokens: language !== "en" ? 8000 : 6000,
  } as never)

  // Detect truncated responses (vision requests consume more tokens)
  const finishReason = response.choices[0]?.finish_reason
  if (finishReason === "length") {
    throw new Error("The story was too long and got cut off. Try fewer chapters or a younger age.")
  }

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No story generated from drawing")

  return parseStoryJSON(content)
}

export async function generateImage(prompt: string): Promise<string> {
  const provider = process.env.IMAGE_MODEL_PROVIDER || "gemini"

  if (provider === "gemini") {
    return generateImageGemini(prompt)
  }

  if (provider === "openai") {
    const response = await getOpenAI().images.generate({
      model: process.env.IMAGE_MODEL_ID || "dall-e-3",
      prompt: `${prompt}. Style: soft watercolor children's book illustration, warm gentle colors, dreamy magical atmosphere, no text, safe for children.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    })
    return response.data?.[0]?.url ?? ""
  }

  throw new Error(`Unsupported image provider: ${provider}`)
}

async function generateImageGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error("GOOGLE_API_KEY is not set")

  const model = process.env.IMAGE_MODEL_ID || "gemini-2.5-flash-image"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `Generate an image: ${prompt}. Style: soft watercolor children's book illustration, warm gentle colors, dreamy magical atmosphere, no text, safe for children.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini image generation failed: ${response.status} ${error}`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts

  if (!parts) throw new Error("No image generated by Gemini")

  // Find the image part in the response
  for (const part of parts) {
    if (part.inlineData) {
      const { mimeType, data: base64Data } = part.inlineData
      return `data:${mimeType};base64,${base64Data}`
    }
  }

  throw new Error("No image data in Gemini response")
}
