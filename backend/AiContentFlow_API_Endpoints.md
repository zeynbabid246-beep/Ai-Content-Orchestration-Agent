# AiContentFlow API Endpoints Guide

## Base URL
- Local HTTP: `http://localhost:5073`

## Authentication Overview
1. Register with `POST /api/Auth/register`
2. Use `accessToken` as bearer token in protected routes
3. Refresh with `POST /api/Auth/refresh`

Enum payload rule:
- API enum fields are string-only (for example `"Facebook"`, `"LinkedIn"`, `"Approved"`).
- Numeric enum payloads are rejected.

Swagger note:
- In Swagger `Authorize`, paste the raw JWT token value only (without `Bearer ` prefix).

## Standard Error Shape
```json
{
  "message": "Error message",
  "errors": []
}
```

## Permission Matrix (Team Scope)
- `Admin`: full team mutation rights.
- `Editor`: content, campaign, and publication mutations.
- `Viewer`: read-only.

---

## 1) Auth Endpoints
Route base: `api/Auth`

### `POST /api/Auth/register`
Registers user, creates a team, and creates admin membership.

Request:
```json
{
  "username": "ousse",
  "email": "ousse@example.com",
  "password": "P@ssw0rd123",
  "teamName": "Product and Growth"
}
```

`teamName` is optional:
- if provided: team is created with that name, `isTeamNameSetupRequired=false`
- if omitted: temporary team name is created, `isTeamNameSetupRequired=true`

Response `200 OK`:
```json
{
  "userId": "...",
  "username": "ousse",
  "email": "ousse@example.com",
  "teamId": "...guid...",
  "teamRole": "Admin",
  "isTeamNameSetupRequired": false,
  "accessToken": "...",
  "refreshToken": "..."
}
```

### `POST /api/Auth/login`
Response returns same `AuthResponseDto` including `teamId`, `teamRole`, and `isTeamNameSetupRequired`.

### `POST /api/Auth/refresh`
Response returns rotated token pair and same team context metadata.

---

## 2) Team Endpoints
Route base: `api/Team`
Authorization: required

### `POST /api/Team`
Create a team manually (`Admin` membership).

### `PUT /api/Team/{teamId}/name`
Set/rename team name (used for onboarding completion when temporary name exists).

Request:
```json
{
  "name": "Product Team"
}
```

Response: `200 OK` (`TeamResponseDto`)

### `GET /api/Team/{teamId}/members`
Get team members.

Response: `200 OK` (`List<TeamMemberDto>`)
```json
[
  {
    "userId": "...",
    "username": "ousse",
    "role": "Admin",
    "joinedAt": "2026-04-08T10:00:00Z"
  }
]
```

### `POST /api/Team/{teamId}/invite`
Invite user with role `Viewer` or `Editor` (`Admin` assignment blocked by invite endpoint).

Request (`InviteUserDto`):
```json
{
  "username": "otherUser",
  "role": "Viewer"
}
```

Response: `204 No Content`

### `PUT /api/Team/{teamId}/members/role`
Update team member role.

Request (`UpdateMemberRoleDto`):
```json
{
  "targetUserId": "<user-id>",
  "role": "Editor"
}
```

Response: `204 No Content`

### `DELETE /api/Team/{teamId}/members/{targetUserId}`
Remove team member.

Response: `204 No Content`

---

## 3) Channel Endpoints
Route base: `api/teams/{teamId}/channels`
Authorization: required

### `POST /api/teams/{teamId}/channels`
Create a channel.

Request (`CreateChannelDto`):
```json
{
  "name": "LinkedIn",
  "description": "B2B publishing channel"
}
```

Response: `201 Created` (`ChannelResponseDto`)

### `GET /api/teams/{teamId}/channels`
List channels for the team.

Response: `200 OK` (`List<ChannelResponseDto>`)

### `GET /api/teams/{teamId}/channels/{channelId}`
Get channel by id.

Response: `200 OK` (`ChannelResponseDto`)

### `PUT /api/teams/{teamId}/channels/{channelId}`
Update channel.

Request (`UpdateChannelDto`):
```json
{
  "name": "LinkedIn Main",
  "description": "Updated description"
}
```

Response: `200 OK` (`ChannelResponseDto`)

### `DELETE /api/teams/{teamId}/channels/{channelId}`
Soft-delete channel.

Response: `204 No Content`

---

## 4) Social Account Endpoints
Route base: `api/teams/{teamId}/social-accounts`
Authorization: required

### Meta OAuth
- Login: `GET /api/auth/facebook/login?teamId={teamId}&channelId={channelId}`
- Callback: `GET /api/auth/facebook/callback?code=...&state=...`
- Required Meta config: `Meta:AppId`, `Meta:AppSecret`, `Meta:RedirectUri`
- Required permissions: `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`, `public_profile`

### `POST /api/teams/{teamId}/social-accounts`
Create a social account.

Request (`CreateSocialAccountDto`):
```json
{
  "channelId": 1,
  "platform": "LinkedIn",
  "accountHandle": "@brand",
  "displayName": "Brand Page"
}
```

Response: `201 Created` (`SocialAccountResponseDto`)

### `GET /api/teams/{teamId}/social-accounts`
List social accounts for the team.

Response: `200 OK` (`List<SocialAccountResponseDto>`)

### `GET /api/teams/{teamId}/social-accounts/{socialAccountId}`
Get social account by id.

Response: `200 OK` (`SocialAccountResponseDto`)

### `PUT /api/teams/{teamId}/social-accounts/{socialAccountId}`
Update social account.

Request (`UpdateSocialAccountDto`):
```json
{
  "channelId": 1,
  "platform": "LinkedIn",
  "status": "Active",
  "accountHandle": "@brand",
  "displayName": "Brand Page Updated"
}
```

Response: `200 OK` (`SocialAccountResponseDto`)

### `DELETE /api/teams/{teamId}/social-accounts/{socialAccountId}`
Soft-delete social account.

Response: `204 No Content`

---

## 5) Content Post Endpoints
Route base: `api/teams/{teamId}/content-posts`
Authorization: required

### Enums
`ContentType`
- `BlogPost`
- `TwitterThread`
- `LinkedInPost`
- `InstagramPost`
- `FacebookPost`

`ContentStatus`
- `Draft`
- `Review`
- `Approved`
- `Scheduled`
- `Published`
- `Archived`

`SocialPlatform`
- `Facebook`
- `LinkedIn`
- `Instagram`
- `X`
- `Threads`
- `TikTok`

### `POST /api/teams/{teamId}/content-posts`
Create content post.

Request (`CreateContentPostDto`):
```json
{
  "channelId": 1,
  "campaignId": null,
  "title": "AI launch post",
  "contentType": "LinkedInPost",
  "contentJson": "{\"text\":\"Hello LinkedIn\"}",
  "prompt": "Create a linkedin launch post",
  "aiModel": "gpt-4o",
  "aiTokens": 120,
  "postVariants": [
    {
      "platform": "LinkedIn",
      "contentJson": "{\"text\":\"LinkedIn variant\"}",
      "title": "LinkedIn version"
    }
  ]
}
```

Response: `201 Created` (`ContentPostResponseDto`)

Notes:
- `channelId` is required and must exist in the team scope.
- Publication destination is selected later via publication endpoints (`socialAccountId` is no longer part of `ContentPost`).

Validation behavior for create/update:
- `403 Forbidden`: requester is not a member of the team or lacks required role to create/update.
- `404 Not Found`: `ChannelId` does not exist in the provided `teamId`.
- `400 Bad Request`: invalid lifecycle transition.

### `GET /api/teams/{teamId}/content-posts`
List team content posts.

Response: `200 OK` (`List<ContentPostResponseDto>`)

### `GET /api/teams/{teamId}/content-posts/{contentPostId}`
Get content post by id.

Response: `200 OK` (`ContentPostResponseDto`)

### `PUT /api/teams/{teamId}/content-posts/{contentPostId}`
Update content post.

Request (`UpdateContentPostDto`):
```json
{
  "channelId": 1,
  "campaignId": null,
  "title": "AI launch post updated",
  "contentType": "LinkedInPost",
  "contentJson": "{\"text\":\"Updated text\"}",
  "status": "Approved",
  "prompt": "Refine tone",
  "aiModel": "gpt-4o",
  "aiTokens": 140,
  "postVariants": [
    {
      "platform": "LinkedIn",
      "contentJson": "{\"text\":\"Updated LinkedIn variant\"}",
      "title": "LinkedIn updated"
    }
  ]
}
```

Response: `200 OK` (`ContentPostResponseDto`)

### `POST /api/teams/{teamId}/content-posts/{contentPostId}/workflow/transition`
Transition content post status through lifecycle rules (manual status transition endpoint).

Request (`TransitionContentPostStatusDto`):
```json
{
  "status": "Review"
}
```

Response: `200 OK` (`ContentPostResponseDto`)

Rules:
- Allowed transitions are explicit and forward-only:
- `Draft -> Review`
- `Review -> Approved`
- `Approved -> Scheduled`
- `Scheduled -> Published`
- `Published -> Archived`
- Use workflow-specific endpoints for scheduling and publishing actions.

### `POST /api/teams/{teamId}/content-posts/{contentPostId}/workflow/schedule`
Schedule a content post.

Request (`ScheduleContentPostDto`):
```json
{
  "socialAccountId": 1,
  "postVariantId": null,
  "scheduledAt": "2026-04-12T15:30:00Z"
}
```

Response: `200 OK` (`ContentPostResponseDto`)

Scheduling rules:
- `scheduledAt` must be UTC (`Z` suffix).
- `scheduledAt` must be in the future.
- Content post must be publishable (`Approved` or already `Scheduled`).
- `socialAccountId` is required and must reference an active social account in team scope.
- `postVariantId` is optional. If omitted, the platform-matching variant is resolved automatically.
- Creates `PostPublication` + `PublishJob` transactionally.

### `POST /api/teams/{teamId}/content-posts/{contentPostId}/workflow/publish`
Publish a content post via the social publisher pipeline.

Request (`PublishContentPostDto`):
```json
{
  "socialAccountId": 1,
  "postVariantId": null,
  "idempotencyKey": "optional-client-key"
}
```

Response: `200 OK` (`ContentPostResponseDto`)

Publish rules:
- Content post must be publishable (`Approved` or `Scheduled`).
- `socialAccountId` is required and must be active.
- `postVariantId` is optional (service auto-resolves by platform if missing).
- Creates `PostPublication` + `PublishJob` transactionally; returns `200 OK` with current content-post view.

Workflow error behavior:
- `403 Forbidden`: requester is not team member or lacks `Admin/Editor` role for workflow mutations.
- `404 Not Found`: team-scoped content post does not exist.
- `400 Bad Request`: invalid lifecycle transition or invalid scheduling input.

### `DELETE /api/teams/{teamId}/content-posts/{contentPostId}`
Soft-delete content post (status becomes `Archived`).

Response: `204 No Content`

---

## 6) Publication Endpoints
Route base: `api/teams/{teamId}`
Authorization: required

### `POST /api/teams/{teamId}/content-posts/{contentPostId}/publications`
Queue an immediate publication.

Request (`PublishPublicationDto`):
```json
{
  "socialAccountId": 1,
  "postVariantId": null,
  "idempotencyKey": "optional-client-key"
}
```

Response: `202 Accepted` (`PublicationResponseDto`)

### `POST /api/teams/{teamId}/content-posts/{contentPostId}/publications/scheduled`
Schedule a publication.

Request (`SchedulePublicationDto`):
```json
{
  "socialAccountId": 1,
  "postVariantId": null,
  "scheduledAt": "2026-04-12T15:30:00Z",
  "idempotencyKey": "optional-client-key"
}
```

Response: `202 Accepted` (`PublicationResponseDto`)

### `GET /api/teams/{teamId}/publications/{publicationId}/analytics`
Get publication analytics snapshots.

Response: `200 OK` (`List<PublicationAnalyticsResponseDto>`)

---

## 7) Campaign Endpoints
Route base: `api/teams/{teamId}/campaigns`
Authorization: required

### `CampaignStatus` enum
- `Draft`
- `Active`
- `Paused`
- `Completed`
- `Archived`

### `POST /api/teams/{teamId}/campaigns`
Create campaign.

Request (`CreateCampaignDto`):
```json
{
  "name": "Q2 Product Launch",
  "description": "Cross-channel launch campaign",
  "channelId": 12,
  "status": "Draft"
}
```

Response: `201 Created` (`CampaignResponseDto`)

`channelId` is required and must exist in the provided team scope.

### `GET /api/teams/{teamId}/campaigns`
List team campaigns.

Response: `200 OK` (`List<CampaignResponseDto>`)

### `GET /api/teams/{teamId}/campaigns/{campaignId}`
Get campaign by id.

Response: `200 OK` (`CampaignResponseDto`)

### `PUT /api/teams/{teamId}/campaigns/{campaignId}`
Update campaign.

Request (`UpdateCampaignDto`):
```json
{
  "name": "Q2 Product Launch Updated",
  "description": "Updated description",
  "channelId": 12,
  "status": "Active"
}
```

Response: `200 OK` (`CampaignResponseDto`)

### `DELETE /api/teams/{teamId}/campaigns/{campaignId}`
Soft-delete campaign.

Response: `204 No Content`

### `POST /api/teams/{teamId}/campaigns/{campaignId}/content-post-links`
Link a content post to campaign.

Request (`LinkCampaignContentPostDto`):
```json
{
  "contentPostId": 1
}
```

Response: `204 No Content`

### `DELETE /api/teams/{teamId}/campaigns/{campaignId}/content-post-links/{contentPostId}`
Unlink a content post from campaign.

Response: `204 No Content`

Validation behavior:
- `403 Forbidden`: requester is not a team member or lacks Admin/Editor role for mutation endpoints.
- `404 Not Found`: campaign does not exist in provided team scope.
- `404 Not Found`: provided `channelId` does not exist in provided team scope.
- `404 Not Found`: content post does not exist in provided team scope.
- `400 Bad Request`: duplicate campaign-content post link attempt.

---

## Manual Test Flow (Swagger)
1. Run API.
2. Open Swagger (`/swagger`).
3. Register user.
4. Login and copy `accessToken`.
5. Authorize by pasting raw `accessToken` in Swagger (do not include `Bearer ` prefix).
6. Copy `teamId` from auth response.
7. (Optional) complete onboarding name via `PUT /api/Team/{teamId}/name` if `isTeamNameSetupRequired=true`.
8. Create a channel via `POST /api/teams/{teamId}/channels`.
9. Create a social account via `POST /api/teams/{teamId}/social-accounts`.
10. Create content post via `POST /api/teams/{teamId}/content-posts`.
11. Verify with list/get endpoints.
12. Update content post.
13. Transition to `Review` (then `Approved`) with `POST /api/teams/{teamId}/content-posts/{id}/workflow/transition`.
14. Schedule with `POST /api/teams/{teamId}/content-posts/{id}/workflow/schedule`.
15. Publish with `POST /api/teams/{teamId}/content-posts/{id}/workflow/publish`.
16. Delete content post and verify it no longer appears in list.
17. Create campaign via `POST /api/teams/{teamId}/campaigns` (optionally include `channelId`).
18. Link/unlink a content post using campaign link endpoints.

## Hangfire Dashboard (Development)
- `GET /hangfire` (development only)
- Shows recurring job `publish-scheduled-variants` that processes scheduled post variants every minute.
- Shows recurring job `sync-publication-analytics` that syncs analytics snapshots hourly.

## Database Verification
Check these tables in PostgreSQL:
- `Teams`
- `UserTeams`
- `Channels`
- `SocialAccounts`
- `ContentPosts`
- `PostVariants`
- `Campaigns`
- `RefreshTokens`
- `PostPublications`
- `PublishJobs`
- `PublicationAnalytics`
- `__EFMigrationsHistory`

For migration state:
```sql
SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
