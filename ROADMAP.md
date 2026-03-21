# PixieTales -- Product Roadmap

> Bedtime story app for parents and kids (ages 1-6). AI-powered story generation, drawing-to-story, audio narration, and bedtime routines. Web first, then Android + iOS.

---

## Vision

PixieTales helps parents tell magical bedtime stories to their kids. The parent chooses or prompts a story theme, and AI generates a personalized, illustrated, narrated story tailored to their child. Kids can also upload drawings that become adventures. The app owns the full bedtime experience -- from wind-down to sleep.

---

## Target Audience

- **Primary:** Parents of children aged 1-6
- **Secondary:** Grandparents, caregivers, preschool teachers
- **Geography:** Global, with strength in Southeast Asia (multilingual opportunity)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend (Web) | Next.js 15 (App Router), React, Tailwind CSS v4 |
| Frontend (Mobile) | Expo (React Native) -- Android + iOS |
| Backend | Next.js API Routes, Supabase Edge Functions |
| Database | Supabase (Postgres + Auth + Storage + Realtime) |
| AI -- Story Text | OpenRouter (Claude 3 Haiku) |
| AI -- Illustrations | Gemini 3.1 Flash Image (`gemini-3.1-flash-image-preview` aka "Nano Banana 2") + gpt-image-1 as alternative |
| AI -- Narration | ElevenLabs TTS (primary), OpenAI TTS (budget fallback) |
| Payments | Stripe (subscriptions) |
| Deployment | Vercel (web), Expo EAS (mobile) |
| DNS/CDN | Cloudflare |
| Analytics | Plausible (COPPA-safe, no cookies) |
| Automation | n8n (webhooks, email flows) |

---

## Architecture Overview

```
Monorepo (Turborepo + pnpm)
├── apps/
│   ├── web/              Next.js 15 -- website + PWA
│   └── mobile/           Expo (React Native) -- iOS + Android
└── packages/
    ├── api/              tRPC routers (shared type-safe API)
    ├── db/               Supabase client + generated types
    └── config/           Constants, plan limits, env schemas

Server-Side AI Pipeline (all keys protected):
  Client → API Route → Rate Limit (Upstash Redis) → AI Provider → Cache → CDN

Storage (Supabase, public buckets, CDN-served):
  story-images/   {storyId}/{chapterIndex}.png
  story-audio/    {storyId}/{chapterIndex}.mp3
  user-avatars/   {userId}.jpg (private bucket)

Database:
  families          → Stripe billing + plan limits
  profiles          → Parent accounts (linked to auth.users)
  child_profiles    → No auth -- parent-managed data records
  stories           → Generated content + CDN URLs
  story_jobs        → Generation progress (Realtime subscribed)
  consent_log       → COPPA audit trail
```

**Key principle:** All AI calls go through server-side routes. No API keys exposed to client. Stories cached aggressively -- generate once, serve from CDN forever. Mobile app is a thin client consuming the same API as the website.

---

## Pricing Model

| Plan | Price | Includes |
|---|---|---|
| Free | $0 | 3 stories/month, 1 child profile, core sleep sounds |
| Family | $7.99/mo | Unlimited stories, 5 profiles, all voices, bedtime routines |
| Annual | $59.99/yr | Same as Family, ~37% discount |
| Lifetime | $149 | Launch offer for early adopters |

---

## COPPA Compliance

Mandatory for ages 1-6. Architecture decisions:
- Children are data records (`child_profiles`), not `auth.users` -- parents log in, kids pick a profile
- No ads, no tracking SDKs, no cross-app identifiers
- Plausible for analytics (cookie-free, COPPA safe)
- One-click family data deletion endpoint
- Consent logging with timestamps and policy version
- Privacy policy in plain language, prominent on landing page
- No social features, no external links from child-facing UI
- Parental gate on settings/purchases (arithmetic or button-hold)

---

## Feature Roadmap

### Phase 1 -- MVP (Web Launch)

The minimum product to launch, get users, and validate demand.

#### 1.1 AI Story Generator
- Parent picks a theme from curated categories: Adventure, Animals, Space, Ocean, Friendship, Magic, Dinosaurs, Princesses, Superheroes, Nature
- OR parent types a custom prompt ("a story about a brave little cat who learns to swim")
- AI generates a 300-500 word story with 3-5 chapters
- Story length/vocabulary adapts to child's age (1-2: ~150 words simple; 3-4: ~300 words; 5-6: ~500 words richer)
- Each chapter gets a title

#### 1.2 AI Illustrations
- Each chapter gets a generated illustration via Gemini image generation API
- Consistent art style across all chapters (locked via server-side style prompt)
- Style: soft watercolor / storybook aesthetic, warm colors, child-friendly
- Cached in Supabase Storage, served via CDN

#### 1.3 Audio Narration
- ElevenLabs TTS reads the story aloud
- 2-3 voice options at launch: warm storyteller, gentle whisper (bedtime), friendly narrator
- Word-by-word highlight sync during playback (read-along mode)
- Sleep fade -- audio gradually reduces volume at story end
- Audio cached per story in Supabase Storage

#### 1.4 Drawing-to-Story
- Upload a drawing (photo or file)
- AI analyzes the drawing and generates a story around it
- Chain multiple drawings for multi-chapter adventures
- Carried over from StoryWeaver, rebuilt with server-side AI pipeline

#### 1.5 Child Profiles
- Parent account manages up to 5 child profiles (premium) or 1 (free)
- Each profile: name, age, favorite themes
- Profile selector on app launch ("Who's reading tonight?")
- Separate story libraries per child
- Age-adaptive content filtering

#### 1.6 Personalization
- Child's name woven into every story automatically
- Favorite companion character (bunny, dragon, bear, cat, unicorn) appears across stories
- Theme preferences learned from usage (surface more of what they engage with)

#### 1.7 Story Library (Bookshelf)
- Visual bookshelf UI showing saved stories with cover illustrations
- Pre-generated popular stories for instant access (no generation wait)
- Search/filter by theme, date, child profile
- Delete stories

#### 1.8 Bedtime Mode
- Wind-down sequence: ambient music (2 min) → breathing exercise (1 min) → story → sleep sounds
- Auto-dims screen to warm amber palette
- Timer: stop after N stories or N minutes
- "Last story" indicator to set expectations
- Screen-free audio option (screen goes dark, audio plays)

#### 1.9 Auth & Billing
- Supabase Auth (email magic link + Google OAuth)
- Stripe subscriptions: Free, Family ($7.99/mo), Annual ($59.99/yr)
- 7-day free trial with full access
- Parental consent flow with COPPA compliance
- Webhook sync between Stripe and Supabase

#### 1.10 Landing Page
- Beautiful marketing page explaining the product
- Demo story playback (no sign-up required)
- Pricing section
- Trust signals: "No ads. No data sold. COPPA compliant."
- SEO optimized, OG images, structured data

---

### Phase 2 -- Engagement & Retention

Features that make users stick around and tell others about it.

#### 2.1 Gamification
- **Story Stamps** -- reading passport, stamp after each story
- **Collectible Companions** -- unlock new characters every 5 stories
- **Growing Garden** -- plant seeds that bloom as stories are read
- **Nightly Streaks** -- moon icon stays lit (1 grace day for missed nights)
- **Celebration Animations** -- 3-second firefly/star burst after each story

#### 2.2 Sleep Sounds Library
- Rain, ocean, forest night, gentle wind, white noise, lullabies
- Plays on loop after story ends
- Mixable (rain + soft music)
- Timer controls

#### 2.3 Bedtime Routine Builder
- Parents set a custom sequence and schedule
- App auto-triggers at bedtime (push notification)
- Configurable: which sounds, which breathing exercise, how many stories

#### 2.4 Parent/Grandparent Voice Recording
- Record yourself reading a story
- Kids hear it in your voice when you're not there
- Grandparent recording link (simple share URL, no account needed)
- Huge emotional hook for marketing and word-of-mouth

#### 2.5 Vocabulary Highlights
- New words gently introduced in context
- Tap any word to hear pronunciation + see simple visual definition
- Weekly parent digest email: "Amir encountered 12 new words this week"

#### 2.6 Moral/Theme Targeting
- Parent selects: "tonight we want a story about sharing / courage / kindness / patience"
- AI generates story with that moral woven in naturally (not preachy)
- Tag system on all stories

---

### Phase 3 -- Growth & Differentiation

Features that set PixieTales apart and expand the market.

#### 3.1 Multicultural Folk Tales
- Curated collection from Malaysia, Southeast Asia, Middle East, Africa, Latin America, Scandinavia, Japan
- Authentic cultural details, not stereotypes
- Both AI-generated and human-curated options
- Language options (Malay, Arabic, Mandarin, Hindi, Spanish, French)

#### 3.2 Interactive Story Choices
- Branching narratives: "What should Amir do? Go into the cave or follow the river?"
- Child taps a choice, story adapts
- 2-3 decision points per story
- Replay value -- different choices, different endings

#### 3.3 Story Export & Printing
- Download story as PDF picture book
- Share link (read-only, no account needed)
- Physical book printing partnership (future)

#### 3.4 Shared Reading Mode
- "Read Together" mode for parent + child on tablet
- Larger text, slower pacing
- Interactive prompts for parent: "Ask your child: what do you think happens next?"
- Transforms screen time into co-viewing (research-backed educational benefits)

#### 3.5 Voice Cloning
- Parent records 30 seconds of voice
- AI clones voice for all future narrations
- Child hears stories in parent's voice even when parent isn't there
- Premium feature

---

### Phase 4 -- Mobile App

#### 4.1 Android App (Expo/React Native)
- Same features as web, native experience
- Offline mode: download stories + audio for airplane/car
- Push notifications for bedtime reminders
- Google Play Families program compliance

#### 4.2 iOS App (Expo/React Native)
- Same as Android
- Apple "Designed for Families" category
- App Store compliance for children's apps

#### 4.3 Cross-Device Sync
- Stories, profiles, preferences sync across all devices
- Start on web, continue on phone
- Supabase Realtime for instant sync

---

## Competitive Positioning

### What We Do Better

| vs Competitor | Our Advantage |
|---|---|
| Oscar Stories | Drawing-to-story + bedtime routines + audio narration |
| Moshi Kids | AI-generated personalized stories (not pre-recorded library) |
| Bedtimestory.ai | Full bedtime experience (not just story generation) |
| StoryBee | Better UX, bedtime mode, gamification |
| Sleepytale | Drawing-to-story, interactive choices, lower price |
| Readmio | AI generation + illustrations (Readmio is text-only) |
| Calm Kids | Purpose-built for kids (not adults-first with kids section) |

### Our Unique Combination
No competitor combines ALL of these:
1. AI story generation (custom + themed)
2. Drawing-to-story
3. AI illustrations per chapter
4. Audio narration with multiple voices
5. Full bedtime routine (music → breathing → story → sleep sounds)
6. Screen-free audio mode as first-class feature
7. Grandparent voice recording
8. Multicultural folk tales
9. COPPA compliant, no ads

---

## Estimated Per-Story AI Cost

| Component | Provider | Est. Cost |
|---|---|---|
| Story text | Claude 3 Haiku via OpenRouter | ~$0.002 |
| 5 illustrations | Gemini 3.1 Flash Image (1024px) | ~$0.335 (5 x $0.067) |
| 5 illustrations (alt) | gpt-image-1 medium | ~$0.20 (5 x $0.04) |
| 5 illustrations (budget) | Imagen 4 Fast | ~$0.10 (5 x $0.02) |
| Audio narration | ElevenLabs (~3k chars) | ~$0.90 |
| **Total per unique story** | Gemini path | **~$1.24** |
| **Total per unique story** | gpt-image-1 path | **~$1.10** |
| **Total per unique story** | Imagen 4 Fast path | **~$1.00** |

**Free tier advantage:** Gemini offers 500 free images/day via Google AI Studio -- covers dev and early users at zero cost.

**Strategy:** Use Gemini free tier during development and soft launch. Model is configurable server-side -- can swap between Gemini, gpt-image-1, or Imagen 4 based on quality/cost tradeoffs without touching the client. Test storybook illustration quality across all three before committing.

With caching (same story served to multiple users) and a pre-generated library of popular themes, real marginal cost per user drops significantly. At $7.99/mo family plan with ~20 stories/month usage, unit economics work.

---

## Research Highlights (Top Opportunities)

From the research agent's analysis of 12 competitors:

| Opportunity | Status | Notes |
|---|---|---|
| Audio-only "Whisper Mode" | Foundation built | No competitor offers screen-dark narration. Bedtime mode already has the foundation. Highest differentiator. |
| Parent voice cloning at base tier | Placeholder ready | ElevenLabs costs ~$0.003/1k chars. Technically feasible at $7.99/mo Family tier. |
| Story Memory/Universe | Foundation built | Persistent child profile that remembers characters across sessions. Zustand + Supabase store already tracks this. |
| Bilingual stories (SEA) | Not started | Zero competition in Malay, Tamil, Bahasa Indonesia. Massive untapped market. |
| Evidence-based sleep design | Partially built | 4-4-6 breathing exercise built. Structured wind-down sequence ready. Add sleep tracking + reminders. |

**Priority order for next build sprint:**
1. Whisper Mode (screen-dark audio-only) -- highest impact, lowest effort
2. Bilingual stories -- biggest market gap, differentiates from all 12 competitors
3. Voice cloning -- strongest emotional hook for retention and word-of-mouth
4. Story Memory -- deepens engagement, makes stories feel personal over time
5. Sleep design -- completes the bedtime experience, pairs with breathing exercise

---

## Technical Debt & Security Backlog

From QA code review (2026-03-21). Lower priority items to address in future sprints.

| # | Severity | Area | Issue | Notes |
|---|----------|------|-------|-------|
| 1 | Critical | AI Safety | `customPrompt` goes to LLM without content moderation | Mitigated by `role: "user"` placement + strong system prompt. Full fix: add content filter (OpenAI moderation API or similar) before forwarding. |
| 2 | Major | Security | In-memory rate limiter resets on serverless cold starts | Replace with Redis/Upstash (`@upstash/ratelimit`). Current Map-based limiter is per-instance. |
| 3 | Major | Reliability | Fire-and-forget Supabase sync can silently lose data | Stories exist in localStorage but may not reach DB. Add retry queue or confirmation. |
| 4 | Major | Data | `drawingBase64` not validated as actual image before AI | Check magic bytes (PNG/JPEG/GIF/WebP) before forwarding to Gemini. |
| 5 | Minor | Auth | `require-auth.tsx` returns `null` during loading (blank flash) | Replace with loading spinner for better UX. |
| 6 | Minor | Auth | `supabase.ts` singleton has no server-import guard | Add `"use client"` directive or runtime check. `supabase-admin.ts` already has `"server-only"`. |
| 7 | Minor | Security | No explicit CSRF/Origin check on API routes | Mitigated by Bearer token auth. Add Origin header check for defense-in-depth. |

---

## Key Risks

| Risk | Mitigation |
|---|---|
| AI generates inappropriate content | Server-side content filtering, locked system prompts, age-gated output review |
| High AI costs at scale | Aggressive caching, shared story library, rate limiting per family |
| COPPA violation | Architecture designed for compliance from day 1, legal review before launch |
| Low retention | Gamification, bedtime routines create daily habit, grandparent features drive emotional investment |
| Competitors copy features | Speed to market, SEA/multilingual focus as defensible niche |

---

## Success Metrics

| Metric | Target (6 months post-launch) |
|---|---|
| Registered families | 5,000 |
| Paid subscribers | 500 (10% conversion) |
| MRR | $3,995 |
| Stories generated/day | 1,000+ |
| Retention (30-day) | 40%+ |
| App Store rating | 4.5+ |

---

*Last updated: 2026-03-21*
