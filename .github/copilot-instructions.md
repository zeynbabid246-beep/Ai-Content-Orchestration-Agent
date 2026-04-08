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