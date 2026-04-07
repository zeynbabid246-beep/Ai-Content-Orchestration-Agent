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
- `AiContentFlow.Application/Features/Posts/PostService.cs`
- `AiContentFlow.Application/Features/Teams/TeamService.cs`
- `AiContentFlow.Domain/Models/Team.cs`
- `AiContentFlow.Infrastructure/Identity/IdentityService.cs`
- `AiContentFlow.Infrastructure/Identity/RefreshToken.cs`
- `AiContentFlow.Infrastructure/Persistence/AppDbContext.cs`
- `AiContentFlow.Infrastructure/Persistence/Repositories/RefreshTokenRepository.cs`
- `AiContentFlow.Infrastructure/Persistence/Repositories/TeamRepository.cs`
- `AiContentFlow.Infrastructure/Services/JwtTokenGenerator.cs`

### Removed Files
- `AiContentFlow.Domain/Models/User.cs`

## Validation
- The solution was built successfully after the changes.
- Build status: **passed**

## Important Notes For Future Work
- Keep Identity as the user source of truth.
- Continue enforcing `TeamId` for tenant isolation.
- Keep refresh tokens hashed in storage.
- Keep controllers thin and business rules in application services.
- Add social account, content workflow, and scheduling features on this foundation.
