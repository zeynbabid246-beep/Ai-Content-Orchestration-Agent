using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPublishingLifecycleAndAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContentPosts_SocialAccounts_SocialAccountId",
                table: "ContentPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_ContentPosts_Teams_TeamId1",
                table: "ContentPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_PostVariants_SocialAccounts_SocialAccountId",
                table: "PostVariants");

            migrationBuilder.DropForeignKey(
                name: "FK_PublishJobs_PostVariants_PostVariantId",
                table: "PublishJobs");

            migrationBuilder.DropForeignKey(
                name: "FK_PublishJobs_SocialAccounts_SocialAccountId",
                table: "PublishJobs");

            migrationBuilder.DropTable(
                name: "CampaignContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_PublishJobs_PostVariantId",
                table: "PublishJobs");

            migrationBuilder.DropIndex(
                name: "IX_PublishJobs_ScheduledFor",
                table: "PublishJobs");

            migrationBuilder.DropIndex(
                name: "IX_PostVariants_SocialAccountId",
                table: "PostVariants");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_SocialAccountId",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_TeamId_ChannelId_SocialAccountId",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_TeamId_ScheduledAt",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_TeamId1",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "PostVariantId",
                table: "PublishJobs");

            migrationBuilder.DropColumn(
                name: "LastError",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "PlatformPostId",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "PlatformPostUrl",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "RetryCount",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "ScheduledAt",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "SocialAccountId",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "LastError",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "PlatformPostId",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "PlatformPostUrl",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "RetryCount",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "ScheduledAt",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "SocialAccountId",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "TeamId1",
                table: "ContentPosts");

            // Note: SocialAccounts.PlatformAccountId -> ExternalAccountId rename
            // was applied by an earlier (now-deleted) migration that still has a
            // row in __EFMigrationsHistory. The column is already named
            // ExternalAccountId in the database, so this rename is intentionally
            // omitted to keep auto-migrate idempotent.

            migrationBuilder.RenameColumn(
                name: "SocialAccountId",
                table: "PublishJobs",
                newName: "PostPublicationId");

            migrationBuilder.RenameColumn(
                name: "ScheduledFor",
                table: "PublishJobs",
                newName: "ScheduledAt");

            migrationBuilder.RenameColumn(
                name: "ProcessedAt",
                table: "PublishJobs",
                newName: "LockedAt");

            migrationBuilder.RenameColumn(
                name: "ErrorMessage",
                table: "PublishJobs",
                newName: "LastError");

            migrationBuilder.RenameColumn(
                name: "AttemptCount",
                table: "PublishJobs",
                newName: "RetryCount");

            migrationBuilder.RenameIndex(
                name: "IX_PublishJobs_SocialAccountId",
                table: "PublishJobs",
                newName: "IX_PublishJobs_PostPublicationId");

            // PostgreSQL cannot implicitly cast varchar to integer. Since
            // PublishJobs has no rows at this point of the refactor (the new
            // execution model owns publishing state via PostPublication), it is
            // safe to clear the column and convert the type explicitly.
            migrationBuilder.Sql("DELETE FROM \"PublishJobs\";");
            migrationBuilder.Sql("ALTER TABLE \"PublishJobs\" ALTER COLUMN \"Status\" TYPE integer USING 0;");

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "PublishJobs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeadLetteredAt",
                table: "PublishJobs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExecutedAt",
                table: "PublishJobs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LockedBy",
                table: "PublishJobs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxAttempts",
                table: "PublishJobs",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextAttemptAt",
                table: "PublishJobs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "ContentPosts",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "Campaigns",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "ChannelBrandings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChannelId = table.Column<int>(type: "integer", nullable: false),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    Theme = table.Column<string>(type: "text", nullable: true),
                    Slogan = table.Column<string>(type: "text", nullable: true),
                    Tone = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChannelBrandings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChannelBrandings_Channels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "Channels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChannelConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChannelId = table.Column<int>(type: "integer", nullable: false),
                    SettingsJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChannelConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChannelConfigs_Channels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "Channels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PostPublications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContentPostId = table.Column<int>(type: "integer", nullable: false),
                    PostVariantId = table.Column<int>(type: "integer", nullable: true),
                    SocialAccountId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExternalPostId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ExternalPostUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    IdempotencyKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    RetryCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostPublications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostPublications_ContentPosts_ContentPostId",
                        column: x => x.ContentPostId,
                        principalTable: "ContentPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PostPublications_PostVariants_PostVariantId",
                        column: x => x.PostVariantId,
                        principalTable: "PostVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PostPublications_SocialAccounts_SocialAccountId",
                        column: x => x.SocialAccountId,
                        principalTable: "SocialAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PostPublications_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PublicationAnalytics",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    PostPublicationId = table.Column<int>(type: "integer", nullable: false),
                    Source = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DedupeKey = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    WindowStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WindowEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PlatformCollectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    MetricVersion = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Impressions = table.Column<int>(type: "integer", nullable: false),
                    Clicks = table.Column<int>(type: "integer", nullable: false),
                    Shares = table.Column<int>(type: "integer", nullable: false),
                    EngagementRate = table.Column<decimal>(type: "numeric(8,4)", precision: 8, scale: 4, nullable: false),
                    CollectedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicationAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PublicationAnalytics_PostPublications_PostPublicationId",
                        column: x => x.PostPublicationId,
                        principalTable: "PostPublications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PublishJobs_Status_ScheduledAt_NextAttemptAt",
                table: "PublishJobs",
                columns: new[] { "Status", "ScheduledAt", "NextAttemptAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_CampaignId",
                table: "ContentPosts",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_TeamId_ChannelId",
                table: "ContentPosts",
                columns: new[] { "TeamId", "ChannelId" });

            migrationBuilder.CreateIndex(
                name: "IX_ChannelBrandings_ChannelId",
                table: "ChannelBrandings",
                column: "ChannelId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChannelConfigs_ChannelId",
                table: "ChannelConfigs",
                column: "ChannelId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PostPublications_ContentPostId",
                table: "PostPublications",
                column: "ContentPostId");

            migrationBuilder.CreateIndex(
                name: "IX_PostPublications_PostVariantId",
                table: "PostPublications",
                column: "PostVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_PostPublications_SocialAccountId",
                table: "PostPublications",
                column: "SocialAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_PostPublications_TeamId_IdempotencyKey",
                table: "PostPublications",
                columns: new[] { "TeamId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PostPublications_TeamId_ScheduledAt",
                table: "PostPublications",
                columns: new[] { "TeamId", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PostPublications_TeamId_Status",
                table: "PostPublications",
                columns: new[] { "TeamId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PublicationAnalytics_PostPublicationId",
                table: "PublicationAnalytics",
                column: "PostPublicationId");

            migrationBuilder.CreateIndex(
                name: "IX_PublicationAnalytics_TeamId_DedupeKey",
                table: "PublicationAnalytics",
                columns: new[] { "TeamId", "DedupeKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PublicationAnalytics_TeamId_PostPublicationId_CollectedAt",
                table: "PublicationAnalytics",
                columns: new[] { "TeamId", "PostPublicationId", "CollectedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_ContentPosts_Campaigns_CampaignId",
                table: "ContentPosts",
                column: "CampaignId",
                principalTable: "Campaigns",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_PublishJobs_PostPublications_PostPublicationId",
                table: "PublishJobs",
                column: "PostPublicationId",
                principalTable: "PostPublications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContentPosts_Campaigns_CampaignId",
                table: "ContentPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_PublishJobs_PostPublications_PostPublicationId",
                table: "PublishJobs");

            migrationBuilder.DropTable(
                name: "ChannelBrandings");

            migrationBuilder.DropTable(
                name: "ChannelConfigs");

            migrationBuilder.DropTable(
                name: "PublicationAnalytics");

            migrationBuilder.DropTable(
                name: "PostPublications");

            migrationBuilder.DropIndex(
                name: "IX_PublishJobs_Status_ScheduledAt_NextAttemptAt",
                table: "PublishJobs");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_CampaignId",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_TeamId_ChannelId",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "PublishJobs");

            migrationBuilder.DropColumn(
                name: "DeadLetteredAt",
                table: "PublishJobs");

            migrationBuilder.DropColumn(
                name: "ExecutedAt",
                table: "PublishJobs");

            migrationBuilder.DropColumn(
                name: "LockedBy",
                table: "PublishJobs");

            migrationBuilder.DropColumn(
                name: "MaxAttempts",
                table: "PublishJobs");

            migrationBuilder.DropColumn(
                name: "NextAttemptAt",
                table: "PublishJobs");

            // See note in Up(): the ExternalAccountId rename is owned by a prior
            // (deleted) migration whose history row still exists, so we do not
            // attempt to rename it back here either.

            migrationBuilder.RenameColumn(
                name: "ScheduledAt",
                table: "PublishJobs",
                newName: "ScheduledFor");

            migrationBuilder.RenameColumn(
                name: "RetryCount",
                table: "PublishJobs",
                newName: "AttemptCount");

            migrationBuilder.RenameColumn(
                name: "PostPublicationId",
                table: "PublishJobs",
                newName: "SocialAccountId");

            migrationBuilder.RenameColumn(
                name: "LockedAt",
                table: "PublishJobs",
                newName: "ProcessedAt");

            migrationBuilder.RenameColumn(
                name: "LastError",
                table: "PublishJobs",
                newName: "ErrorMessage");

            migrationBuilder.RenameIndex(
                name: "IX_PublishJobs_PostPublicationId",
                table: "PublishJobs",
                newName: "IX_PublishJobs_SocialAccountId");

            migrationBuilder.Sql("DELETE FROM \"PublishJobs\";");
            migrationBuilder.Sql("ALTER TABLE \"PublishJobs\" ALTER COLUMN \"Status\" TYPE character varying(50) USING ''::character varying(50);");

            migrationBuilder.AddColumn<int>(
                name: "PostVariantId",
                table: "PublishJobs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "LastError",
                table: "PostVariants",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlatformPostId",
                table: "PostVariants",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlatformPostUrl",
                table: "PostVariants",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "PostVariants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RetryCount",
                table: "PostVariants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledAt",
                table: "PostVariants",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocialAccountId",
                table: "PostVariants",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "PostVariants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "ContentPosts",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "LastError",
                table: "ContentPosts",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlatformPostId",
                table: "ContentPosts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlatformPostUrl",
                table: "ContentPosts",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "ContentPosts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RetryCount",
                table: "ContentPosts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledAt",
                table: "ContentPosts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SocialAccountId",
                table: "ContentPosts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TeamId1",
                table: "ContentPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "Campaigns",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "CampaignContentPosts",
                columns: table => new
                {
                    CampaignId = table.Column<int>(type: "integer", nullable: false),
                    ContentPostId = table.Column<int>(type: "integer", nullable: false),
                    LinkedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LinkedByUserId = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CampaignContentPosts", x => new { x.CampaignId, x.ContentPostId });
                    table.ForeignKey(
                        name: "FK_CampaignContentPosts_Campaigns_CampaignId",
                        column: x => x.CampaignId,
                        principalTable: "Campaigns",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CampaignContentPosts_ContentPosts_ContentPostId",
                        column: x => x.ContentPostId,
                        principalTable: "ContentPosts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PublishJobs_PostVariantId",
                table: "PublishJobs",
                column: "PostVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_PublishJobs_ScheduledFor",
                table: "PublishJobs",
                column: "ScheduledFor");

            migrationBuilder.CreateIndex(
                name: "IX_PostVariants_SocialAccountId",
                table: "PostVariants",
                column: "SocialAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_SocialAccountId",
                table: "ContentPosts",
                column: "SocialAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_TeamId_ChannelId_SocialAccountId",
                table: "ContentPosts",
                columns: new[] { "TeamId", "ChannelId", "SocialAccountId" });

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_TeamId_ScheduledAt",
                table: "ContentPosts",
                columns: new[] { "TeamId", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_TeamId1",
                table: "ContentPosts",
                column: "TeamId1");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignContentPosts_CampaignId",
                table: "CampaignContentPosts",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignContentPosts_ContentPostId",
                table: "CampaignContentPosts",
                column: "ContentPostId");

            migrationBuilder.AddForeignKey(
                name: "FK_ContentPosts_SocialAccounts_SocialAccountId",
                table: "ContentPosts",
                column: "SocialAccountId",
                principalTable: "SocialAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ContentPosts_Teams_TeamId1",
                table: "ContentPosts",
                column: "TeamId1",
                principalTable: "Teams",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PostVariants_SocialAccounts_SocialAccountId",
                table: "PostVariants",
                column: "SocialAccountId",
                principalTable: "SocialAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PublishJobs_PostVariants_PostVariantId",
                table: "PublishJobs",
                column: "PostVariantId",
                principalTable: "PostVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PublishJobs_SocialAccounts_SocialAccountId",
                table: "PublishJobs",
                column: "SocialAccountId",
                principalTable: "SocialAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
