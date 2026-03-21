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

export async function moderateContent(
  text: string
): Promise<{ safe: boolean; reason?: string }> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return localKeywordCheck(text)
  }

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ input: text }),
    })

    if (!response.ok) {
      // API error -- fall back to local check
      return localKeywordCheck(text)
    }

    const data = await response.json()
    const result = data?.results?.[0]

    if (!result) {
      return localKeywordCheck(text)
    }

    // Stricter thresholds for children's app context
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

    // Also respect the API's own flagged verdict
    if (result.flagged) {
      return { safe: false, reason: "Content not suitable for children's stories." }
    }

    return { safe: true }
  } catch {
    // Network error or parse failure -- fall back to local check
    return localKeywordCheck(text)
  }
}
