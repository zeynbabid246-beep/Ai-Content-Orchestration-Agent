# AiContentFlow App Structure and Logic

## Overview
`AiContentFlow` is a modular monolith built with Clean Architecture to support multi-tenant social content operations. The application allows teams to manage channels, connect social accounts, create and evolve content posts through a controlled lifecycle, group posts into campaigns, and enforce tenant-safe access with role-based permissions.

Core behavior is organized around these principles:
- strict `TeamId` tenant boundaries,
- thin API controllers,
- business orchestration in `Application` services,
- EF Core and Identity concerns isolated in `Infrastructure`.

---

## Layered Architecture

### `AiContentFlow.Domain`
Holds core entities, enums, and relationship intent.

Main entities:
- `Team`
- `UserTeam`
- `Channel`
- `SocialAccount`
- `ContentPost`
- `PostVariant`
- `Campaign`
- `CampaignContentPost`

Main enums:
- `TeamRole` (`Owner`, `Admin`, `Viewer`)
- `ContentType`
- `ContentStatus` (`Draft`, `Ready`, `Scheduled`, `Published`, `Deleted`)
- `SocialPlatform`
- `SocialAccountStatus`
- `CampaignStatus`

### `AiContentFlow.Application`
Implements use-case logic and contracts.

Contains:
- service interfaces and services,
- request/response DTOs,
- repository interfaces,
- validation and domain-rule enforcement.

This is the policy layer where authorization and workflow rules are enforced.

### `AiContentFlow.Infrastructure`
Implements technical concerns.

Contains:
- `AppDbContext` model configuration,
- repository implementations,
- ASP.NET Identity integration,
- JWT/refresh-token persistence,
- EF migrations.

### `AiContentFlow.API`
HTTP boundary.

Contains:
- controllers,
- authentication/authorization middleware pipeline,
- exception middleware,
- DI registration for services and repositories.

Controllers do not contain business rules; they delegate to application services.

---

## Entity Model and Relationships

### Tenant and Membership
- `Team` is the tenant root.
- `UserTeam` links Identity users to teams and stores team role.
- A user can belong to multiple teams.

### Channel and Social Account
- `Channel` belongs to one `Team`.
- `SocialAccount` belongs to one `Team` and references one `Channel`.
- `Channel` and `SocialAccount` are soft-deletable (`IsDeleted`, `DeletedAt`).

### Content Post Aggregate
- `ContentPost` belongs to one `Team`.
- `ContentPost` references:
  - one `Channel` (`ChannelId`),
  - one `SocialAccount` (`SocialAccountId`).
- `PostVariant` is a one-to-many child of `ContentPost` for platform-specific variants.

### Campaign Aggregate
- `Campaign` belongs to one `Team` and is soft-deletable.
- `CampaignContentPost` is a join entity implementing many-to-many between `Campaign` and `ContentPost`.
- Campaign linking is team-scoped and duplicate-link protected.

---

## End-to-End Request Communication Flow

1. Client calls API endpoint.
2. JWT middleware authenticates the user.
3. Controller extracts `userId` from claims (`sub`/name identifier).
4. Controller passes `teamId`, `userId`, and DTO to service.
5. Service executes business checks:
   - team existence,
   - membership,
   - role authorization,
   - cross-entity tenant consistency,
   - lifecycle/domain rules.
6. Service calls repository interfaces.
7. Infrastructure repositories execute EF Core queries/updates.
8. Service maps entities to response DTOs.
9. Controller returns HTTP response.

Error communication path:
- service throws typed exceptions,
- `ExceptionMiddleware` maps to status codes:
  - `KeyNotFoundException` -> `404`,
  - `InvalidOperationException`/validation/argument errors -> `400`,
  - `UnauthorizedAccessException` -> `403` (or `401` for auth routes).

---

## Authorization and Tenant Isolation Logic

### Membership
All team-scoped read/write operations validate that requester belongs to the target `teamId`.

### Role Enforcement
- `Owner`/`Admin`: required for mutation-heavy operations (channels, social accounts, campaigns, content workflow mutations).
- `Viewer`: read-only for team-scoped resources.

### Team-Scoped Data Integrity
Application services enforce that referenced entities belong to the same team before mutation:
- `ContentPost.ChannelId` must exist in same team.
- `ContentPost.SocialAccountId` must exist in same team.
- `SocialAccount.ChannelId` must match `ContentPost.ChannelId`.

---

## Content Workflow Logic

### Creation and Update
`ContentPostService` handles create/get/update/delete with role and tenant checks.

Update rules include:
- cannot set `Deleted` through update (must use delete endpoint),
- cannot set `Scheduled` directly through update,
- cannot set `Published` directly through update.

This ensures lifecycle actions happen through dedicated workflow endpoints.

### Lifecycle State Machine
Allowed forward transitions:
- `Draft -> Ready`
- `Ready -> Scheduled`
- `Scheduled -> Published`

Invalid transitions are rejected as `400` domain violations.

### Scheduling Use Case
`ScheduleAsync` enforces:
- `Owner`/`Admin` permission,
- existing team-scoped content post,
- `ScheduledAt` is UTC,
- `ScheduledAt` is in the future,
- valid transition `Ready -> Scheduled`.

Result:
- `Status = Scheduled`,
- `ScheduledAt` stored,
- `UpdatedAt` refreshed.

### Manual Publish Use Case
`PublishAsync` enforces:
- `Owner`/`Admin` permission,
- existing team-scoped content post,
- valid transition `Scheduled -> Published`.

Result:
- `Status = Published`,
- `PublishedAt` stamped,
- optional platform metadata stored (`PlatformPostId`, `PlatformPostUrl`),
- `UpdatedAt` refreshed.

---

## Campaign Logic

`CampaignService` supports create/read/update/delete/link/unlink.

Business rules:
- campaign mutations require `Owner`/`Admin`,
- reads require membership,
- linked content posts must be in same team,
- duplicate links are rejected,
- delete is soft-delete.

---

## API Endpoint Surface

### Auth
Base: `api/Auth`
- `POST /register`
- `POST /login`
- `POST /refresh`

### Team
Base: `api/Team`
- `POST /api/Team`
- `GET /api/Team/{teamId}/members`
- `POST /api/Team/{teamId}/invite`
- `PUT /api/Team/{teamId}/members/role`
- `DELETE /api/Team/{teamId}/members/{targetUserId}`

### Channels
Base: `api/teams/{teamId}/channels`
- `POST /`
- `GET /`
- `GET /{channelId}`
- `PUT /{channelId}`
- `DELETE /{channelId}`

### Social Accounts
Base: `api/teams/{teamId}/social-accounts`
- `POST /`
- `GET /`
- `GET /{socialAccountId}`
- `PUT /{socialAccountId}`
- `DELETE /{socialAccountId}`

### Content Posts
Base: `api/teams/{teamId}/content-posts`
- `POST /`
- `GET /`
- `GET /{contentPostId}`
- `PUT /{contentPostId}`
- `DELETE /{contentPostId}`
- `POST /{contentPostId}/workflow/transition`
- `POST /{contentPostId}/workflow/schedule`
- `POST /{contentPostId}/workflow/publish`

### Campaigns
Base: `api/teams/{teamId}/campaigns`
- `POST /`
- `GET /`
- `GET /{campaignId}`
- `PUT /{campaignId}`
- `DELETE /{campaignId}`
- `POST /{campaignId}/content-post-links`
- `DELETE /{campaignId}/content-post-links/{contentPostId}`

---

## Typical Business Workflow Example

1. User registers/logs in -> receives JWT + refresh token.
2. User creates a team (becomes `Owner`).
3. Owner creates a `Channel`.
4. Owner creates a `SocialAccount` under that channel.
5. Owner creates a `ContentPost` in `Draft`.
6. Owner moves post to `Ready`.
7. Owner schedules post with future UTC time (`Scheduled`).
8. Owner triggers manual publish (`Published`).
9. Owner creates a `Campaign` and links/unlinks content posts.

At every step, team scoping and role checks are enforced before persistence.

---

## Security and Operational Notes

- Identity source of truth is ASP.NET Identity (`ApplicationUser`).
- JWT used for API authentication.
- Refresh tokens are stored hashed and rotated.
- Sensitive tokens/secrets are not returned in logs by design.
- Exception responses use consistent JSON shape from middleware.

---

## Why the Current Design Works

- Keeps domain policies centralized in application services.
- Preserves clean dependency direction.
- Makes controllers predictable and thin.
- Keeps tenant boundaries explicit and testable.
- Supports incremental expansion (new workflow modules, analytics, background jobs) without architectural drift.
