using AiContentFlow.Application.Features.ContentPosts.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.ContentPosts.Validators;

public class UpdateContentPostDtoValidator : AbstractValidator<UpdateContentPostDto>
{
    public UpdateContentPostDtoValidator()
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
