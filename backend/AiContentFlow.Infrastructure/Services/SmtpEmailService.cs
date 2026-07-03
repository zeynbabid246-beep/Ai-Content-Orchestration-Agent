using AiContentFlow.Application.Common.Interfaces;
using AiContentFlow.Application.Common.Models;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace AiContentFlow.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;

    public SmtpEmailService(IOptions<EmailSettings> emailSettings)
    {
        _emailSettings = emailSettings.Value;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
    {
        // Gmail app passwords are displayed with spaces for readability but must be
        // sent to the SMTP server without them.
        var password = _emailSettings.Password.Replace(" ", "");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.SenderName, _emailSettings.SenderEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlMessage };

        using var client = new SmtpClient();
        await client.ConnectAsync(_emailSettings.SmtpServer, _emailSettings.SmtpPort, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_emailSettings.Username, password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
