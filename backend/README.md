# AiContentFlow Backend

ASP.NET Core API for content operations, publishing, and AI integration.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- PostgreSQL (local or remote)
- Optional: Python AI backend — see [AI_BACKEND_SETUP.md](AI_BACKEND_SETUP.md)

## Local setup

1. Copy environment template and fill in secrets:

   ```bash
   cp .env.example .env
   ```

   See [.env.example](.env.example) for all keys (database, JWT, social OAuth, optional AI/SMTP).

2. Copy non-secret app settings:

   ```bash
   cp AiContentFlow.API/appsettings.example.json AiContentFlow.API/appsettings.json
   ```

3. Run the API:

   ```bash
   dotnet run --project AiContentFlow.API
   ```

   - HTTP: `http://localhost:5073`
   - HTTPS: `https://localhost:7075` (required for Threads OAuth)
   - Swagger: `http://localhost:5073/swagger`

4. Run frontend (from `frontend/`):

   ```bash
   cp .env.example .env
   npm install && npm run dev
   ```

## Email (optional)

For password reset and team invitation emails, set SMTP values in `backend/.env`:

```
EmailSettings__SmtpServer=smtp.gmail.com
EmailSettings__SmtpPort=587
EmailSettings__SenderName=AiContentFlow
EmailSettings__SenderEmail=noreply@yourdomain.com
EmailSettings__Username=noreply@yourdomain.com
EmailSettings__Password=your-app-password
App__FrontendBaseUrl=http://localhost:5173
```

## Documentation

| Doc | Purpose |
|-----|---------|
| [AiContentFlow_API_Endpoints.md](AiContentFlow_API_Endpoints.md) | Frontend API contract |
| [AI_BACKEND_SETUP.md](AI_BACKEND_SETUP.md) | Python AI service integration |
| [SOCIAL_PROVIDER_SETUP.md](SOCIAL_PROVIDER_SETUP.md) | OAuth setup (LinkedIn, Meta, Instagram, Threads) |
