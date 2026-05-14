using AiContentFlow.Application.Features.BrandStudio.Dtos;
using FluentValidation;

namespace AiContentFlow.Application.Features.BrandStudio.Validators;

public class CreateBrandImportDtoValidator : AbstractValidator<CreateBrandImportDto>
{
    public CreateBrandImportDtoValidator()
    {
        RuleFor(x => x.WebsiteUrl)
            .NotEmpty()
            .MaximumLength(500)
            .Must(BeAbsoluteHttpUrl)
            .WithMessage("Website URL must be a valid http or https URL");
    }

    private static bool BeAbsoluteHttpUrl(string websiteUrl)
    {
        return Uri.TryCreate(websiteUrl, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }
}
