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
  return process.env.STORY_MODEL_ID || "anthropic/claude-3.5-haiku"
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ms: "Bahasa Melayu (Malay)",
  zh: "中文 (Mandarin Chinese)",
  ta: "தமிழ் (Tamil)",
  th: "ไทย (Thai)",
}

export async function generateStory(
  req: StoryGenerationRequest
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

Return ONLY valid JSON in this exact format:
{
  "title": "Story Title",
  "chapters": [
    {
      "title": "Chapter Title",
      "content": "Chapter content here...",
      "imagePrompt": "A soft watercolor illustration of [scene description], children's storybook style, warm gentle colors, dreamy atmosphere"
    }
  ]
}

Note: imagePrompt must always be in English regardless of story language.`

  const userPrompt = `Create a bedtime story about ${themeDescriptions[theme] || "a magical adventure"} with ${chapterCount} chapters for ${childName} (age ${childAge}).${
    customPrompt ? `\n\nSpecific request: ${customPrompt}` : ""
  }${language !== "en" ? `\n\nWrite the story in ${langName}.` : ""}`

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: language !== "en" ? 4000 : 3000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No story generated")

  return parseStoryJSON(content)
}

function parseStoryJSON(content: string): StoryGenerationResponse {
  // Try multiple extraction strategies

  // 1. Try code fence extraction
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as StoryGenerationResponse
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
  }

  // 3. Try the raw content
  try {
    return JSON.parse(content.trim()) as StoryGenerationResponse
  } catch { /* fall through */ }

  // Log for debugging
  console.error("Failed to parse AI response:", content.slice(0, 500))
  throw new Error("Story format error — the AI returned invalid JSON. Please try again.")
}

export async function generateStoryFromDrawing(
  imageBase64: string,
  childName: string,
  childAge: number,
  companion: string,
  language: string = "en"
): Promise<StoryGenerationResponse> {
  const wordRange = getWordCount(childAge)
  const client = getStoryClient()
  const model = getStoryModelId()

  const langName = LANGUAGE_NAMES[language] || "English"
  const langInstruction = language !== "en"
    ? `\n- Write the ENTIRE story in ${langName}`
    : ""

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

Return ONLY valid JSON: { "title": "...", "chapters": [{ "title": "...", "content": "...", "imagePrompt": "A soft watercolor illustration of [scene], children's storybook style" }] }
Note: imagePrompt must always be in English.`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Create a bedtime story inspired by this drawing:${language !== "en" ? ` Write in ${langName}.` : ""}` },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.8,
    max_tokens: 3000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No story generated")

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
