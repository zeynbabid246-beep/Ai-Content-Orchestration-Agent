using AiContentFlow.Application.Features.BrandStudio.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.BrandStudio.Validators;

public class CreateManualBrandStudioDtoValidator : AbstractValidator<CreateManualBrandStudioDto>
{
    public CreateManualBrandStudioDtoValidator()
    {
        RuleFor(x => x.ParsedProfile)
            .NotNull()
            .ChildRules(profile =>
            {
                profile.RuleFor(p => p)
                    .Must(HasBrandIdentity)
                    .WithMessage("Provide at least a brand name or brand summary.");

                profile.RuleFor(p => p.WebsiteUrl)
                    .MaximumLength(500)
                    .Must(BeEmptyOrAbsoluteHttpUrl!)
                    .When(p => !string.IsNullOrWhiteSpace(p.WebsiteUrl))
                    .WithMessage("Website URL must be a valid http or https URL when provided.");
            });
    }

    private static bool HasBrandIdentity(BrandParsedProfileDto profile)
    {
        return !string.IsNullOrWhiteSpace(profile.BrandName)
            || !string.IsNullOrWhiteSpace(profile.BrandSummary);
    }

    private static bool BeEmptyOrAbsoluteHttpUrl(string? websiteUrl)
    {
        if (string.IsNullOrWhiteSpace(websiteUrl))
            return true;

        return Uri.TryCreate(websiteUrl, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
