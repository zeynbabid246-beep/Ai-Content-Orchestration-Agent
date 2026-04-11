# AiContentFlow App Structure and Logic

## Overview
`AiContentFlow` is a modular monolith built with Clean Architecture. It manages team-scoped social content workflows: create content, generate variants, schedule/publish, and track lifecycle state.

## Solution Layers

### `AiContentFlow.Domain`
Core business models and enums:
- `Team`, `UserTeam`
- `ContentPost`, `PostVariant`
- `Channel`, `SocialAccount`
- `Campaign`, `CampaignContentPost`
- Enums for content type/status/platform

Rules are centered on tenant isolation via `TeamId`.

### `AiContentFlow.Application`
Use-case layer (business logic):
- Service interfaces and implementations (Auth, Teams, ContentPosts, Channels, SocialAccounts, Campaigns)
- DTOs for API boundaries
- Repository interfaces (abstractions)
- Validators (FluentValidation)

This layer enforces membership checks and role-based permissions before mutations.

### `AiContentFlow.Infrastructure`
Technical implementations:
- `AppDbContext` and EF Core mappings
- Repository implementations for application interfaces
- Identity/JWT/refresh-token persistence and token rotation
- Migrations

It contains persistence details only; business policies stay in Application services.

### `AiContentFlow.API`
HTTP entry point:
- Thin controllers
- Authentication/authorization middleware
- Exception middleware mapping to consistent status codes
- DI registrations

Controllers call application services and return DTO-based responses.

## Request Flow (High Level)
1. Request enters API controller.
2. Controller extracts current user id from claims.
3. Controller delegates to application service.
4. Service validates input DTO and verifies:
   - Team exists
   - Request user is team member
   - Required role for write operations
5. Service uses repository interfaces.
6. Infrastructure repositories execute EF Core operations.
7. Service maps entities to response DTOs.
8. Controller returns `201`, `200`, or `204` as appropriate.

## Multi-Tenant Isolation Logic
All critical entities are team-scoped (`TeamId`):
- `Team`
- `Channel`
- `SocialAccount`
- `ContentPost`
- `Campaign`

Isolation is enforced by:
- Team membership checks on every read/write use case.
- Team-filtered repository queries.
- Service-level ownership checks for cross-entity references.
- API routes carrying `teamId` context:
  - `api/teams/{teamId}/channels`
  - `api/teams/{teamId}/social-accounts`
  - `api/teams/{teamId}/content-posts`
  - `api/teams/{teamId}/campaigns`

## Channel + SocialAccount Slice Logic
- `Channel` and `SocialAccount` are soft-deletable (`IsDeleted`, `DeletedAt`).
- Create/update/delete operations are restricted to owner/admin roles.
- Read operations require team membership.
- Uniqueness is enforced within team scope (e.g., channel name and social account identity constraints).

## Content Workflow (Current)
- `ContentPost` references `ChannelId` and `SocialAccountId`.
- Post variants are modeled by `PostVariant` (per social platform variant output).
- `ContentPostService.CreateAsync` and `UpdateAsync` enforce strict ownership validation:
  - `ChannelId` must exist in the same `teamId`.
  - `SocialAccountId` must exist in the same `teamId`.
  - `SocialAccount.ChannelId` must match `ContentPost.ChannelId`.
- Violations are surfaced consistently through exception middleware:
  - missing team-scoped references -> `404 NotFound`
  - invalid channel/social-account linkage -> `400 BadRequest`
  - membership/role violations -> `403 Forbidden`

### ContentPost Lifecycle Hardening
- Lifecycle transitions are explicit and forward-only:
  - `Draft -> Ready`
  - `Ready -> Scheduled`
  - `Scheduled -> Published`
- Invalid transitions are rejected in application service logic as domain rule violations (`400 BadRequest`).
- Scheduling is implemented as a dedicated use case:
  - requires `Owner` or `Admin` role,
  - validates `ScheduledAt` is UTC,
  - validates `ScheduledAt` is in the future,
  - applies the `Ready -> Scheduled` transition and stores `ScheduledAt`.
- Publishing is implemented as a dedicated manual trigger path:
  - requires `Owner` or `Admin` role,
  - applies the `Scheduled -> Published` transition,
  - sets `PublishedAt` consistently.
- Workflow actions are exposed through thin team-scoped API endpoints under:
  - `api/teams/{teamId}/content-posts/{contentPostId}/workflow/transition`
  - `api/teams/{teamId}/content-posts/{contentPostId}/workflow/schedule`
  - `api/teams/{teamId}/content-posts/{contentPostId}/workflow/publish`

## Campaign Slice Logic (Current)
- `Campaign` is team-scoped and soft-deletable (`IsDeleted`, `DeletedAt`).
- Campaign lifecycle is explicit via `CampaignStatus`:
  - `Draft`, `Active`, `Paused`, `Completed`, `Archived`.
- Campaign mutations (create/update/delete/link/unlink) require `Owner` or `Admin` team role.
- Campaign reads require team membership.
- Campaign-to-content linking is modeled through `CampaignContentPost` (many-to-many).
- Linking rules enforced in application service:
  - campaign must exist in same `teamId`
  - content post must exist in same `teamId`
  - duplicate campaign/content-post link is rejected
- Error behavior aligns with middleware mapping:
  - missing team-scoped campaign or content post -> `404 NotFound`
  - duplicate link/domain rule violations -> `400 BadRequest`
  - membership/role violations -> `403 Forbidden`

## Security and Auth
- ASP.NET Identity for user management.
- JWT access tokens for API authorization.
- Refresh tokens stored hashed with rotation.
- Global exception middleware returns standardized error payloads.

## Why This Design
This structure keeps:
- business rules centralized in application services,
- persistence isolated in infrastructure,
- controllers simple and testable,
- tenant boundaries explicit and consistently enforced.