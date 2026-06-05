# Email and frontend URL configuration

## App:FrontendBaseUrl

Used for password reset links and team invitation emails.

```json
"App": {
  "FrontendBaseUrl": "http://localhost:5173"
}
```

In production, set this to your deployed SPA origin (e.g. `https://app.yourdomain.com`).

## EmailSettings (SMTP)

```json
"EmailSettings": {
  "SmtpServer": "smtp.gmail.com",
  "SmtpPort": 587,
  "SenderName": "AiContentFlow",
  "SenderEmail": "noreply@yourdomain.com",
  "Username": "noreply@yourdomain.com",
  "Password": "app-specific-password"
}
```

Copy `AiContentFlow.API/appsettings.example.json` to `appsettings.Development.json` and fill in values locally (do not commit secrets).

Emails are sent for:

- Password reset (`POST /api/Auth/forgot-password`)
- Team invitations (existing and pending users)
