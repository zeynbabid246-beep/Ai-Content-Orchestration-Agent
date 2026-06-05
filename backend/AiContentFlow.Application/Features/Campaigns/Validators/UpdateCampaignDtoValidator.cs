using AiContentFlow.Domain.Campaigns.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.Campaigns.Validators;

public class UpdateCampaignDtoValidator : AbstractValidator<UpdateCampaignDto>
{
    public UpdateCampaignDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(x => x.Description)
            .MaximumLength(500);

        RuleFor(x => x.ChannelId)
            .GreaterThan(0);

        RuleFor(x => x.Objective)
            .MaximumLength(500);

        RuleFor(x => x.ToneOfVoiceOverride)
            .MaximumLength(500);

        RuleFor(x => x.TargetAudienceOverride)
            .MaximumLength(1000);
    }
}
