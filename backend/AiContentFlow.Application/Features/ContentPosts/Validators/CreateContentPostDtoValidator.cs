using AiContentFlow.Application.Features.ContentPosts.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.ContentPosts.Validators;

public class CreateContentPostDtoValidator : AbstractValidator<CreateContentPostDto>
{
    public CreateContentPostDtoValidator()
    {
        RuleFor(x => x.ContentJson)
            .NotEmpty();

        RuleFor(x => x.Title)
            .MaximumLength(200);

        RuleFor(x => x.ChannelId)
            .GreaterThan(0)
            .When(x => x.ChannelId.HasValue);

        RuleFor(x => x.CampaignId)
            .GreaterThan(0)
            .When(x => x.CampaignId.HasValue);
    }
}
