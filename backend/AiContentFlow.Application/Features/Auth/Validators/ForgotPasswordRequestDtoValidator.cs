using AiContentFlow.Application.Features.Auth.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.Auth.Validators;

public class ForgotPasswordRequestDtoValidator : AbstractValidator<ForgotPasswordRequestDto>
{
    public ForgotPasswordRequestDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);
    }
}
