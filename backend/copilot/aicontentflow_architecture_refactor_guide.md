# AiContentFlow — Architecture Reference (Current)

## 1) Current system shape

AiContentFlow is a multi-tenant backend with clean boundaries between:

- **Editorial domain**: `ContentPost` + `PostVariant` (what content exists).
- **Delivery domain**: `PostPublication` + `PublishJob` (how content is delivered).
- **Integration domain**: social auth + publishers + credential protection.

Every tenant-owned entity is scoped by `TeamId`, and application services enforce membership/role checks.

## 2) Active tenancy and authorization model

- Tenant root: `Team`
- Membership join: `UserTeam`
- Roles: `Viewer`, `Admin`, `Editor`
- Mutation policy: `Admin` and `Editor`
- Read policy: any team member

Provider callbacks are never trusted for tenancy: tenant authority is derived from signed app state and authenticated user context.

## 3) Domain boundaries (implemented)

### Editorial
- `Channel` (team workspace, normalized unique name by team)
- `Campaign` (team + channel scoped)
- `ContentPost` (team + channel scoped, optional `CampaignId`)
- `PostVariant` (platform-specific content adaptation only)

### Delivery
- `PostPublication` (delivery intent + publication lifecycle state)
- `PublishJob` (execution, retries, dead-letter metadata)
- `PublicationAnalytics` (publication-scoped metrics snapshots)

### Social integrations
- `SocialAuthService` handles signed-state login + callback orchestration.
- Platform-specific services perform provider token/account exchange.
- `ISocialCredentialStore` protects token material at rest.

## 4) Lifecycle rules

### Content lifecycle
- `Draft -> Review -> Approved -> Scheduled -> Published -> Archived`
- Scheduling/publishing are workflow actions and publication-driven.

### Publication lifecycle
- `Scheduled`, `Queued`, `Publishing`, `Published`, `Failed`, `Retrying`, `Cancelled`
- Publication creation is idempotent (intent matching or explicit idempotency key).
- `PostPublication` + `PublishJob` are created in one transaction.

### Job lifecycle
- `Pending`, `Running`, `Succeeded`, `Failed`, `DeadLettered`
- Retries use backoff and dead-letter after max attempts.

## 5) Runtime processing

- Immediate publish endpoint creates publication + pending job.
- Scheduled publish endpoint creates publication + job at future `ScheduledAt`.
- `PublishScheduledVariantsJob` claims due jobs and publishes in batches.
- `SyncPublicationAnalyticsJob` syncs publication analytics snapshots.
- Hangfire recurring jobs:
  - `publish-scheduled-variants` (minutely)
  - `sync-publication-analytics` (hourly)

## 6) Architectural guardrails

- Keep editorial entities free of execution/retry state.
- Keep delivery entities publication-centric (never variant/post-global state).
- Keep repository APIs team-scoped for tenant-owned data.
- Keep OAuth tenant binding in application logic, not in provider adapters.
- Keep controllers thin; orchestrate in application services.

