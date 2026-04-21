# AiContentFlow Project Instructions

## Project Overview
AiContentFlow is a multi-tenant AI-powered platform for creating, managing, scheduling, and publishing social media content across multiple platforms.

## Solution Structure
- `AiContentFlow.Domain`  
  Entities, enums, and business rules.
- `AiContentFlow.Application`  
  Use cases, interfaces, DTOs.
- `AiContentFlow.Infrastructure`  
  EF Core, Identity, and external services.
- `AiContentFlow.API`  
  Controllers and middleware.

### Architecture Rules
- `Domain` is the core.
- `Application` depends only on `Domain`.
- `Infrastructure` depends on `Application` and `Domain`.
- `API` depends on `Application` and `Infrastructure`.
- Keep the solution as a modular monolith.
- Do not introduce microservices unless explicitly requested.

## Business Context
The platform supports:
- team-based multi-tenancy
- social account connection
- content creation
- AI content generation
- scheduling and publishing
- basic analytics aggregation
- role-based access control

## Roles and Permissions
Roles:
- `Admin`
- `Editor`
- `Viewer`

Note:
- Current implemented team-role model is `Admin`, `Editor`, `Viewer`.
- `Admin` is owner-equivalent role.
- Editors can perform all content-post workflow mutations in their team scope (`create/update/delete/transition/schedule/publish`).

Rules:
- All data belongs to a `Team`.
- Users may only access data for teams they belong to.
- Ownership and access must always be enforced by `TeamId`.

## Authentication and Authorization
- Use ASP.NET Identity.
- Use JWT access tokens.
- Use refresh tokens stored in the database.
- Refresh token rotation is enabled.
- Refresh tokens must be stored hashed, not in plain text.
- Never expose tokens in logs or responses.
- Use `IdentityUser` from Identity as the source of truth for users.
- Do not use a `User` entity in the domain layer.
- If user profile data is needed, create a separate profile entity in `Domain` and link it to Identity by user id.

## Data Access Rules
- Use EF Core in `Infrastructure` only.
- Never place `DbContext` in `Application`.
- Do not expose EF entities in API responses.
- Use repositories and interfaces through `Application`.

## API Rules
- Use RESTful endpoints.
- Use DTOs for requests and responses.
- Keep controllers thin.
- Put business logic in services/use cases, not controllers.
- Return consistent response shapes.
- Use appropriate HTTP status codes.

## Validation
- Validate all inputs.
- Enforce required fields and string length limits.
- Trim and normalize strings where appropriate.
- Use FluentValidation where suitable.

## Error Handling
- Use global exception middleware.
- Map domain, validation, not found, and authorization errors consistently.
- Do not leak internal details in error messages.

## Coding Standards
- Use PascalCase for C# types and members.
- Interfaces must start with `I`.
- Async methods must end with `Async`.
- Prefer clean, readable code over clever code.
- Use minimal comments only when necessary.
- Respect existing naming and folder conventions.

## Testing
- Prefer unit tests for application services.
- Add integration tests for critical workflows and persistence.
- Keep tests focused, repeatable, and readable.

## Copilot Behavior
- Preserve the current architecture.
- Prefer small, incremental changes.
- Ask before making large refactors.
- Do not change public contracts without request.
- Do not move code between layers unless necessary and approved.
- Follow existing patterns in the repository.
- Prefer secure defaults over convenience shortcuts.

## Current Project Priorities
1. Clean Architecture correctness
2. Core content workflow: create → generate → publish
3. Multi-tenant data isolation

## Out of Scope
- advanced analytics dashboards
- real-time collaboration
- billing/subscriptions
- complex AI fine-tuning
- high-scale distributed systems

## Open Areas
These areas are still evolving:
- `SocialAccount` design
- `Channel` implementation
- content workflow details
- AI integration
- scheduling/background jobs
- `ContentPost` related collections not yet implemented in the schema: `ContentPostInterest`, `Comment`, `PostAnalytics`, `AuditTrail`, `PostConfigOverride`, `PublishJob`
- use `PostVariant` for social-platform variants; do not introduce or keep a separate `PostPlatform` entity

## Next Delivery Priority (Execution Order)
1. Keep authorization and documentation aligned with runtime behavior, especially team-role policies.

## Next Steps (Execution Checklist)
1. Keep role enforcement consistent across modules (`Admin`, `Editor`, `Viewer`) without reintroducing `Owner`.
2. Expand focused tests for role boundaries and tenant isolation where new endpoints are added.
3. Continue content workflow delivery while keeping controllers thin and service-layer orchestration.
4. Keep docs and traceability updated after each behavior change.

## Implementation Status Snapshot
- `ContentPost` + `PostVariant` iteration is implemented:
  - `ContentPost` domain model, DTOs, services, repositories, and API endpoints are in place.
  - `PostVariant` is used for social-platform variants (no separate `PostPlatform` entity).
  - Persistence and migration support for `ContentPosts` and `PostVariants` are in place.
- `Channel` + `SocialAccount` vertical slice is now implemented:
  - Domain entities and enums added.
  - Application DTOs/services/repositories/validators added.
  - Infrastructure EF configuration and migration added.
  - API endpoints added for:
    - `api/teams/{teamId}/channels`
    - `api/teams/{teamId}/social-accounts`
- Validation execution detail:
  - Automated tests were added for critical authorization and tenant-isolation paths.
  - Full test execution may still be intermittently impacted by NuGet connectivity (`NU1301` to `https://api.nuget.org/v3/index.json`).
- `ContentPost` ownership validation with real `Channel` and `SocialAccount` checks is implemented:
  - `CreateAsync` and `UpdateAsync` enforce team-scoped `ChannelId` existence.
  - `CreateAsync` and `UpdateAsync` enforce team-scoped `SocialAccountId` existence.
  - `CreateAsync` and `UpdateAsync` enforce `SocialAccount.ChannelId == ContentPost.ChannelId`.
  - Error behavior is consistent via middleware mapping:
    - missing team-scoped resources -> `404`
    - invalid cross-entity linkage -> `400`
    - membership/role violations -> `403`
- Unit tests cover critical paths for cross-team rejection, linkage mismatch rejection, and valid same-team linkage.
- `Campaign` vertical slice is implemented:
  - `Campaign` + `CampaignContentPost` domain models and lifecycle enum are in place.
  - Team-scoped campaign service/repositories/controllers are in place.
  - Campaign-content post linking enforces same-team ownership and duplicate-link rejection.
  - Unit tests cover campaign tenant-isolation and link/unlink rules.

## Traceability
- Last completed migration: `20260416102043_SimplifyTeamRolesToAdminEditorViewer`.

## Known Technical Blockers
- Intermittent/blocked NuGet restore access to `https://api.nuget.org/v3/index.json` can prevent full restore/test runs.

## Campaign Planning Status
- Campaign requirements are now implemented in the delivered campaign slice.
- Delivered campaign scope includes:
  - Team-scoped `Campaign` with explicit lifecycle status.
  - Many-to-many linking between campaigns and content posts.
  - Team-boundary enforcement when linking content posts.
  - Thin campaign controllers with orchestration in application services.

## Channel and SocialAccount Rules
- `Channel` and `SocialAccount` are team-scoped entities and must include `TeamId`.
- Every read/write operation must verify requester membership in the same `TeamId`.
- `ContentPost.ChannelId` and `ContentPost.SocialAccountId` must reference existing records from the same team.
- Do not allow cross-team references.
- Use soft delete where practical for auditability.
- Keep platform details in `SocialAccount`; do not duplicate platform identity in unrelated entities.

## Campaign Rules
- `Campaign` is team-scoped and must enforce tenant boundaries by `TeamId`.
- Campaign lifecycle should be explicit via status enum (e.g., Draft, Active, Paused, Completed, Archived).
- A campaign can link to many content posts; use a join entity/table.
- Linking content posts to campaigns must enforce same-team ownership.
- Do not embed publishing logic in campaign controllers; keep orchestration in application services.

## API Contract Guidance for New Modules
- Keep controllers thin and delegate business rules to application services.
- Use DTOs only at API boundary; never return EF entities directly.
- Keep route style consistent:
  - `api/teams/{teamId}/channels`
  - `api/teams/{teamId}/social-accounts`
  - `api/teams/{teamId}/campaigns`
- Required status codes:
  - `201 Created` for create
  - `200 OK` for reads/updates returning payloads
  - `204 No Content` for successful operations without payload
  - `400 BadRequest` for validation/domain rule violations
  - `401 Unauthorized` / `403 Forbidden` for auth/access issues
  - `404 NotFound` for missing resources in team scope

## Security and Token Handling
- Continue refresh token rotation.
- Refresh tokens must remain hashed at rest.
- Never log raw access tokens, refresh tokens, secrets, or passwords.

## Validation and Consistency Rules for New Endpoints
- Validate required fields, string lengths, enum ranges, and date ranges.
- Normalize string fields (trim, optionally case-normalize when used for uniqueness).
- Enforce uniqueness where needed within a team boundary (e.g., channel name).
- Add FluentValidation validators for request DTOs when introducing new modules.

## Persistence and Migrations
- All schema updates go through EF Core migrations in `Infrastructure`.
- Keep migration names descriptive and scoped to a single change set.
- Update model configuration in `AppDbContext` with explicit keys, indexes, constraints, and relationships.
- Add indexes for frequent access paths (`TeamId`, status, created date, foreign keys).

## Definition of Done for New Feature Slices
- Domain models and enums defined.
- Application interfaces/services and DTOs implemented.
- Infrastructure repositories implemented and registered in DI.
- API controllers/endpoints added with authorization.
- EF migration added and applied successfully.
- Endpoint guide updated.
- Automated tests added for critical authorization + tenant-isolation paths.