using AiContentFlow.Application.Features.SocialAccounts.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.SocialAccounts.Validators;

public class CreateSocialAccountDtoValidator : AbstractValidator<CreateSocialAccountDto>
{
    public CreateSocialAccountDtoValidator()
    {
        RuleFor(x => x.Platform)
            .IsInEnum();

        RuleFor(x => x.AccountHandle)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(x => x.DisplayName)
            .MaximumLength(150);

        RuleFor(x => x.ExternalAccountId)
            .MaximumLength(200);
    }
}
