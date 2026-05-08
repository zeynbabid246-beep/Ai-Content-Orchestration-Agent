# Refactored Backend Boundaries

## Editorial Content

`ContentPost` and `PostVariant` represent editorial content and platform-specific adaptations only. They do not own external publication identifiers, retry counters, provider errors, or job execution state.

## Publishing Delivery

`PostPublication` represents a delivery intent for one content post/variant to one social account. `PublishJob` represents the background execution mechanism for that publication.

Publication creation is idempotent and should create `PostPublication` plus `PublishJob` in one transaction.

## Social Integrations

OAuth callback processing is split into:

- application-owned state generation and tenant/user authorization
- provider-owned token/account exchange
- credential storage through `ISocialCredentialStore`

Provider adapters must not invent or return tenant authority.

Current social integration scope:
- active OAuth + publish support: `Facebook`, `LinkedIn`
- `Instagram` is intentionally excluded from connect/publish paths until implementation is complete

## Analytics

Analytics belong to `PostPublication` and are modeled as deduplicated snapshots with source, window, and metric version metadata.

# AiContentFlow App Structure and Logic

## Overview
`AiContentFlow` is a modular monolith using Clean Architecture (`Domain`, `Application`, `Infrastructure`, `API`) with strict team-first multi-tenancy.

Core principles:
- every user belongs to at least one team,
- tenant isolation enforced by `TeamId`,
- thin controllers with orchestration in application services,
- EF Core + Identity isolated in infrastructure,
- role-based authorization inside application services.

---

## Layer Responsibilities

### `AiContentFlow.Domain`
Defines core models and enums:
- `Team`, `UserTeam`, `Channel`, `ChannelBranding`, `ChannelConfig`
- `SocialAccount`, `ContentPost`, `PostVariant`, `Campaign`
- `PostPublication`, `PublishJob`, `PublicationAnalytics`
- `TeamRole`: `Viewer`, `Admin`, `Editor`
- content and campaign lifecycle enums

### `AiContentFlow.Application`
Defines and enforces use-cases:
- auth onboarding flow,
- team membership and role checks,
- channel/social/content/campaign business rules,
- DTO contracts and repository abstractions,
- transaction abstraction (`IApplicationTransaction`) for atomic onboarding.

### `AiContentFlow.Infrastructure`
Implements persistence and identity:
- `AppDbContext` entity configuration,
- repository implementations,
- identity registration/login,
- JWT + refresh token persistence,
- EF migrations.
- Hangfire background jobs for scheduled publishing.

### `AiContentFlow.API`
HTTP boundary:
- controller routing and model binding,
- JWT auth pipeline,
- exception middleware mapping to `400/401/403/404/500`.
- social auth callback redirects to frontend using `SocialAuth:FrontendRedirectUrl`.

---

## Team-First Onboarding Flow

1. User calls `POST /api/Auth/register`.
2. `AuthService` executes registration in a transaction scope.
3. System creates:
   - identity user,
   - team,
   - `UserTeam` admin membership,
   - refresh token record.
4. Response includes:
   - `teamId`,
   - `teamRole`,
   - `isTeamNameSetupRequired`.

Supported onboarding paths:
- direct onboarding: request includes `teamName`
- deferred naming: request omits `teamName`, backend creates temporary team name and sets `isTeamNameSetupRequired=true`

Team name completion endpoint:
- `PUT /api/Team/{teamId}/name`

---

## Entity Relationships and Scoping

### Team and Membership
- `Team` is tenant root.
- `UserTeam` stores `UserId`, `TeamId`, and role.
- all scoped reads/writes verify membership against route `teamId`.

### Channel and Social Account
- `Channel` is team-scoped.
- `Channel.NormalizedName` enforces case-insensitive uniqueness within team.
- `SocialAccount` is team-scoped and linked to channel.
- OAuth tokens and secrets are managed through protected credential storage abstractions.
- social account mutations are allowed for `Admin` and `Editor`.

### Campaign
- `Campaign` is team-scoped and soft-deletable.
- campaign references one `ChannelId`.
- `ContentPost` can optionally reference one `CampaignId`.

### Content Post
- `ContentPost` is team-scoped.
- `ChannelId` is required.
- `CampaignId` is optional.
- publication destination is handled by `PostPublication`, not stored on the post.

### Publication and Jobs
- `PostPublication` is the delivery intent and lifecycle aggregate for publishing.
- `PublishJob` is the execution/retry unit for background publishing.
- `PublicationAnalytics` is publication-scoped metrics storage with dedupe metadata.

---

## Authorization Logic

Role policies:
- `Admin`: channels, social accounts, content post mutations, campaign mutations, team management
- `Editor`: content post mutations (`create/update/delete/transition/schedule/publish`) and campaign mutations (`create/update/delete/link/unlink`)
- `Viewer`: read-only

Cross-entity tenant guards:
- channel/social lookup is always `teamId` scoped
- campaign-content links are allowed only when both resources exist in same team scope

---

## Content Lifecycle Logic

Allowed transitions:
- `Draft -> Review`
- `Review -> Approved`
- `Approved -> Scheduled`
- `Scheduled -> Published`
- `Published -> Archived`

Scheduling rules:
- UTC required
- future timestamp required

Social scheduling notes:
- scheduling creates `PostPublication` + `PublishJob` atomically.
- social account must be active and team-scoped.

Meta token usage:
- Facebook posts use page access tokens stored in `SocialAccount.OAuthToken`.
- Page IDs are stored in `SocialAccount.ExternalAccountId`.
- Graph API version is configurable through `Meta:GraphApiVersion` (default `v22.0`).

Hangfire scheduling:
- `PublishScheduledVariantsJob` runs every minute via Hangfire.
- `SyncPublicationAnalyticsJob` runs hourly via Hangfire.
- Dashboard is available at `/hangfire` in development.

Publish rules:
- publication endpoint accepts `socialAccountId` and optional `postVariantId`.
- only `Approved` and `Scheduled` posts are publishable.
- idempotency is enforced via publication intent matching and optional `idempotencyKey`.
- social account token expiry is enforced before publish; expired tokens require reconnect.

---

## Campaign Logic

Campaign mutation rules:
- membership required
- mutation role required: `Admin/Editor`
- optional `ChannelId` must resolve within same team
- duplicate content link blocked with domain violation (`400`)

---

## Persistence Notes

Recent model updates:
- `Teams.IsNameSetupRequired`
- `Channels.NormalizedName` + unique index (`TeamId`, `NormalizedName`)
- `ContentPosts.ChannelId` required and `ContentPosts.CampaignId` optional
- publishing lifecycle tables: `PostPublications`, `PublishJobs`, `PublicationAnalytics`

Migration:
- `20260506104946_AddPublishingLifecycleAndAnalytics`

---

## Error Mapping

`ExceptionMiddleware` maps:
- `InvalidOperationException` / validation errors -> `400`
- `UnauthorizedAccessException` -> `403` (or `401` on auth routes)
- `KeyNotFoundException` -> `404`
- unknown exceptions -> `500`
