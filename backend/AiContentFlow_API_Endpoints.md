# AiContentFlow API Endpoints (Frontend Contract)

This document is the frontend-facing API contract for the current backend implementation.

## Base URL
- Local API: `http://localhost:5073`
- All routes are under `/api`

## Authentication Basics
- Protected endpoints require `Authorization: Bearer <accessToken>`.
- Access/refresh tokens come from:
  - `POST /api/Auth/register`
  - `POST /api/Auth/login`
  - `POST /api/Auth/refresh`

## Enum Serialization Rule
- API accepts and returns enum values as **strings only**.
- Example: `"LinkedIn"`, `"Approved"`, `"Active"`.
- Numeric enum payloads are rejected.

## Standard Error Shape
```json
{
  "message": "Error message",
  "errors": []
}
```

## Status Code Conventions
- `200` success reads/updates
- `201` created resources
- `202` accepted async publication requests
- `204` no content for successful delete/link actions
- `400` invalid input or domain rule violation
- `401` unauthenticated (or auth-route unauthorized)
- `403` authenticated but forbidden
- `404` team-scoped resource not found

---

## Frontend OAuth Flow (Important)

Supported social OAuth platforms:
- `facebook`
- `linkedin`

Currently excluded:
- `instagram` (intentionally disabled until full support exists)

### 1) Get provider URL
`GET /api/auth/{platform}/login?teamId={teamId}&channelId={channelId}`

- Auth: required
- Returns JSON:
```json
{
  "teamId": "00000000-0000-0000-0000-000000000000",
  "channelId": 1,
  "platform": "facebook",
  "authorizationUrl": "https://provider-oauth-url..."
}
```

Frontend should:
1. call login endpoint,
2. read `authorizationUrl`,
3. redirect browser to that URL.

### 2) Provider callback
`GET /api/auth/{platform}/callback?code=...&state=...`

- Auth: anonymous (provider redirects browser here)
- Backend validates signed state and persists accounts/tokens.
- Backend redirects user to `SocialAuth:FrontendRedirectUrl` with query params:
  - success:
    - `socialAuthStatus=success`
    - `platform={platform}`
  - failure:
    - `socialAuthStatus=error`
    - `platform={platform}`
    - `socialAuthError=<message>`

Frontend should:
1. parse query params after returning to app,
2. show success/error toast,
3. refetch social accounts list,
4. clear params from URL.

---

## 1) Auth Endpoints
Route base: `api/Auth`

### POST `/api/Auth/register`
Request:
```json
{
  "username": "ousse",
  "email": "ousse@example.com",
  "password": "P@ssw0rd123",
  "teamName": "Product and Growth"
}
```

Response `200` (`AuthResponseDto`):
```json
{
  "userId": "string",
  "username": "string",
  "email": "string",
  "teamId": "00000000-0000-0000-0000-000000000000",
  "teamRole": "Admin",
  "isTeamNameSetupRequired": false,
  "accessToken": "jwt",
  "refreshToken": "token"
}
```

### POST `/api/Auth/login`
Request:
```json
{
  "email": "ousse@example.com",
  "username": null,
  "password": "P@ssw0rd123"
}
```
Response: same shape as register (`AuthResponseDto`).

### POST `/api/Auth/refresh`
Request:
```json
{
  "refreshToken": "token"
}
```
Response: same shape as register (`AuthResponseDto`).

---

## 2) Team Endpoints
Route base: `api/Team`
Auth: required

### POST `/api/Team`
Create team.

Request:
```json
{
  "name": "Product Team"
}
```

Response `201` (`TeamResponseDto`):
```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "name": "Product Team",
  "createdAt": "2026-05-08T10:00:00Z",
  "memberCount": 1
}
```

### PUT `/api/Team/{teamId}/name`
Request:
```json
{
  "name": "Final Team Name"
}
```
Response `200` (`TeamResponseDto`).

### GET `/api/Team/{teamId}/members`
Response `200` (`TeamMemberDto[]`):
```json
[
  {
    "userId": "string",
    "username": "string",
    "role": "Admin",
    "joinedAt": "2026-05-08T10:00:00Z"
  }
]
```

### POST `/api/Team/{teamId}/invite`
Request:
```json
{
  "username": "other-user",
  "role": "Viewer"
}
```
Response: `204`

### PUT `/api/Team/{teamId}/members/role`
Request:
```json
{
  "targetUserId": "user-id",
  "role": "Editor"
}
```
Response: `204`

### DELETE `/api/Team/{teamId}/members/{targetUserId}`
Response: `204`

---

## 3) Channel Endpoints
Route base: `api/teams/{teamId}/channels`
Auth: required

### POST `/api/teams/{teamId}/channels`
Request:
```json
{
  "name": "LinkedIn",
  "description": "B2B channel",
  "branding": {
    "logoUrl": null,
    "theme": "dark",
    "slogan": null,
    "tone": "professional"
  },
  "config": {
    "settingsJson": "{\"timezone\":\"UTC\"}"
  }
}
```
Response `201` (`ChannelResponseDto`)

### GET `/api/teams/{teamId}/channels`
Response `200` (`ChannelResponseDto[]`)

### GET `/api/teams/{teamId}/channels/{channelId}`
Response `200` (`ChannelResponseDto`)

### PUT `/api/teams/{teamId}/channels/{channelId}`
Request shape: same as create.
Response `200` (`ChannelResponseDto`)

### DELETE `/api/teams/{teamId}/channels/{channelId}`
Response: `204`

---

## 4) Social Account Endpoints
Route base: `api/teams/{teamId}/social-accounts`
Auth: required

Mutation permissions:
- `Admin` and `Editor`

### POST `/api/teams/{teamId}/social-accounts`
Request:
```json
{
  "channelId": 1,
  "platform": "LinkedIn",
  "accountHandle": "@brand",
  "displayName": "Brand Page",
  "externalAccountId": "abc123"
}
```

Response `201` (`SocialAccountResponseDto`):
```json
{
  "id": 1,
  "teamId": "00000000-0000-0000-0000-000000000000",
  "channelId": 1,
  "platform": "LinkedIn",
  "status": "Active",
  "accountHandle": "@brand",
  "displayName": "Brand Page",
  "externalAccountId": "abc123",
  "createdAt": "2026-05-08T10:00:00Z",
  "updatedAt": "2026-05-08T10:00:00Z"
}
```

### GET `/api/teams/{teamId}/social-accounts`
Response `200` (`SocialAccountResponseDto[]`)

### GET `/api/teams/{teamId}/social-accounts/{socialAccountId}`
Response `200` (`SocialAccountResponseDto`)

### PUT `/api/teams/{teamId}/social-accounts/{socialAccountId}`
Request:
```json
{
  "channelId": 1,
  "platform": "Facebook",
  "status": "Active",
  "accountHandle": "My Page",
  "displayName": "My Page",
  "externalAccountId": "1234567890"
}
```
Response `200` (`SocialAccountResponseDto`)

### DELETE `/api/teams/{teamId}/social-accounts/{socialAccountId}`
Response: `204`

---

## 5) Content Post Endpoints
Route base: `api/teams/{teamId}/content-posts`
Auth: required

### Relevant enums for frontend
- `ContentType`: `BlogPost`, `TwitterThread`, `LinkedInPost`, `InstagramPost`, `FacebookPost`
- `ContentStatus`: `Draft`, `Review`, `Approved`, `Scheduled`, `Published`, `Archived`
- `SocialPlatform`: `Facebook`, `LinkedIn`, `Instagram`, `X`, `Threads`, `TikTok`

### POST `/api/teams/{teamId}/content-posts`
Request (`CreateContentPostDto`):
```json
{
  "channelId": 1,
  "campaignId": null,
  "title": "Launch",
  "contentType": "LinkedInPost",
  "contentJson": "{\"text\":\"Hello\"}",
  "prompt": "generate launch post",
  "aiModel": "gpt-4o",
  "aiTokens": 120,
  "postVariants": [
    {
      "platform": "LinkedIn",
      "contentJson": "{\"text\":\"variant\"}",
      "title": "Variant 1"
    }
  ]
}
```
Response `201` (`ContentPostResponseDto`)

### GET `/api/teams/{teamId}/content-posts`
Response `200` (`ContentPostResponseDto[]`)

### GET `/api/teams/{teamId}/content-posts/{contentPostId}`
Response `200` (`ContentPostResponseDto`)

### PUT `/api/teams/{teamId}/content-posts/{contentPostId}`
Request (`UpdateContentPostDto`): same fields as create plus:
- `status` (required)

Response `200` (`ContentPostResponseDto`)

### POST `/api/teams/{teamId}/content-posts/{contentPostId}/workflow/transition`
Request:
```json
{
  "status": "Review"
}
```
Response `200` (`ContentPostResponseDto`)

### POST `/api/teams/{teamId}/content-posts/{contentPostId}/workflow/schedule`
Request:
```json
{
  "socialAccountId": 1,
  "postVariantId": null,
  "scheduledAt": "2026-05-09T14:30:00Z",
  "idempotencyKey": "optional-key"
}
```
Response `200` (`ContentPostResponseDto`)

Scheduling/publish guards:
- content must be publishable (`Approved` or `Scheduled`)
- social account must be active
- platform must be supported for publishing (`Facebook`, `LinkedIn`)
- token must be non-expired

### POST `/api/teams/{teamId}/content-posts/{contentPostId}/workflow/publish`
Request:
```json
{
  "socialAccountId": 1,
  "postVariantId": null,
  "idempotencyKey": "optional-key"
}
```
Response `200` (`ContentPostResponseDto`)

### DELETE `/api/teams/{teamId}/content-posts/{contentPostId}`
Response: `204`

---

## 6) Publication Endpoints
Route base: `api/teams/{teamId}`
Auth: required

### POST `/api/teams/{teamId}/content-posts/{contentPostId}/publications`
Request:
```json
{
  "socialAccountId": 1,
  "postVariantId": null,
  "idempotencyKey": "optional-key"
}
```
Response `202` (`PublicationResponseDto`)

### POST `/api/teams/{teamId}/content-posts/{contentPostId}/publications/scheduled`
Request:
```json
{
  "socialAccountId": 1,
  "postVariantId": null,
  "scheduledAt": "2026-05-09T14:30:00Z",
  "idempotencyKey": "optional-key"
}
```
Response `202` (`PublicationResponseDto`)

### GET `/api/teams/{teamId}/publications/{publicationId}/analytics`
Response `200` (`PublicationAnalyticsResponseDto[]`)

Publication status values:
- `Scheduled`, `Queued`, `Publishing`, `Published`, `Failed`, `Retrying`, `Cancelled`

---

## 7) Campaign Endpoints
Route base: `api/teams/{teamId}/campaigns`
Auth: required

`CampaignStatus`:
- `Draft`, `Active`, `Paused`, `Completed`, `Archived`

### POST `/api/teams/{teamId}/campaigns`
Request:
```json
{
  "name": "Q2 Launch",
  "description": "Cross-channel campaign",
  "channelId": 1,
  "status": "Draft"
}
```
Response `201` (`CampaignResponseDto`)

### GET `/api/teams/{teamId}/campaigns`
Response `200` (`CampaignResponseDto[]`)

### GET `/api/teams/{teamId}/campaigns/{campaignId}`
Response `200` (`CampaignResponseDto`)

### PUT `/api/teams/{teamId}/campaigns/{campaignId}`
Request shape: same as create.
Response `200` (`CampaignResponseDto`)

### DELETE `/api/teams/{teamId}/campaigns/{campaignId}`
Response: `204`

### POST `/api/teams/{teamId}/campaigns/{campaignId}/content-post-links`
Request:
```json
{
  "contentPostId": 123
}
```
Response: `204`

### DELETE `/api/teams/{teamId}/campaigns/{campaignId}/content-post-links/{contentPostId}`
Response: `204`

---

## Frontend Implementation Notes

### Token refresh behavior
- On `401`, frontend should call refresh endpoint and retry once.
- If refresh fails, clear auth state and redirect to login.

### Team scoping
- Most routes are team-scoped and require `teamId` in URL.
- Frontend should always source `teamId` from auth/session context.

### OAuth callback handling checklist
1. Detect `socialAuthStatus` in URL.
2. Show user feedback.
3. Refetch social accounts.
4. Remove callback params from URL (history replace).

### Required configuration keys
- `Jwt:Secret`, `Jwt:Issuer`, `Jwt:Audience`
- `ConnectionStrings:DefaultConnection`
- `SocialAuth:FrontendRedirectUrl`
- `SocialAuth:StateSecret` (optional; falls back to `Jwt:Secret`)
- `SocialAuth:CredentialSecret` (optional; falls back to `Jwt:Secret`)
- `Meta:AppId`, `Meta:AppSecret`, `Meta:RedirectUri`, `Meta:GraphApiVersion`
- `LinkedIn:ClientId`, `LinkedIn:ClientSecret`, `LinkedIn:RedirectUri`
