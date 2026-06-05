namespace AiContentFlow.Application.Common.Email;

public static class AuthEmailTemplates
{
    public static string PasswordReset(string resetLink) =>
        $"""
        <html><body style="font-family:Arial,sans-serif;color:#111;">
        <h2>Reset your password</h2>
        <p>We received a request to reset your AiContentFlow password.</p>
        <p><a href="{resetLink}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
        <p style="color:#666;font-size:12px;">This link expires in 24 hours.</p>
        </body></html>
        """;

    public static string TeamInvite(string teamName, string role, string inviterRole, string link, string ctaText, string message) =>
        $"""
        <html><body style="font-family:Arial,sans-serif;color:#111;">
        <h2>Team invitation</h2>
        <p>You have been invited to join <strong>{teamName}</strong> as <strong>{role}</strong>.</p>
        <p>{message}</p>
        <p>Invited by a team {inviterRole}.</p>
        <p><a href="{link}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">{ctaText}</a></p>
        </body></html>
        """;
}
