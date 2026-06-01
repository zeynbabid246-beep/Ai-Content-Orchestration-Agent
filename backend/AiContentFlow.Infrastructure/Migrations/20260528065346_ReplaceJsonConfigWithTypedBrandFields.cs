using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceJsonConfigWithTypedBrandFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AudienceSignalsCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultBrandSummary",
                table: "TeamBrandStudios",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultCampaignObjective",
                table: "TeamBrandStudios",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultContentPillarsCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultKeywordsCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultMission",
                table: "TeamBrandStudios",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultTargetAudience",
                table: "TeamBrandStudios",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultToneOfVoice",
                table: "TeamBrandStudios",
                type: "character varying(500)",
                maxLength: 500,
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
                name: "ToneOfVoiceExamplesCsv",
                table: "TeamBrandStudios",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Tone",
                table: "ChannelBrandings",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Theme",
                table: "ChannelBrandings",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Slogan",
                table: "ChannelBrandings",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "LogoUrl",
                table: "ChannelBrandings",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BrandSummary",
                table: "ChannelBrandings",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentPillarsCsv",
                table: "ChannelBrandings",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Goal",
                table: "ChannelBrandings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "KeywordsCsv",
                table: "ChannelBrandings",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Mission",
                table: "ChannelBrandings",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetAudience",
                table: "ChannelBrandings",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Objective",
                table: "Campaigns",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetAudienceOverride",
                table: "Campaigns",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ToneOfVoiceOverride",
                table: "Campaigns",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "TeamBrandStudios"
                SET
                    "KeywordsCsv" = COALESCE((
                        SELECT string_agg(value, ', ')
                        FROM jsonb_array_elements_text(COALESCE("KeywordsJson", '[]'::jsonb)) AS value
                    ), ''),
                    "ProductsCsv" = COALESCE((
                        SELECT string_agg(value, ', ')
                        FROM jsonb_array_elements_text(COALESCE("ProductsJson"::jsonb, '[]'::jsonb)) AS value
                    ), ''),
                    "ServicesCsv" = COALESCE((
                        SELECT string_agg(value, ', ')
                        FROM jsonb_array_elements_text(COALESCE("ServicesJson"::jsonb, '[]'::jsonb)) AS value
                    ), ''),
                    "DefaultToneOfVoice" = COALESCE(NULLIF("DefaultConfigJson"->>'toneOfVoice', ''), "ToneOfVoice"),
                    "DefaultTargetAudience" = COALESCE(NULLIF("DefaultConfigJson"->>'targetAudience', ''), "TargetAudience"),
                    "DefaultKeywordsCsv" = COALESCE((
                        SELECT string_agg(value, ', ')
                        FROM jsonb_array_elements_text(COALESCE("DefaultConfigJson"->'keywords', '[]'::jsonb)) AS value
                    ), ''),
                    "DefaultContentPillarsCsv" = COALESCE((
                        SELECT string_agg(value, ', ')
                        FROM jsonb_array_elements_text(COALESCE("DefaultConfigJson"->'contentPillars', '[]'::jsonb)) AS value
                    ), ''),
                    "DefaultMission" = COALESCE(NULLIF("DefaultConfigJson"->>'mission', ''), "Mission"),
                    "DefaultBrandSummary" = COALESCE(NULLIF("DefaultConfigJson"->>'brandSummary', ''), "Description"),
                    "DefaultCampaignObjective" = COALESCE(NULLIF("DefaultConfigJson"->>'preferredCampaignObjective', ''), 'awareness'),
                    "AudienceSignalsCsv" = COALESCE((
                        SELECT string_agg(value, ', ')
                        FROM jsonb_array_elements_text(COALESCE("RawAnalysisJson"->'audience_signals', '[]'::jsonb)) AS value
                    ), ''),
                    "ToneOfVoiceExamplesCsv" = COALESCE((
                        SELECT string_agg(value, ', ')
                        FROM jsonb_array_elements_text(COALESCE("RawAnalysisJson"->'tone_of_voice', '[]'::jsonb)) AS value
                    ), '');
                """);

            migrationBuilder.Sql("""
                UPDATE "Campaigns"
                SET
                    "Objective" = NULLIF("ConfigJson"->>'objective', ''),
                    "ToneOfVoiceOverride" = NULLIF("ConfigJson"->>'toneOfVoice', ''),
                    "TargetAudienceOverride" = NULLIF("ConfigJson"->>'targetAudience', '');
                """);

            migrationBuilder.DropColumn(
                name: "DefaultConfigJson",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "KeywordsJson",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "ProductsJson",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "RawAnalysisJson",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "ServicesJson",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "ConfigJson",
                table: "Campaigns");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AudienceSignalsCsv",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "DefaultBrandSummary",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "DefaultCampaignObjective",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "DefaultContentPillarsCsv",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "DefaultKeywordsCsv",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "DefaultMission",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "DefaultTargetAudience",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "DefaultToneOfVoice",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "KeywordsCsv",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "ProductsCsv",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "ServicesCsv",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "ToneOfVoiceExamplesCsv",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "BrandSummary",
                table: "ChannelBrandings");

            migrationBuilder.DropColumn(
                name: "ContentPillarsCsv",
                table: "ChannelBrandings");

            migrationBuilder.DropColumn(
                name: "Goal",
                table: "ChannelBrandings");

            migrationBuilder.DropColumn(
                name: "KeywordsCsv",
                table: "ChannelBrandings");

            migrationBuilder.DropColumn(
                name: "Mission",
                table: "ChannelBrandings");

            migrationBuilder.DropColumn(
                name: "TargetAudience",
                table: "ChannelBrandings");

            migrationBuilder.DropColumn(
                name: "Objective",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "TargetAudienceOverride",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "ToneOfVoiceOverride",
                table: "Campaigns");

            migrationBuilder.AddColumn<string>(
                name: "DefaultConfigJson",
                table: "TeamBrandStudios",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "KeywordsJson",
                table: "TeamBrandStudios",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProductsJson",
                table: "TeamBrandStudios",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RawAnalysisJson",
                table: "TeamBrandStudios",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ServicesJson",
                table: "TeamBrandStudios",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Tone",
                table: "ChannelBrandings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(300)",
                oldMaxLength: 300,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Theme",
                table: "ChannelBrandings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Slogan",
                table: "ChannelBrandings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(300)",
                oldMaxLength: 300,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "LogoUrl",
                table: "ChannelBrandings",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ConfigJson",
                table: "Campaigns",
                type: "jsonb",
                nullable: false,
                defaultValue: "");
        }
    }
}
