# AiContentFlow Project Changes Log

## Purpose
This document records the main foundation updates made to the AiContentFlow backend so the project can continue from a stable baseline.

## Date
- **2026-04-07**

## What Was Done

### 1) Project context and Copilot guidance were documented
- Created and updated `.github/copilot-instructions.md`.
- Added project rules for:
  - Clean Architecture
  - team-based multi-tenancy
  - DTO usage
  - controller/service separation
  - Identity usage
  - incremental changes only

### 2) Architecture leakage was reduced
- Removed the domain `User` model.
- Kept ASP.NET Identity as the source of truth for user accounts.
- Updated team-related repository contracts to use identity-backed user data instead of a domain user entity.

### 3) Authentication flow was improved
- Populated authentication responses with real user data:
  - `UserId`
  - `Username`
  - `Email`
- Fixed the login and register paths so they return consistent metadata.
- Improved refresh-token handling so refreshed access tokens keep the expected claims.

### 4) Refresh token security was hardened
- Changed refresh-token storage from raw tokens to hashed tokens.
- Added rotation metadata support.
- Added revocation timestamps.
- Added replay-protection behavior for rotated tokens.
- Switched refresh token generation to a cryptographically secure random generator.

### 5) Persistence mapping was corrected
- Fixed `AppDbContext` refresh-token mapping.
- Added proper constraints and indexes for secure token storage.
- Ensured the refresh-token entity aligns with the database model.

### 6) API error handling was centralized
- Added `AiContentFlow.API/Middleware/ExceptionMiddleware.cs`.
- Registered the middleware in `Program.cs`.
- Standardized JSON error responses for:
  - validation errors
  - unauthorized access
  - not found errors
  - unexpected server errors

### 7) Multi-tenant team and post flows were tightened
- Updated team and post services to use not-found exceptions where appropriate.
- Kept team ownership checks intact.
- Preserved `TeamId`-based scoping for post access.

### 8) Configuration safety was improved
- Removed hardcoded secrets from `appsettings.json`.
- Replaced them with placeholders so secrets can be supplied through secure configuration.

### 9) Unnecessary package dependency was removed
- Removed `Microsoft.Extensions.Configuration.Abstractions` from `AiContentFlow.API.csproj` to keep the project clean and avoid the NuGet pruning warning.

### 10) The legacy post slice was replaced with the real content workflow aggregate
- Removed the old `Post` slice entirely.
- Added `ContentPost` as the primary content aggregate.
- Added `PostVariant` for social-platform variants.
- Added team-scoped `ContentPost` API, application service, repository, and EF mapping.
- Replaced the old post migration with a drop-and-create migration for `ContentPosts` and `PostVariants`.

## Files Updated

### New Files
- `AiContentFlow.API/Middleware/ExceptionMiddleware.cs`
- `AiContentFlow_Project_Changes.md`

### Modified Files
- `AiContentFlow.API/Program.cs`
- `AiContentFlow.API/appsettings.json`
- `AiContentFlow.API/AiContentFlow.API.csproj`
- `AiContentFlow.Application/Common/Interfaces/IIdentityService.cs`
- `AiContentFlow.Application/Common/Interfaces/IRefreshTokenRepository.cs`
- `AiContentFlow.Application/Common/Interfaces/ITeamRepository.cs`
- `AiContentFlow.Application/Features/Auth/AuthService.cs`
- `AiContentFlow.Application/Features/Auth/Dtos/RefreshTokenDto.cs`
- `AiContentFlow.Application/Features/Teams/TeamService.cs`
- `AiContentFlow.Domain/Models/Team.cs`
- `AiContentFlow.Infrastructure/Identity/IdentityService.cs`
- `AiContentFlow.Infrastructure/Identity/RefreshToken.cs`
- `AiContentFlow.Infrastructure/Persistence/AppDbContext.cs`
- `AiContentFlow.Infrastructure/Persistence/Repositories/RefreshTokenRepository.cs`
- `AiContentFlow.Infrastructure/Persistence/Repositories/TeamRepository.cs`
- `AiContentFlow.Infrastructure/Services/JwtTokenGenerator.cs`
- `AiContentFlow.Domain/Models/ContentEnums.cs`
- `AiContentFlow.Domain/Models/ContentPost.cs`
- `AiContentFlow.Domain/Models/PostVariant.cs`
- `AiContentFlow.Application/Common/Interfaces/IContentPostRepository.cs`
- `AiContentFlow.Application/Features/ContentPosts/*`
- `AiContentFlow.Infrastructure/Persistence/Repositories/ContentPostRepository.cs`
- `AiContentFlow.Infrastructure/Persistence/AppDbContext.cs`
- `AiContentFlow.API/Controllers/ContentPostsController.cs`
- `AiContentFlow.Infrastructure/Migrations/20260407120000_ReplacePostsWithContentPosts.cs`
- `AiContentFlow.Infrastructure/Migrations/20260407120000_ReplacePostsWithContentPosts.Designer.cs`
- `AiContentFlow.Infrastructure/Migrations/AppDbContextModelSnapshot.cs`

### Removed Files
- `AiContentFlow.Domain/Models/User.cs`
- `AiContentFlow.Domain/Models/Post.cs`
- `AiContentFlow.Application/Common/Interfaces/IPostRepository.cs`
- `AiContentFlow.Application/Features/Posts/`
- `AiContentFlow.Infrastructure/Persistence/Repositories/PostRepository.cs`
- `AiContentFlow.API/Controllers/PostsController.cs`
- `AiContentFlow.Infrastructure/Migrations/20260406235209_AddPosts.cs`
- `AiContentFlow.Infrastructure/Migrations/20260406235209_AddPosts.Designer.cs`

## Validation
- The solution was built successfully after the changes.
- Build status: **passed**

## Important Notes For Future Work
- Keep Identity as the user source of truth.
- Continue enforcing `TeamId` for tenant isolation.
- Keep refresh tokens hashed in storage.
- Keep controllers thin and business rules in application services.
- Add social account, content workflow, and scheduling features on this foundation.

---

## Date
- **2026-04-08**

## What Was Done

### 11) Strict `ContentPost` ownership validation was completed
- Updated `ContentPostService` (`CreateAsync`, `UpdateAsync`) to enforce:
  - `ChannelId` must exist in the same team.
  - `SocialAccountId` must exist in the same team.
  - `SocialAccount.ChannelId` must match `ContentPost.ChannelId`.
- Kept ownership checks in `Application` service layer using repository abstractions.

### 12) Error behavior was aligned to API status mapping
- Missing team-scoped `Channel`/`SocialAccount` now produce not-found behavior (`404`).
- Invalid cross-entity linkage now produces bad-request behavior (`400`).
- Membership and role violations continue to produce forbidden behavior (`403`).

### 13) Unit tests were added for critical content-post validation paths
- Added `AiContentFlow.Application.Tests/Features/ContentPosts/ContentPostServiceTests.cs` covering:
  - cross-team `ChannelId` rejection,
  - cross-team `SocialAccountId` rejection,
  - mismatched `ChannelId` vs `SocialAccount.ChannelId` rejection,
  - valid same-team linkage acceptance.

### 14) Documentation was updated to match runtime behavior
- Updated `AiContentFlow_API_Endpoints.md` with `ContentPost` validation and error outcomes.
- Updated `.github/copilot-instructions.md` implementation status and active priority.
- Updated `AiContentFlow_App_Structure_and_Logic.md` for current ownership/linkage rules.

## Date
- **2026-04-09**

## What Was Done

### 15) Campaign vertical slice was implemented
- Added `Campaign` with lifecycle `CampaignStatus` (`Draft`, `Active`, `Paused`, `Completed`, `Archived`).
- Added `CampaignContentPost` join model for many-to-many links with `ContentPost`.
- Added team-scoped campaign DTOs, service contract, service implementation, and repository contracts.
- Added campaign API endpoints under `api/teams/{teamId}/campaigns`.

### 16) Campaign tenant and authorization rules were enforced
- Membership checks are required for campaign reads.
- Admin/Editor role checks are required for campaign mutations and link/unlink operations.
- Campaign and content post existence checks are enforced in team scope.
- Duplicate campaign-content links are rejected as domain violations.

### 17) Persistence and DI were extended for campaigns
- Added EF Core mappings for `Campaign` and `CampaignContentPost` in `AppDbContext`.
- Added campaign repository implementations in infrastructure.
- Registered campaign services/repositories in API DI configuration.

### 18) Campaign tests and documentation were added
- Added `AiContentFlow.Application.Tests/Features/Campaigns/CampaignServiceTests.cs` for:
  - cross-team access rejection,
  - cross-team content-post link rejection,
  - duplicate link rejection,
  - valid same-team link/unlink.
- Updated `AiContentFlow_API_Endpoints.md` with campaign routes and validation behavior.
- Updated `.github/copilot-instructions.md` campaign status and traceability notes.

## Date
- **2026-04-09**

## What Was Done

### 19) ContentPost lifecycle workflow was hardened
- Added explicit lifecycle transition enforcement in `ContentPostService`.
- Enforced forward-only workflow chain: `Draft -> Ready -> Scheduled -> Published`.
- Rejected invalid transitions as domain violations (`InvalidOperationException` -> `400`).

### 20) Scheduling and manual publish workflows were added
- Added scheduling use case in `ContentPostService.ScheduleAsync`.
- Enforced scheduling constraints:
  - `ScheduledAt` must be UTC.
  - `ScheduledAt` must be in the future.
- Added manual publish use case in `ContentPostService.PublishAsync` with consistent `PublishedAt` update.

### 21) ContentPost workflow API actions were added
- Extended `ContentPostsController` with workflow endpoints under `api/teams/{teamId}/content-posts/{contentPostId}`:
  - `POST /workflow/transition`
  - `POST /workflow/schedule`
  - `POST /workflow/publish`
- Kept controllers thin and delegated orchestration to `Application` services.

### 22) Team isolation and role permissions were aligned for workflow mutations
- Enforced team-scoped existence and membership checks in workflow mutation paths.
- Enforced `Admin` requirement consistently for content-post workflow mutations.
- Preserved error mapping consistency:
  - missing team-scoped resources -> `404`
  - rule violations -> `400`
  - membership/role violations -> `403`

### 23) Focused ContentPost lifecycle tests were added
- Extended `AiContentFlow.Application.Tests/Features/ContentPosts/ContentPostServiceTests.cs` with cases for:
  - invalid transition rejection,
  - cross-team scoped resource rejection (`404` behavior via exception type),
  - role violation rejection,
  - valid schedule/publish flow.

---

## Date
- **2026-04-16**

## What Was Done

### 24) Team-first onboarding backend was fully implemented
- `AuthService.RegisterAsync` now creates identity user + team + admin membership + refresh token in one transaction boundary.
- Registration now supports:
  - direct team name (`teamName` provided),
  - temporary default team name (`teamName` omitted).
- `AuthResponseDto` now includes:
  - `TeamId`
  - `TeamRole`
  - `IsTeamNameSetupRequired`
- Added `PUT /api/Team/{teamId}/name` to complete onboarding naming when temporary team name is used.

### 25) Team role model was extended with `Editor`
- Added `Editor` in `TeamRole` enum.
- Campaign mutation policy now allows `Admin/Editor`.

### 26) Channel uniqueness was hardened with normalized keys
- Added `Channel.NormalizedName`.
- Added unique index on `(TeamId, NormalizedName)`.
- `ChannelService` now normalizes channel names (`ToUpperInvariant`) for uniqueness checks.

### 27) Campaign channel scoping was added
- Added optional `Campaign.ChannelId` relation.
- Create/update campaign now validate optional `ChannelId` in team scope.
- Campaign DTO contracts now carry `channelId`.

### 28) Content post optional linkage was implemented
- `ContentPost.ChannelId` and `ContentPost.SocialAccountId` are now nullable.
- Standalone content post create/schedule/publish is supported.
- If links are provided, service enforces team ownership and channel/social consistency.

### 29) Persistence and migration updates were delivered
- Updated EF model configuration in `AppDbContext` and `ContentPostConfiguration`.
- Added migration:
  - `20260416094812_TeamFirstOnboardingScopedCampaignsOptionalContent`
- Migration includes backfill for `Channels.NormalizedName` before unique index enforcement.

### 30) Tests were expanded for critical new rules
- Added `AuthServiceTests` for register onboarding/team-admin creation behavior.
- Added `TeamServiceTests` for onboarding team-name setup flow and role checks.
- Added channel uniqueness case-insensitive test.
- Added standalone content post tests and invalid optional-link combination test.
- Updated campaign tests for `Editor` campaign mutation permission.

### 31) Role model was simplified to Admin/Editor/Viewer
- Removed `Owner` from `TeamRole`.
- Treated `Admin` as owner-equivalent role.
- Added data migration to map old role values:
  - previous `Owner (2)` -> `Admin (1)`
  - previous `Editor (3)` -> `Editor (2)`
- Added migration:
  - `20260416102043_SimplifyTeamRolesToAdminEditorViewer`

## Validation
- `dotnet build -v minimal` succeeded.
- `AiContentFlow.Application.Tests` run succeeded: `25 passed, 0 failed`.

## Notes
- Existing `NU1510`/nullable warnings remain from prior configuration and were not expanded in scope.
