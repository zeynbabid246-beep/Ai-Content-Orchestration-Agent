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
- `Team`, `UserTeam`, `Channel`, `SocialAccount`, `ContentPost`, `PostVariant`, `Campaign`, `CampaignContentPost`
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

### Campaign
- `Campaign` is team-scoped and soft-deletable.
- campaign optionally references `ChannelId` for channel-context planning.
- `CampaignContentPost` is many-to-many join to `ContentPost`.

### Content Post
- `ContentPost` is team-scoped.
- `ChannelId` and `SocialAccountId` are optional.
- standalone posts are valid and support full lifecycle.
- when optional links are provided, service validates same-team ownership and channel-social consistency.

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
- `Draft -> Ready`
- `Ready -> Scheduled`
- `Scheduled -> Published`

Scheduling rules:
- UTC required
- future timestamp required

Social scheduling notes:
- if a social account is linked, scheduling creates a `PostVariant` used by `PublishScheduledVariantsJob`
- social accounts must be active for scheduled publishing to succeed

Hangfire scheduling:
- `PublishScheduledVariantsJob` runs every minute via Hangfire.
- Dashboard is available at `/hangfire` in development.

Publish rules:
- transition must be valid
- sets `PublishedAt` consistently

Note on publishing pipelines:
- `ContentPostService.PublishAsync` delegates to `PublishPostUseCase` for social publishing.
- Scheduled publishing creates `PostVariant` records and is finalized by `PublishWorker`.

Standalone post behavior:
- create/schedule/publish works with `channelId=null` and `socialAccountId=null`

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
- nullable `ContentPosts.ChannelId` and `ContentPosts.SocialAccountId`
- optional `Campaigns.ChannelId` + index (`TeamId`, `ChannelId`)

Migration:
- `20260416094812_TeamFirstOnboardingScopedCampaignsOptionalContent`

---

## Error Mapping

`ExceptionMiddleware` maps:
- `InvalidOperationException` / validation errors -> `400`
- `UnauthorizedAccessException` -> `403` (or `401` on auth routes)
- `KeyNotFoundException` -> `404`
- unknown exceptions -> `500`
