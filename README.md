# Newsflow Studio

AI YouTube automation studio for regional-language (Tamil first) news creators. Paste
competitor URLs, your own script, or just a topic — get back a finished 9:16 MP4 with
AI-written Tamil script, AI-generated visuals, Tamil voiceover, and burned-in subtitles.

## Monorepo layout

```
apps/
  web/        Expo Router PWA (React Native Web). Auth, dashboard, wizard, project detail.
  api/        Node 20 + Express. Runs the generation pipeline.
packages/
  shared/     Shared types and zod schemas (used by both apps).
supabase/
  migrations/ SQL migrations. Run 0001_init.sql in the Supabase SQL editor.
```

## Prerequisites

- Node 20+
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9 --activate`)
- FFmpeg + Noto Sans Tamil locally for API dev (macOS: `brew install ffmpeg && brew install --cask font-noto-sans-tamil` — or any system-level Noto Sans Tamil)
- A Supabase project, an OpenRouter key, and an ElevenLabs key

## First-time setup

1. Copy `.env.example` to `.env.local` at the repo root and fill in values. Both `apps/web` (Expo) and `apps/api` (Node) read from this file.
2. Run the schema migration in `supabase/migrations/0001_init.sql` (Supabase SQL editor or `psql $DATABASE_URL -f supabase/migrations/0001_init.sql`).
3. Pick a Tamil voice from ElevenLabs and set `ELEVENLABS_VOICE_ID_TAMIL` — you can run `pnpm --filter @newsflow/api list-voices` once the key is set to see top candidates.
4. Install dependencies: `pnpm install`.
5. Run both apps: `pnpm dev` (web on :3000, api on :4000).

## Input modes

The wizard supports four ways to start a project:

- **YouTube URLs** — paste 1–5 competitor videos. We fetch transcripts only; the LLM
  rewrites everything. Source footage, audio, and images are never reused.
- **Research from web** — Perplexity Sonar Pro runs live web research on the topic you
  give it, returns a cited factual English briefing, then Gemini turns that briefing
  into an original Tamil script. Citations are attached to the project for review.
- **Paste your script** — your article, blog post, or draft. We format it into scenes
  and produce visuals + voiceover without rewriting.
- **Just a topic** — one-line headline. AI writes an original script from Gemini's
  training-data general knowledge (no live web lookup).

## Pipeline

1. **ingest** — mode-aware source gather (YouTube transcripts, Perplexity Sonar Pro
   web research, user-pasted script, or just topic).
2. **script** — Gemini 3 Flash produces a structured JSON script with hook / scenes / cta.
3. **images** — Nano Banana 2 generates a 9:16 2K image per scene (concurrency 3).
4. **voice** — ElevenLabs `eleven_multilingual_v2` generates the full narration with
   character-level alignment.
5. **align** — alignment is chunked into an SRT file.
6. **compose** — FFmpeg makes per-scene Ken Burns clips, concatenates, overlays the voiceover,
   and burns Tamil subtitles with Noto Sans Tamil.

Every step writes to `pipeline_jobs` so the web app can subscribe via Supabase realtime.

## Deployment

- **API** → Railway, using `apps/api/Dockerfile` (FFmpeg + fonts-noto-extra preinstalled).
- **Web** → `pnpm --filter @newsflow/web build` then deploy the exported static site
  (Railway / Vercel / Cloudflare Pages).

## Known limitations (v1)

- No retries on API failures; transient errors mark the project failed, user regenerates.
- Sequential in-process pipeline — single concurrent generation per API instance.
- Videos capped at 60s to stay under long-running request timeouts.
- Tamil lives in the subtitle layer, not in AI-generated images (text rendering in
  Indic scripts is unreliable across image models).
- No YouTube OAuth / publish, no cron, no teams. See `PRD.md` for the roadmap.

## Copyright safety

We never download, embed, or reuse source video, audio, thumbnails, or frames. Transcripts
are the only input we pull, and the script prompt is written aggressively around full
paraphrase + original narration. The user is still responsible for fact-checking before
publishing.
