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
5. Use protected endpoints (`/api/Team/*`, `/api/teams/{teamId}/content-posts/*`)

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

## 3) Content Post Endpoints
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
8. Create content post via `POST /api/teams/{teamId}/content-posts`.
9. Verify with list/get endpoints.
10. Update content post.
11. Delete content post and verify it no longer appears in list.

## Database Verification
Check these tables in PostgreSQL:
- `Teams`
- `UserTeams`
- `ContentPosts`
- `PostVariants`
- `RefreshTokens`
- `__EFMigrationsHistory`

For migration state:
```sql
SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId";
```
