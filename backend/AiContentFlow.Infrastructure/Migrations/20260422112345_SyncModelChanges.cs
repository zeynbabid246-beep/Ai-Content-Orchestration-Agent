using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncModelChanges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AccountName",
                table: "SocialAccounts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "SocialAccounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "OAuthToken",
                table: "SocialAccounts",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PlatformAccountId",
                table: "SocialAccounts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RefreshToken",
                table: "SocialAccounts",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "TokenExpiry",
                table: "SocialAccounts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "SocialAccountId",
                table: "PostVariants",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "ContentPosts",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Prompt",
                table: "ContentPosts",
                type: "text",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(4000)",
                oldMaxLength: 4000,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CampaignId",
                table: "ContentPosts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Content",
                table: "ContentPosts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "ContentPosts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "ContentPosts",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "TeamId1",
                table: "ContentPosts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Topic",
                table: "ContentPosts",
                type: "character varying(300)",
                maxLength: 300,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "PublishJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PostVariantId = table.Column<int>(type: "integer", nullable: false),
                    SocialAccountId = table.Column<int>(type: "integer", nullable: false),
                    ScheduledFor = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AttemptCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublishJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PublishJobs_PostVariants_PostVariantId",
                        column: x => x.PostVariantId,
                        principalTable: "PostVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PublishJobs_SocialAccounts_SocialAccountId",
                        column: x => x.SocialAccountId,
                        principalTable: "SocialAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostVariants_SocialAccountId",
                table: "PostVariants",
                column: "SocialAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_TeamId_ScheduledAt",
                table: "ContentPosts",
                columns: new[] { "TeamId", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_TeamId_Status",
                table: "ContentPosts",
                columns: new[] { "TeamId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_TeamId1",
                table: "ContentPosts",
                column: "TeamId1");

            migrationBuilder.CreateIndex(
                name: "IX_PublishJobs_PostVariantId",
                table: "PublishJobs",
                column: "PostVariantId");

            migrationBuilder.CreateIndex(
                name: "IX_PublishJobs_ScheduledFor",
                table: "PublishJobs",
                column: "ScheduledFor");

            migrationBuilder.CreateIndex(
                name: "IX_PublishJobs_SocialAccountId",
                table: "PublishJobs",
                column: "SocialAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_PublishJobs_Status",
                table: "PublishJobs",
                column: "Status");

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContentPosts_Teams_TeamId1",
                table: "ContentPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_PostVariants_SocialAccounts_SocialAccountId",
                table: "PostVariants");

            migrationBuilder.DropTable(
                name: "PublishJobs");

            migrationBuilder.DropIndex(
                name: "IX_PostVariants_SocialAccountId",
                table: "PostVariants");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_TeamId_ScheduledAt",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_TeamId_Status",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_TeamId1",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "AccountName",
                table: "SocialAccounts");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "SocialAccounts");

            migrationBuilder.DropColumn(
                name: "OAuthToken",
                table: "SocialAccounts");

            migrationBuilder.DropColumn(
                name: "PlatformAccountId",
                table: "SocialAccounts");

            migrationBuilder.DropColumn(
                name: "RefreshToken",
                table: "SocialAccounts");

            migrationBuilder.DropColumn(
                name: "TokenExpiry",
                table: "SocialAccounts");

            migrationBuilder.DropColumn(
                name: "SocialAccountId",
                table: "PostVariants");

            migrationBuilder.DropColumn(
                name: "CampaignId",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "Content",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "TeamId1",
                table: "ContentPosts");

            migrationBuilder.DropColumn(
                name: "Topic",
                table: "ContentPosts");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "ContentPosts",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(300)",
                oldMaxLength: 300,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Prompt",
                table: "ContentPosts",
                type: "character varying(4000)",
                maxLength: 4000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldMaxLength: 4000,
                oldNullable: true);
        }
    }
}
