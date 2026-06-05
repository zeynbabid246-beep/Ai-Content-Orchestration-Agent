using AiContentFlow.Application.Features.Profile.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.Profile.Validators;

public class UpdateUserProfileDtoValidator : AbstractValidator<UpdateUserProfileDto>
{
    public UpdateUserProfileDtoValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Bio)
            .MaximumLength(300)
            .When(x => !string.IsNullOrWhiteSpace(x.Bio));
    }
}
