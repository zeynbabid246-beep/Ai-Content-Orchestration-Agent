using AiContentFlow.Application.Features.Channels.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.Channels.Validators;

public class UpdateChannelDtoValidator : AbstractValidator<UpdateChannelDto>
{
    public UpdateChannelDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);
    }
}