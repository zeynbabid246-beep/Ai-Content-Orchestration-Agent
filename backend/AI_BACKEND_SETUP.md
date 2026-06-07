# AI Backend Setup (Local AI Service)

AiContentFlow can use the Python **AI-BACKEND** service for brand analysis, campaign strategy/planning/content, and orchestrated post generation.

## Run the AI service

From the repository root:

```bash
cd AI/AI-BACKEND
# Follow AI-BACKEND README for venv, env vars, PostgreSQL, Qdrant
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify: `GET http://127.0.0.1:8000/health` → `{ "status": "healthy" }`

API reference: [AI/AI-BACKEND/README_API.md](../AI/AI-BACKEND/README_API.md)

## Configure the .NET API

Non-secret settings live in `AiContentFlow.API/appsettings.json` (copy from `appsettings.example.json`):

```json
{
  "LocalAI": {
    "BaseUrl": "http://127.0.0.1:8000",
    "CampaignContentTimeoutSeconds": 900
  },
  "AI": {
    "ProviderMode": "LocalBackend"
  }
}
```

For `ExternalProviders` mode, set API keys in `backend/.env` (see `.env.example`).

Per-path timeouts apply in the .NET proxy (`HttpClient.Timeout` is unlimited so content generation is not capped at 75s). Restart the API after changing these values.

| Setting | Values | Description |
|---------|--------|-------------|
| `LocalAI:BaseUrl` | URL | FastAPI base URL (no trailing slash required) |
| `LocalAI:DefaultTimeoutSeconds` | `75` (default) | Timeout for strategy/planning and other fast paths |
| `LocalAI:BrandAnalyzeTimeoutSeconds` | `95` (default) | Timeout for brand website analysis |
| `LocalAI:CampaignContentTimeoutSeconds` | `900` (15 min, default) | Timeout for campaign content generation (many posts + image creatives; increase to `1200`+ if needed) |
| `LocalAI:CreativeTimeoutSeconds` | `180` (3 min, default) | Timeout for single-post poster/carousel generation from the post editor |
| `AI:ProviderMode` | `LocalBackend` (default) | Uses AI-BACKEND for the 3-step campaign pipeline (strategy → planning → content) |
| `AI:ProviderMode` | `ExternalProviders` | Groq one-shot fallback (no 3-step campaign pipeline) |

For `ExternalProviders`, configure Groq/OpenAI keys as documented in Infrastructure AI settings.

## Brand prerequisite

AI campaigns call `POST /api/brand/manual` (synced from Team Brand Studio) before strategy generation.

1. Open **Brand Studio** in the app and import a website or save a profile.
2. Optional: `POST /api/teams/{teamId}/ai/sync-brand` pushes the latest profile to the AI service.

## App endpoints (proxy)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/teams/{teamId}/ai/health` | AI service reachability |
| `POST /api/teams/{teamId}/ai/sync-brand` | Push Brand Studio → AI |
| `POST /api/teams/{teamId}/ai/campaigns/strategy` | Step 1: Generate marketing strategy |
| `POST /api/teams/{teamId}/ai/campaigns/planning` | Step 2: Generate editorial calendar (accepts `selectedContentDirection`) |
| `POST /api/teams/{teamId}/ai/campaigns/content` | Step 3: Generate full posts + creatives |
| `POST /api/teams/{teamId}/ai/campaigns/suggest` | All-in-one: strategy → planning → content (preview) |
| `POST /api/teams/{teamId}/ai/campaigns/materialize` | Create campaign + bulk posts (+ optional schedule) |
| `POST /api/teams/{teamId}/ai/generate-post` | Single post via orchestrator |
| `POST /api/teams/{teamId}/ai/assistant/chat` | AI marketing copilot (platform help, agent explanations, general Q&A) |
| `POST /api/teams/{teamId}/ai/creative/generate` | Generate poster or carousel for an existing content post (Post Editor) |

## Post creative generation (Post Editor)

Generates a poster or carousel for a saved content post. The .NET API loads the post from its database, calls the existing Python creative APIs (`/api/creative/generate-poster` or `/api/creative/generate-carousel`), imports the resulting images into `wwwroot/uploads/{teamId}/`, and merges `poster_url` / `carousel_assets` into the post's `contentJson`.

```
POST /api/teams/{teamId}/ai/creative/generate
Authorization: Bearer {token}
```

Request body:

```json
{
  "contentPostId": 42,
  "platform": "LinkedIn",
  "language": "English",
  "visualDirection": "Clean B2B infographic",
  "persistToPost": true
}
```

Requires `AI:ProviderMode: LocalBackend`, Brand Studio profile, and a saved post with text content. Save the draft in the Post Editor before generating (the server reads persisted `contentJson`).

### Manual E2E checklist

1. Start Python AI on port 8000 and .NET API with `LocalBackend`.
2. Open an existing post in the Post Editor with title/body saved.
3. Click **Generate visual** and wait (up to ~3 minutes).
4. Confirm poster/carousel preview appears and URLs point to the .NET host (`/uploads/...`), not `:8000`.
5. Reload the page — assets remain in `contentJson`.

## AI Assistant (copilot widget)

The React app mounts a floating assistant widget on every authenticated page. It calls:

```
POST /api/teams/{teamId}/ai/assistant/chat
Authorization: Bearer {token}
```

Request body:

```json
{
  "message": "Comment utiliser la plateforme ?",
  "language": "fr",
  "context": {
    "page": "scheduler",
    "campaign_id": 21,
    "conversation_memory": [
      { "role": "user", "content": "..." }
    ]
  }
}
```

`brand_id` is resolved server-side from Brand Studio (`org_id`). Requires `AI:ProviderMode: LocalBackend` and the Python AI service running.

Response includes `answer`, `intent`, `suggestedActions`, `screenshots`, and `metadata`.

### Manual E2E checklist

1. Start Python AI (`uvicorn` on :8000) and .NET API with `LocalBackend` mode.
2. Log in and open any page — purple FAB appears bottom-right.
3. Click **Comment utiliser la plateforme ?** — French answer with optional screenshot cards.
4. Switch language to EN / AR — welcome text and RTL layout for Arabic.
5. Navigate to Brand Studio or Scheduler — inspect network payload; `context.page` should change.
6. Stop Python AI — widget shows offline fallback message and static help.
7. Set `AI:ProviderMode: ExternalProviders` — endpoint returns 503; widget shows unavailable message.

**Note:** Scheduler/creative actions inside the Python assistant (reload calendar, regenerate poster) use the AI backend database, not .NET campaign data. Onboarding, agent explanations, and general Q&A work fully in the React app.

## Typical campaign flow

1. Brand Studio import or manual save
2. Channel → Campaigns → **Create campaign** (manual name/description)
3. Welcome dialog → **Plan with AI** → navigates to AI wizard page
4. AI wizard: Configure → Strategy (pick content direction) → Planning → Content → Confirm
5. Posts are bulk-created as drafts in the campaign

Or from the campaign overview page, click **Plan with AI** when no posts exist yet.

Publishing/scheduling uses the .NET **PublicationService** (Hangfire), not the AI scheduler database.
