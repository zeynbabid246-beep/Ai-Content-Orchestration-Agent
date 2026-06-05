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

In `AiContentFlow.API/appsettings.Development.json` (or environment variables):

```json
{
  "LocalAI": {
    "BaseUrl": "http://127.0.0.1:8000"
  },
  "AI": {
    "ProviderMode": "LocalBackend"
  }
}
```

| Setting | Values | Description |
|---------|--------|-------------|
| `LocalAI:BaseUrl` | URL | FastAPI base URL (no trailing slash required) |
| `AI:ProviderMode` | `LocalBackend` (default) | Uses AI-BACKEND for campaigns and orchestrator |
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
| `POST /api/teams/{teamId}/ai/campaigns/suggest` | Strategy → planning → content (preview) |
| `POST /api/teams/{teamId}/ai/campaigns/materialize` | Create campaign + bulk posts (+ optional schedule) |
| `POST /api/teams/{teamId}/ai/generate-post` | Single post via orchestrator |

## Typical campaign flow

1. Brand Studio import or manual save
2. Channel → **Create with AI** → suggest → review → materialize
3. Or: existing campaign → **Campaign planner** → suggest → bulk create (with schedule accounts)

Publishing/scheduling uses the .NET **PublicationService** (Hangfire), not the AI scheduler database.
