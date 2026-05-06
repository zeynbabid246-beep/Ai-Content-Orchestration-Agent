using AiContentFlow.Application.Features.Channels.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.Channels.Validators;

public class CreateChannelDtoValidator : AbstractValidator<CreateChannelDto>
{
    public CreateChannelDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);

        When(x => x.Config != null, () =>
        {
            RuleFor(x => x.Config!.SettingsJson)
                .NotEmpty();
        });
    }
}