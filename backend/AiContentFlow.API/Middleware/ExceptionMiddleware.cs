using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace AiContentFlow.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception while processing {Path}", context.Request.Path);
            await WriteErrorAsync(context, ex);
        }
    }

    private static async Task WriteErrorAsync(HttpContext context, Exception exception)
    {
        var isAuthRoute = context.Request.Path.StartsWithSegments("/api/Auth", StringComparison.OrdinalIgnoreCase);

        var (statusCode, message) = exception switch
        {
            UnauthorizedAccessException when isAuthRoute => (StatusCodes.Status401Unauthorized, exception.Message),
            UnauthorizedAccessException => (StatusCodes.Status403Forbidden, exception.Message),
            KeyNotFoundException => (StatusCodes.Status404NotFound, exception.Message),
            InvalidOperationException => (StatusCodes.Status400BadRequest, exception.Message),
            ValidationException => (StatusCodes.Status400BadRequest, exception.Message),
            ArgumentException => (StatusCodes.Status400BadRequest, exception.Message),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var payload = JsonSerializer.Serialize(new
        {
            message,
            errors = Array.Empty<object>()
        });

        await context.Response.WriteAsync(payload);
    }
}
