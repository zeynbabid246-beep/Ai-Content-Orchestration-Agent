using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AlignBrandStudioWithAiProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OrgId",
                table: "TeamBrandStudios",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BrandName",
                table: "TeamBrandStudios",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BrandSummary",
                table: "TeamBrandStudios",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Slogan",
                table: "TeamBrandStudios",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "ValueProposition",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "ToneOfVoiceItems",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "AudienceSignals",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "ContentPillars",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "KeyMessages",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<string>(
                name: "BusinessInfo",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "TeamBrandStudios",
                type: "character varying(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualLogoUrl",
                table: "TeamBrandStudios",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualFaviconUrl",
                table: "TeamBrandStudios",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "VisualPrimaryColors",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "VisualSecondaryColors",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "VisualFontFamilies",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "VisualImageUrls",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<string>(
                name: "VisualStyle",
                table: "TeamBrandStudios",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualHeroText",
                table: "TeamBrandStudios",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "VisualCtaTexts",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<string>(
                name: "VisualScreenshotPath",
                table: "TeamBrandStudios",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VisualRenderMode",
                table: "TeamBrandStudios",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "VisualHasLogo",
                table: "TeamBrandStudios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "VisualHasImages",
                table: "TeamBrandStudios",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<List<string>>(
                name: "EnrichedBrandPersonality",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<string>(
                name: "EnrichedBrandArchetype",
                table: "TeamBrandStudios",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnrichedPositioningStatement",
                table: "TeamBrandStudios",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "VoiceGuidelinesDo",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "VoiceGuidelinesDont",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<List<string>>(
                name: "EnrichedMessagingPriorities",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<string>(
                name: "EnrichedVisualDirectionNotes",
                table: "TeamBrandStudios",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnrichedLinkedInVoice",
                table: "TeamBrandStudios",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EnrichedAdCopyStyle",
                table: "TeamBrandStudios",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "DefaultContentPillars",
                table: "TeamBrandStudios",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.Sql("""
                UPDATE "TeamBrandStudios"
                SET
                    "BrandName" = "CompanyName",
                    "BrandSummary" = "Description",
                    "EnrichedPositioningStatement" = "Mission",
                    "ContentPillars" = CASE
                        WHEN COALESCE("KeywordsCsv", '') = '' THEN ARRAY[]::text[]
                        ELSE regexp_split_to_array("KeywordsCsv", '\s*,\s*')
                    END,
                    "AudienceSignals" = CASE
                        WHEN COALESCE("AudienceSignalsCsv", '') = '' THEN ARRAY[]::text[]
                        ELSE regexp_split_to_array("AudienceSignalsCsv", '\s*,\s*')
                    END,
                    "ToneOfVoiceItems" = CASE
                        WHEN COALESCE("ToneOfVoiceExamplesCsv", '') <> '' THEN regexp_split_to_array("ToneOfVoiceExamplesCsv", '\s*,\s*')
                        WHEN COALESCE("ToneOfVoice", '') <> '' THEN ARRAY["ToneOfVoice"]
                        ELSE ARRAY[]::text[]
                    END,
                    "DefaultContentPillars" = CASE
                        WHEN COALESCE("DefaultContentPillarsCsv", '') <> '' THEN regexp_split_to_array("DefaultContentPillarsCsv", '\s*,\s*')
                        WHEN COALESCE("KeywordsCsv", '') <> '' THEN regexp_split_to_array("KeywordsCsv", '\s*,\s*')
                        ELSE ARRAY[]::text[]
                    END,
                    "DefaultToneOfVoice" = COALESCE("DefaultToneOfVoice", "ToneOfVoice"),
                    "DefaultTargetAudience" = COALESCE("DefaultTargetAudience", "TargetAudience"),
                    "DefaultMission" = COALESCE("DefaultMission", "Mission"),
                    "DefaultBrandSummary" = COALESCE("DefaultBrandSummary", "Description");
                """);

            migrationBuilder.DropColumn(name: "CompanyName", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "Description", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "Mission", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "TargetAudience", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "KeywordsCsv", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "ProductsCsv", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "ServicesCsv", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "ToneOfVoice", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "AudienceSignalsCsv", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "ToneOfVoiceExamplesCsv", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "DefaultKeywordsCsv", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "DefaultContentPillarsCsv", table: "TeamBrandStudios");

            migrationBuilder.RenameColumn(
                name: "ToneOfVoiceItems",
                table: "TeamBrandStudios",
                newName: "ToneOfVoice");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ToneOfVoice",
                table: "TeamBrandStudios",
                newName: "ToneOfVoiceItems");

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "TeamBrandStudios",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "TeamBrandStudios",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Mission",
                table: "TeamBrandStudios",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetAudience",
                table: "TeamBrandStudios",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KeywordsCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProductsCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ServicesCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ToneOfVoiceScalar",
                table: "TeamBrandStudios",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AudienceSignalsCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ToneOfVoiceExamplesCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultKeywordsCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultContentPillarsCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("""
                UPDATE "TeamBrandStudios"
                SET
                    "CompanyName" = "BrandName",
                    "Description" = "BrandSummary",
                    "Mission" = "EnrichedPositioningStatement",
                    "TargetAudience" = "DefaultTargetAudience",
                    "ToneOfVoiceScalar" = "DefaultToneOfVoice",
                    "KeywordsCsv" = array_to_string("ContentPillars", ', '),
                    "AudienceSignalsCsv" = array_to_string("AudienceSignals", ', '),
                    "ToneOfVoiceExamplesCsv" = array_to_string("ToneOfVoiceItems", ', '),
                    "DefaultContentPillarsCsv" = array_to_string("DefaultContentPillars", ', ');
                """);

            migrationBuilder.RenameColumn(
                name: "ToneOfVoiceScalar",
                table: "TeamBrandStudios",
                newName: "ToneOfVoice");

            migrationBuilder.DropColumn(name: "OrgId", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "BrandName", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "BrandSummary", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "Slogan", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "ValueProposition", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "ToneOfVoiceItems", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "AudienceSignals", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "ContentPillars", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "KeyMessages", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "BusinessInfo", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "Email", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualLogoUrl", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualFaviconUrl", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualPrimaryColors", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualSecondaryColors", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualFontFamilies", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualImageUrls", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualStyle", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualHeroText", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualCtaTexts", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualScreenshotPath", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualRenderMode", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualHasLogo", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VisualHasImages", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "EnrichedBrandPersonality", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "EnrichedBrandArchetype", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "EnrichedPositioningStatement", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VoiceGuidelinesDo", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "VoiceGuidelinesDont", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "EnrichedMessagingPriorities", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "EnrichedVisualDirectionNotes", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "EnrichedLinkedInVoice", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "EnrichedAdCopyStyle", table: "TeamBrandStudios");
            migrationBuilder.DropColumn(name: "DefaultContentPillars", table: "TeamBrandStudios");
        }
    }
}
