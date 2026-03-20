import OpenAI from "openai"
import type { StoryGenerationRequest, StoryGenerationResponse, StoryChapter } from "./types"
import { getWordCount } from "./utils"

// Server-side only - never import on client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
})

function getClient() {
  if (process.env.STORY_MODEL_PROVIDER === "openrouter") return openrouter
  return openai
}

function getModelId() {
  return process.env.STORY_MODEL_ID || "gpt-4o-mini"
}

export async function generateStory(
  req: StoryGenerationRequest
): Promise<StoryGenerationResponse> {
  const { childName, childAge, theme, customPrompt, companion, chapterCount = 4 } = req
  const wordRange = getWordCount(childAge)
  const client = getClient()
  const model = getModelId()

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
- Weave in gentle moral lessons naturally

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
}`

  const userPrompt = `Create a bedtime story about ${themeDescriptions[theme] || "a magical adventure"} with ${chapterCount} chapters for ${childName} (age ${childAge}).${
    customPrompt ? `\n\nSpecific request: ${customPrompt}` : ""
  }`

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No story generated")

  const parsed = JSON.parse(content) as StoryGenerationResponse
  return parsed
}

export async function generateStoryFromDrawing(
  imageBase64: string,
  childName: string,
  childAge: number,
  companion: string
): Promise<StoryGenerationResponse> {
  const wordRange = getWordCount(childAge)

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are a children's storyteller. Analyze the child's drawing and create a magical bedtime story inspired by it for ${childName} (age ${childAge}).

Rules:
- Create 3-4 chapters, each ${wordRange.min}-${wordRange.max} words
- Include their companion: ${companion}
- Make it a gentle bedtime story
- End peacefully

Return ONLY valid JSON: { "title": "...", "chapters": [{ "title": "...", "content": "...", "imagePrompt": "A soft watercolor illustration of [scene], children's storybook style" }] }`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Create a bedtime story inspired by this drawing:" },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      },
    ],
    temperature: 0.8,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("No story generated")

  return JSON.parse(content) as StoryGenerationResponse
}

export async function generateImage(prompt: string): Promise<string> {
  const provider = process.env.IMAGE_MODEL_PROVIDER || "openai"

  if (provider === "openai") {
    const response = await openai.images.generate({
      model: process.env.IMAGE_MODEL_ID || "dall-e-3",
      prompt: `${prompt}. Style: soft watercolor children's book illustration, warm gentle colors, dreamy magical atmosphere, no text, safe for children.`,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    })
    return response.data?.[0]?.url ?? ""
  }

  // Future: Gemini, Imagen 4, etc.
  throw new Error(`Unsupported image provider: ${provider}`)
}
