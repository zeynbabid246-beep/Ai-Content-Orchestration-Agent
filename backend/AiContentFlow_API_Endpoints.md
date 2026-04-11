# AiContentFlow API Endpoints Guide

## Base URL
- Local HTTP: `http://localhost:5073`
- If using `--no-launch-profile`, ASP.NET may use `http://localhost:5000`

## Authentication Overview
1. Register a user with `POST /api/Auth/register`
2. Login with `POST /api/Auth/login`
3. Copy `accessToken`
4. In Swagger, click **Authorize** and set:
   - `Bearer <accessToken>`
5. Use protected endpoints (`/api/Team/*`, `/api/teams/{teamId}/channels/*`, `/api/teams/{teamId}/social-accounts/*`, `/api/teams/{teamId}/content-posts/*`, `/api/teams/{teamId}/campaigns/*`)

## Standard Error Shape
From global exception middleware:
```json
{
  "message": "Error message",
  "errors": []
}
```

---

## 1) Auth Endpoints
Route base: `api/Auth`

### `POST /api/Auth/register`
Create a user account.

Request:
```json
{
  "username": "ousse",
  "email": "ousse@example.com",
  "password": "P@ssw0rd123"
}
```

Response: `200 OK` (`AuthResponseDto`)
```json
{
  "userId": "...",
  "username": "ousse",
  "email": "ousse@example.com",
  "accessToken": "...",
  "refreshToken": "..."
}
```

### `POST /api/Auth/login`
Login with email + password.

Request:
```json
{
  "email": "ousse@example.com",
  "password": "P@ssw0rd123"
}
```

Response: `200 OK` (`AuthResponseDto`)

### `POST /api/Auth/refresh`
Refresh access token using refresh token.

Request:
```json
{
  "refreshToken": "..."
}
```

Response: `200 OK` (`AuthResponseDto`)

---

## 2) Team Endpoints
Route base: `api/Team` (from `TeamController`)
Authorization: required

### `POST /api/Team`
Create a team.

Request (`CreateTeamDto`):
```json
{
  "name": "Marketing Team"
}
```

Response: `201 Created` (`TeamResponseDto`)
```json
{
  "id": "...guid...",
  "name": "Marketing Team",
  "createdAt": "2026-04-08T10:00:00Z",
  "memberCount": 1
}
```

### `GET /api/Team/{teamId}/members`
Get team members.

Response: `200 OK` (`List<TeamMemberDto>`)
```json
[
  {
    "userId": "...",
    "username": "ousse",
    "role": "Owner",
    "joinedAt": "2026-04-08T10:00:00Z"
  }
]
```

### `POST /api/Team/{teamId}/invite`
Invite/add user to team.

Request (`InviteUserDto`):
```json
{
  "username": "otherUser",
  "role": "Viewer"
}
```

Response: `204 No Content`

---

## 6) Campaign Endpoints
Route base: `api/teams/{teamId}/campaigns`
Authorization: required

### `CampaignStatus` enum
- `0` Draft
- `1` Active
- `2` Paused
- `3` Completed
- `4` Archived

### `POST /api/teams/{teamId}/campaigns`
Create campaign.

Request (`CreateCampaignDto`):
```json
{
  "name": "Q2 Product Launch",
  "description": "Cross-channel launch campaign",
  "status": 0
}
```

Response: `201 Created` (`CampaignResponseDto`)

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
  "status": 1
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
- `403 Forbidden`: requester is not a team member or lacks Owner/Admin role for mutation endpoints.
- `404 Not Found`: campaign does not exist in provided team scope.
- `404 Not Found`: content post does not exist in provided team scope.
- `400 Bad Request`: duplicate campaign-content post link attempt.

### `PUT /api/Team/{teamId}/members/role`
Update member role.

Request (`UpdateMemberRoleDto`):
```json
{
  "targetUserId": "<user-id>",
  "role": "Admin"
}
```

Response: `204 No Content`

### `DELETE /api/Team/{teamId}/members/{targetUserId}`
Remove member from team.

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

### `POST /api/teams/{teamId}/social-accounts`
Create a social account.

Request (`CreateSocialAccountDto`):
```json
{
  "channelId": 1,
  "platform": 1,
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
  "platform": 1,
  "status": 0,
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
- `0` BlogPost
- `1` TwitterThread
- `2` LinkedInPost
- `3` InstagramPost
- `4` FacebookPost

`ContentStatus`
- `0` Draft
- `1` Ready
- `2` Scheduled
- `3` Published
- `4` Deleted

`SocialPlatform`
- `0` Facebook
- `1` LinkedIn
- `2` Instagram
- `3` X
- `4` Threads
- `5` TikTok

### `POST /api/teams/{teamId}/content-posts`
Create content post.

Request (`CreateContentPostDto`):
```json
{
  "channelId": 1,
  "socialAccountId": 1,
  "title": "AI launch post",
  "contentType": 2,
  "contentJson": "{\"text\":\"Hello LinkedIn\"}",
  "prompt": "Create a linkedin launch post",
  "aiModel": "gpt-4o",
  "aiTokens": 120,
  "postVariants": [
    {
      "platform": 1,
      "contentJson": "{\"text\":\"LinkedIn variant\"}",
      "title": "LinkedIn version"
    }
  ]
}
```

Response: `201 Created` (`ContentPostResponseDto`)

Validation behavior for create/update:
- `403 Forbidden`: requester is not a member of the team or lacks required role to create/update.
- `404 Not Found`: `ChannelId` does not exist in the provided `teamId`.
- `404 Not Found`: `SocialAccountId` does not exist in the provided `teamId`.
- `400 Bad Request`: `SocialAccountId` exists but belongs to a different `ChannelId` than the one sent in the content post request.
- `400 Bad Request`: invalid lifecycle transition (allowed chain is `Draft -> Ready -> Scheduled -> Published`).

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
  "socialAccountId": 1,
  "title": "AI launch post updated",
  "contentType": 2,
  "contentJson": "{\"text\":\"Updated text\"}",
  "status": 1,
  "prompt": "Refine tone",
  "aiModel": "gpt-4o",
  "aiTokens": 140,
  "postVariants": [
    {
      "platform": 1,
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
  "status": 1
}
```

Response: `200 OK` (`ContentPostResponseDto`)

Rules:
- Allowed transitions are explicit and forward-only:
  - `Draft -> Ready`
  - `Ready -> Scheduled`
  - `Scheduled -> Published`
- Use workflow-specific endpoints for scheduling and publishing actions.

### `POST /api/teams/{teamId}/content-posts/{contentPostId}/workflow/schedule`
Schedule a content post.

Request (`ScheduleContentPostDto`):
```json
{
  "scheduledAt": "2026-04-12T15:30:00Z"
}
```

Response: `200 OK` (`ContentPostResponseDto`)

Scheduling rules:
- `scheduledAt` must be UTC (`Z` suffix).
- `scheduledAt` must be in the future.
- Valid lifecycle transition must be satisfied (`Ready -> Scheduled`).

### `POST /api/teams/{teamId}/content-posts/{contentPostId}/workflow/publish`
Manually publish a scheduled content post.

Request (`PublishContentPostDto`):
```json
{
  "platformPostId": "platform-123",
  "platformPostUrl": "https://social.example/post/123"
}
```

Response: `200 OK` (`ContentPostResponseDto`)

Publish rules:
- Valid lifecycle transition must be satisfied (`Scheduled -> Published`).
- `publishedAt` is set at execution time.
- `platformPostId` / `platformPostUrl` are optional metadata fields.

Workflow error behavior:
- `403 Forbidden`: requester is not team member or lacks `Owner/Admin` role for workflow mutations.
- `404 Not Found`: team-scoped content post does not exist.
- `400 Bad Request`: invalid lifecycle transition or invalid scheduling input.

### `DELETE /api/teams/{teamId}/content-posts/{contentPostId}`
Soft-delete content post (status becomes `Deleted`).

Response: `204 No Content`

---

## Manual Test Flow (Swagger)
1. Run API.
2. Open Swagger (`/swagger`).
3. Register user.
4. Login and copy `accessToken`.
5. Authorize with `Bearer <accessToken>`.
6. Create team via `POST /api/Team`.
7. Copy `teamId` from response.
8. Create a channel via `POST /api/teams/{teamId}/channels`.
9. Create a social account via `POST /api/teams/{teamId}/social-accounts`.
10. Create content post via `POST /api/teams/{teamId}/content-posts`.
11. Verify with list/get endpoints.
12. Update content post.
13. Transition to `Ready` with `POST /api/teams/{teamId}/content-posts/{id}/workflow/transition`.
14. Schedule with `POST /api/teams/{teamId}/content-posts/{id}/workflow/schedule`.
15. Publish with `POST /api/teams/{teamId}/content-posts/{id}/workflow/publish`.
16. Delete content post and verify it no longer appears in list.
17. Create campaign via `POST /api/teams/{teamId}/campaigns`.
18. Link/unlink a content post using campaign link endpoints.

## Database Verification
Check these tables in PostgreSQL:
- `Teams`
- `UserTeams`
- `Channels`
- `SocialAccounts`
- `ContentPosts`
- `PostVariants`
- `Campaigns`
- `CampaignContentPosts`
- `RefreshTokens`
- `__EFMigrationsHistory`

For migration state:
```sql
SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```
