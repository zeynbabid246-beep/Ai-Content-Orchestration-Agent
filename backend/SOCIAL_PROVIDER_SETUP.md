# Social Provider Setup (LinkedIn + Instagram)

## LinkedIn

- Create a LinkedIn app and enable Sign In with LinkedIn + Share on LinkedIn.
- Configure scopes:
  - `w_member_social`
  - `openid`
  - `profile`
  - `email`
- Ensure the redirect URI exactly matches `LinkedIn:RedirectUri`.
- Set in `backend/.env` (see `.env.example`):
  - `LinkedIn__ClientId`
  - `LinkedIn__ClientSecret`
  - `LinkedIn__RedirectUri`

## Facebook (via Meta)

- Use a Meta app in live mode with a Facebook Login product.
- Request/enable permissions:
  - `pages_show_list`
  - `pages_manage_posts`
  - `pages_read_engagement`
- Ensure redirect URI exactly matches `Meta:RedirectUri` (e.g. `http://localhost:5073/api/auth/facebook/callback`).
- Set in `backend/.env`:
  - `Meta__AppId`
  - `Meta__AppSecret`
  - `Meta__RedirectUri`
  - `Meta__GraphApiVersion` (optional, defaults to `v22.0`; or keep in `appsettings.json`)

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
- Required in `backend/.env`: `Instagram__RedirectUri`
- Optional (only if you use a second Meta app): `Instagram__AppId`, `Instagram__AppSecret`. If omitted or invalid, the API falls back to `Meta__AppId` / `Meta__AppSecret`.
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

## Threads (via Meta)

- Create a [Threads app](https://developers.facebook.com/apps/) and add the **Threads API** use case (not only Facebook Login).
- Request/enable permissions:
  - `threads_basic`
  - `threads_content_publish`
- **Whitelist the redirect URI in the Threads API settings** (this is separate from Facebook Login OAuth settings):
  1. Open [Meta Developers](https://developers.facebook.com/apps/) → your app.
  2. Go to **Use cases** → **Access the Threads API** → **Settings**  
     (URL pattern: `https://developers.facebook.com/apps/{APP_ID}/use_cases/customize/?use_case_enum=THREADS_API`)
  3. Set **Redirect callback URL** to exactly:  
     `https://localhost:7075/api/auth/threads/callback`
  4. Also fill **Uninstall** and **Delete** callback URLs (Meta may not save the form until all three are set). For local dev you can reuse the same HTTPS callback URL.
  5. Click **Save**.
- Add your Threads account as a **Threads Tester** (see below) — required while the app is in Development mode.
- Set in `backend/.env` (must match the Meta dashboard value character-for-character):
  - `Threads__AppId`
  - `Threads__AppSecret`
  - `Threads__RedirectUri` = `https://localhost:7075/api/auth/threads/callback`
- Threads OAuth **requires HTTPS** — `http://` redirect URIs are blocked by Meta (error `1349187`).
- If Meta shows **URL Blocked / error 1349168**, the redirect URI above is missing from **Threads API → Settings**, or the form did not save.
- If Meta shows **error 1349245** (“user has not accepted the invite to test the app”), complete the tester flow below.
- Trust the dev certificate once: `dotnet dev-certs https --trust`
- The API default profile listens on both `https://localhost:7075` and `http://localhost:5073`; the frontend can keep using HTTP for normal API calls.

### Accept the Threads tester invite (error 1349245)

While the app is in **Development** mode, only invited **Threads Testers** can connect — being the app admin is not enough.

1. In [Meta Developers](https://developers.facebook.com/apps/) → your app → **App roles** → **Roles** (or Threads use case → **Add or remove Threads testers**).
2. Click **Add people** → choose **Threads Tester** → enter the **Threads username** (not Facebook name) you will log in with → send invite.
3. On that same Threads account, open **Threads** (mobile app or [threads.net](https://www.threads.net)):
   - **Settings** → **Account** → **Website permissions**
   - Open the **Invites** tab
   - **Accept** the invite for your app
4. In Meta Developers, confirm the tester status is no longer **Pending**.
5. Retry **Connect Threads** in AiContentFlow — you must log in with the **same Threads account** that accepted the invite.

**Common mistakes:** inviting a Facebook account instead of a Threads profile; accepting on a different Threads account than the one used during OAuth; looking for the invite in Instagram/Facebook instead of Threads → Website permissions.

### Threads local dev fallback (if `localhost` is rejected)

Meta’s [Threads API sample](https://github.com/fbsamples/threads_api) uses a custom host instead of `localhost`:

1. Add to `C:\Windows\System32\drivers\etc\hosts`: `127.0.0.1 threads-dev.local`
2. Install [mkcert](https://github.com/FiloSottile/mkcert), then: `mkcert -install` and `mkcert threads-dev.local`
3. Set `Threads:RedirectUri` and Meta **Redirect callback URL** to:  
   `https://threads-dev.local:7075/api/auth/threads/callback`
4. Configure Kestrel to use the mkcert PEM files (see Meta sample README).

## Threads publishing

- Text-only posts are supported (max 500 characters).
- Optional image posts require a **publicly reachable** image URL; set `App:PublicMediaBaseUrl` for localhost uploads.
- Publishing uses the same Hangfire job as other platforms.
