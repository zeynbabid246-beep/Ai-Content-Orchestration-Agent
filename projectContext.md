# AiContentFlow — Full Project Context

## 1. What this project is
AiContentFlow is a multi-tenant SaaS platform for marketing and content operations. It helps teams:

- Create and manage content (posts, variants, editorial workflow)
- Organize work in channels and campaigns
- Publish to social networks (Facebook, LinkedIn) with scheduling, retries, and analytics
- Build brand context via Brand Studio (website import, structured brand profile)
- Use AI to generate posts and suggest campaigns, grounded in brand/channel context

The repo is a monorepo with:

- **backend/** — ASP.NET Core .NET 10 API (Clean Architecture modular monolith)
- **frontend/** — React 19 + Vite + TypeScript SPA (app-v2 is the active UI)

Likely context: PFE (final-year project) — production-oriented architecture, not a toy demo.

---

## 2. Core architectural idea (must not violate)
The platform splits two domains that must stay separate:

| Domain              | Responsibility                                      | Key entities |
|---------------------|------------------------------------------------------|--------------|
| Editorial / Content | What content exists, collaboration, campaigns, adaptations | ContentPost, PostVariant, Campaign, Channel |
| Publishing / Delivery | When/where/how content is delivered, retries, external APIs, analytics | PostPublication, PublishJob, PublicationAnalytics |

**Critical rules:**
- Channels are NOT social platforms. They are publishing workspaces (e.g. “Product & Growth”, “Recruitment”) that group social accounts, branding, campaigns, and strategy.
- PostVariants are content-only — no publishing state, retries, or analytics on variants.
- PostPublication is the execution unit: one delivery of one variant (optional) to one social account.
- PublishJob is infrastructure/async execution (Hangfire).
- Brand Studio is team-level organizational intelligence, not a channel or publishing component.
- Tenant isolation: everything is scoped by TeamId; never bypass team checks.

---

## 3. Tech stack
**Backend**
- .NET 10 (net10.0)
- Clean Architecture: Domain → Application → Infrastructure → API
- EF Core + PostgreSQL (Npgsql)
- ASP.NET Identity (users; no domain User entity)
- JWT access tokens + hashed refresh tokens with rotation
- Hangfire (PostgreSQL storage) for scheduled publish + analytics sync
- Swagger in development
- Rate limiting on auth and sensitive endpoints
- Publishers: FacebookPublisher, LinkedInPublisher (Instagram excluded from connect/publish paths until complete)
- AI: ITextGenerationService, ILocalAiBackendClient (optional local Python service at http://127.0.0.1:8000), GeminiImageService, multiple model providers (Groq, Gemini, etc.)

**Frontend**
- React 19, Vite 8, TypeScript
- React Router v7 — routes under /app/*
- TanStack React Query for server state
- Axios HTTP client (VITE_API_BASE_URL, default http://localhost:5073/api)
- MUI + Emotion, Tailwind, Framer Motion, Lucide / React Icons
- Vitest + Testing Library for tests

**Local defaults**
- API: http://localhost:5073
- Frontend dev: http://localhost:5173
- CORS allows frontend origins from config

---

## 4. Repository layout
aicontentflow/
├── backend/
│   ├── AiContentFlow.Domain/          # Entities, enums
│   ├── AiContentFlow.Application/     # Services, DTOs, interfaces, validators
│   ├── AiContentFlow.Infrastructure/  # EF, repos, Identity, publishers, AI, Hangfire jobs
│   ├── AiContentFlow.API/             # Controllers, middleware, Program.cs
│   └── AiContentFlow.Application.Tests/
├── frontend/
│   └── src/app-v2/                    # Main application UI
├── projectArchitecture.md             # Global architecture & rules
├── backend/AiContentFlow_App_Structure_and_Logic.md
├── backend/AiContentFlow_API_Endpoints.md   # Frontend API contract
└── backend/SOCIAL_PROVIDER_SETUP.md



---

## 5. Multi-tenancy and roles
Tenant root: **Team**

Every user belongs to at least one team via **UserTeam**.

Registration (`POST /api/Auth/register`) atomically creates: Identity user, Team, UserTeam (Admin), refresh token.

Onboarding can defer team naming (`isTeamNameSetupRequired`); completed via `PUT /api/Team/{teamId}/name`.

**Roles (TeamRole):**

| Role   | Capabilities |
|--------|--------------|
| Admin  | Channels, social accounts, team management, content/campaign mutations |
| Editor | Content posts (CRUD, workflow, schedule, publish), campaigns |
| Viewer | Read-only |

All team-scoped routes use `teamId` in the URL; services verify membership and role.

---

## 6. Domain model (entity graph)
Team
 ├── UserTeam (membership + role)
 ├── TeamBrandStudio (+ BrandImportJob[])
 ├── Channel[] (+ ChannelBranding, ChannelConfig)
 │    ├── SocialAccount[]
 │    ├── Campaign[]
 │    └── ContentPost[]
 │         ├── PostVariant[]        # platform-specific content JSON
 │         └── PostPublication[]    # delivery intents
 │              ├── PublishJob[]
 │              └── PublicationAnalytics[]
 └── (team-level resources)

**Key entities (behavioral summary):**
- Channel: team-scoped publishing workspace; NormalizedName unique per team; soft-delete support; has branding/config.
- SocialAccount: linked external account (Facebook page, LinkedIn, etc.); OAuth tokens stored via ISocialCredentialStore; belongs to a channel.
- Campaign: team-scoped initiative inside one channel; soft-deletable; links to ContentPost via link endpoints.
- ContentPost: editorial aggregate; requires ChannelId; optional CampaignId; workflow status; ContentJson + metadata (Prompt, AiModel, etc.); has variants and publications.
- PostVariant: per-platform adaptation (contentJson, platform); no publishing lifecycle.
- PostPublication: scheduling, retries, external IDs, status (Scheduled → Queued → Publishing → Published / Failed / Retrying / Cancelled).
- PublishJob: Hangfire-driven execution record with retry/dead-letter semantics.
- PublicationAnalytics: metrics snapshots tied to publications.
- TeamBrandStudio: rich brand profile (tone, audience, visual assets, enriched AI fields, products/services); fed by website import jobs.

**Enums (API uses string serialization only, never numeric):**
- ContentType: BlogPost, TwitterThread, LinkedInPost, InstagramPost, FacebookPost
- ContentStatus: Draft → Review → Approved → Scheduled → Published → Archived
- SocialPlatform: Facebook, LinkedIn, Instagram, X, Threads, TikTok
- CampaignStatus: Draft, Active, Paused, Completed, Archived
- PublicationStatus, PublishJobStatus, AiModel, etc.

**Content workflow transitions:**
Draft → Review → Approved → Scheduled → Published → Archived

Schedule/publish requires Approved or Scheduled, active social account, supported platform, non-expired token.

Scheduling creates PostPublication + PublishJob in one transaction; idempotency via `idempotencyKey`.

---

## 7. Brand Studio
Purpose: Ingest organizational intelligence once and reuse it for AI generation (avoid repeated manual prompting).

Scope: Team-level only (not campaign/channel publishing).

Flow:
1. Admin submits website URL → `POST /api/teams/{teamId}/brand-studio/import`
2. Async BrandImportJob (scraping, extraction, enrichment via BrandExtractionService, SafeWebsiteFetcher, optional LocalAiBackendClient.AnalyzeBrandAsync)
3. Structured data stored on TeamBrandStudio
4. Frontend polls job status; profile editable via PATCH

**Relationship to channels:**
- Brand Studio = global company intelligence
- ChannelBranding = operational publishing identity per channel

---

## 8. AI features
Endpoints (`/api/teams/{teamId}/ai`, rate-limited):

- `POST .../generate-post` — generates social post JSON from prompt + optional brand/channel context
- `POST .../campaigns/suggest` — campaign suggestions

Implementation notes (**AiContentService**):
- Team daily budget (default ~150 requests/day)
- Can use external text providers (ITextGenerationService) or local AI backend
- Brand context built from TeamBrandStudio + optional channel when `UseBrandContext` is true
- Output normalized to JSON (text, optional slides for carousels)
- Image generation via IImageGenerationService / Gemini
- Supported AI models (enum): Gpt4o, Gpt4oMini, Deepseek*, Gemini*, Groq, Pollinations, etc.

---

## 9. Social OAuth and publishing
**Active OAuth + publish**
- Facebook (Meta Graph API, page tokens in SocialAccount.OAuthToken)
- LinkedIn
- Instagram — excluded from connect/publish until full implementation

**OAuth flow**
1. `GET /api/auth/{platform}/login?teamId=&channelId=` → authorizationUrl
2. Browser redirect to provider
3. `GET /api/auth/{platform}/callback` → backend validates signed state, stores accounts → redirects to SocialAuth:FrontendRedirectUrl with `socialAuthStatus=success|error`
4. Frontend shows toast, refetches social accounts, clears URL params

**Background jobs (Hangfire):**
- PublishScheduledVariantsJob — every minute
- SyncPublicationAnalyticsJob — hourly

Dev dashboard: `/hangfire`

