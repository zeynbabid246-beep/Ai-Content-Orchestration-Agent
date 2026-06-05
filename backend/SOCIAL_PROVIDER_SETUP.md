# Social Provider Setup (LinkedIn + Instagram)

## LinkedIn

- Create a LinkedIn app and enable Sign In with LinkedIn + Share on LinkedIn.
- Configure scopes:
  - `w_member_social`
  - `openid`
  - `profile`
  - `email`
- Ensure the redirect URI exactly matches `LinkedIn:RedirectUri`.
- Set environment variables (or secrets):
  - `LinkedIn:ClientId`
  - `LinkedIn:ClientSecret`
  - `LinkedIn:RedirectUri`

## Facebook (via Meta)

- Use a Meta app in live mode with a Facebook Login product.
- Request/enable permissions:
  - `pages_show_list`
  - `pages_manage_posts`
  - `pages_read_engagement`
- Ensure redirect URI exactly matches `Meta:RedirectUri` (e.g. `http://localhost:5073/api/auth/facebook/callback`).
- Set user secrets:
  - `Meta:AppId`
  - `Meta:AppSecret`
  - `Meta:RedirectUri`
  - `Meta:GraphApiVersion` (optional, defaults to `v22.0`)

## Instagram (via Meta)

- Instagram connect uses **Facebook Login** on a [Meta app](https://developers.facebook.com/apps/) (same app as Facebook is fine).
- Link Instagram Business/Creator account to a Facebook Page.
- Request/enable permissions:
  - `instagram_basic`
  - `instagram_content_publish`
  - `pages_show_list`
  - `pages_manage_posts`
  - `pages_read_engagement`
  - `pages_manage_metadata`
  - `business_management` (required when the Page lives in Meta Business Suite)
- On that Meta app, add **Valid OAuth Redirect URI**: `http://localhost:5073/api/auth/instagram/callback` (must match `Instagram:RedirectUri` exactly).
- Required user secret: `Instagram:RedirectUri`
- Optional (only if you use a second Meta app): `Instagram:AppId`, `Instagram:AppSecret`. If omitted or invalid, the API falls back to `Meta:AppId` / `Meta:AppSecret`.
- Do **not** use Instagram Basic Display IDs or non-numeric IDs — Meta will show “Invalid app ID”.

## Troubleshooting checklist

- Redirect URI mismatch: check provider app and backend config values are identical.
- Missing permission/scope: verify app review and approved scopes.
- Instagram account not found:
  - Instagram must be **Business or Creator** (not personal) and linked to the Facebook Page (Page settings → Linked accounts).
  - During OAuth, grant access to **all** Pages Meta prompts for.
  - If the Page is in **Meta Business Suite**, enable `business_management` on the app (Development: add as Standard access + test users; Production: App Review).
  - Check API logs for `Fetched N Facebook page(s)` — if N is 0, the token cannot see your Pages yet.

## Instagram publishing

- Posts **must include an image** (Instagram Graph API does not publish text-only).
- Uploaded images stored under `/uploads/...` on localhost are staged via the linked Facebook Page automatically.
- For production, set `App:PublicMediaBaseUrl` to your public API origin (e.g. `https://api.yourdomain.com`) if media URLs must be reachable without staging.
- Publishing runs via Hangfire (`PublishScheduledVariantsJob` every minute). Check `/hangfire` and publication `errorMessage` if a post stays queued.
- Publishing fails due to token: reconnect account and validate token expiry handling.
