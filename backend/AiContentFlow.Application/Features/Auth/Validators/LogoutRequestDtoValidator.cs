using AiContentFlow.Application.Features.Auth.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.Auth.Validators;

public class LogoutRequestDtoValidator : AbstractValidator<LogoutRequestDto>
{
    public LogoutRequestDtoValidator()
    {
        RuleFor(x => x.RefreshToken)
            .NotEmpty();
    }
}
