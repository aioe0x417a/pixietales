import OpenAI from "openai"

const KEYWORD_BLOCKLIST = [
  // Violence
  "kill", "murder", "stab", "shoot", "gun", "bomb", "explode", "blood", "gore",
  "torture", "rape", "assault", "attack", "weapon", "knife", "dead body", "corpse",
  "suicide", "self-harm", "cutting", "overdose", "hang yourself",

  // Sexual content
  "sex", "sexual", "naked", "nude", "porn", "pornography", "erotic", "xxx",
  "genitals", "penis", "vagina", "breast", "orgasm", "masturbat",

  // Hate speech
  "nigger", "faggot", "kike", "spic", "chink", "wetback", "tranny", "retard",
  "nazi", "white supremac", "ethnic cleansing",

  // Drugs
  "cocaine", "heroin", "meth", "crack", "fentanyl", "drug dealer",
]

function localKeywordCheck(text: string): { safe: boolean; reason?: string } {
  const lower = text.toLowerCase()
  for (const keyword of KEYWORD_BLOCKLIST) {
    if (lower.includes(keyword)) {
      return { safe: false, reason: "Content not suitable for children's stories." }
    }
  }
  return { safe: true }
}

// ── Layer 3: Contextual AI safety check ────────────────────────
// Catches scenarios that are dangerous in context but use normal words
// e.g. "drowning", "eaten by shark", "falling off cliff", "lost alone in dark forest"

let _moderationClient: OpenAI | null = null

function getModerationClient(): OpenAI | null {
  if (_moderationClient) return _moderationClient
  // Prefer OpenRouter (same as story gen) to keep costs minimal
  if (process.env.OPENROUTER_API_KEY) {
    _moderationClient = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    })
    return _moderationClient
  }
  if (process.env.OPENAI_API_KEY) {
    _moderationClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    return _moderationClient
  }
  return null
}

async function contextualSafetyCheck(
  text: string
): Promise<{ safe: boolean; reason?: string }> {
  const client = getModerationClient()
  if (!client) return { safe: true } // No AI client -- skip this layer

  try {
    const model = process.env.OPENROUTER_API_KEY
      ? (process.env.MODERATION_MODEL_ID || "anthropic/claude-haiku-4.5")
      : "gpt-4o-mini"

    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a child safety classifier for a bedtime story app (ages 1-6).

Evaluate whether the user's story prompt contains themes INAPPROPRIATE for young children's bedtime stories. Flag as UNSAFE if the prompt describes or requests any of these:
- Physical harm, injury, death, or danger to people or animals (drowning, being eaten, falling, crashing, burning, choking, poisoning)
- Scary or distressing scenarios (being chased, kidnapped, lost alone, trapped, abandoned)
- Natural disasters or catastrophes (earthquakes, tsunamis, fires destroying homes)
- Bullying, cruelty, or meanness as a central theme
- War, conflict, or battles
- Grief, loss, or death of characters (including pets)
- Anything that would cause nightmares or anxiety in a young child

SAFE prompts include: adventures, animals playing, magical journeys, making friends, exploring nature, learning something new, silly/funny scenarios, gentle challenges with happy resolutions.

Respond with ONLY valid JSON: {"safe": true} or {"safe": false, "suggestion": "<brief child-friendly alternative>"}`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0,
      max_tokens: 150,
    })

    const raw = response.choices?.[0]?.message?.content?.trim() || ""
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { safe: true }

    const result = JSON.parse(jsonMatch[0])
    if (result.safe === false) {
      const suggestion = result.suggestion
        ? ` How about: "${result.suggestion}"`
        : ""
      return {
        safe: false,
        reason: `That story idea isn't quite right for a bedtime story.${suggestion}`,
      }
    }
    return { safe: true }
  } catch (err) {
    // AI check failed -- don't block the user, other layers still protect
    console.warn("Contextual safety check failed:", err)
    return { safe: true }
  }
}

// ── Main moderation pipeline ───────────────────────────────────
// Layer 1: Keyword blocklist (instant, local)
// Layer 2: OpenAI Moderation API (general content policy)
// Layer 3: Contextual AI check (child-specific scenario detection)

export async function moderateContent(
  text: string
): Promise<{ safe: boolean; reason?: string }> {
  // Layer 1: Keyword blocklist (instant)
  const keywordResult = localKeywordCheck(text)
  if (!keywordResult.safe) return keywordResult

  // Layer 2: OpenAI Moderation API
  const apiKey = process.env.OPENAI_API_KEY
  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ input: text }),
      })

      if (response.ok) {
        const data = await response.json()
        const result = data?.results?.[0]

        if (result) {
          const THRESHOLD = 0.3
          const sensitiveCategories = [
            "sexual",
            "sexual/minors",
            "violence",
            "violence/graphic",
            "self-harm",
            "self-harm/intent",
            "self-harm/instructions",
            "hate",
            "hate/threatening",
          ]

          const scores: Record<string, number> = result.category_scores || {}
          for (const category of sensitiveCategories) {
            if ((scores[category] ?? 0) > THRESHOLD) {
              return { safe: false, reason: "Content not suitable for children's stories." }
            }
          }

          if (result.flagged) {
            return { safe: false, reason: "Content not suitable for children's stories." }
          }
        }
      }
    } catch {
      // OpenAI Moderation API failed -- continue to layer 3
    }
  }

  // Layer 3: Contextual AI safety check
  return contextualSafetyCheck(text)
}
