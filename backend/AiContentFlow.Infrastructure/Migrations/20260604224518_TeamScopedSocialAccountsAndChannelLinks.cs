using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TeamScopedSocialAccountsAndChannelLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "ContentPosts",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "ChannelSocialAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ChannelId = table.Column<int>(type: "integer", nullable: false),
                    SocialAccountId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChannelSocialAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChannelSocialAccounts_Channels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "Channels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChannelSocialAccounts_SocialAccounts_SocialAccountId",
                        column: x => x.SocialAccountId,
                        principalTable: "SocialAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChannelSocialAccounts_ChannelId",
                table: "ChannelSocialAccounts",
                column: "ChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_ChannelSocialAccounts_ChannelId_SocialAccountId",
                table: "ChannelSocialAccounts",
                columns: new[] { "ChannelId", "SocialAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChannelSocialAccounts_SocialAccountId",
                table: "ChannelSocialAccounts",
                column: "SocialAccountId");

            // Backfill channel links from legacy SocialAccounts.ChannelId
            migrationBuilder.Sql("""
                INSERT INTO "ChannelSocialAccounts" ("ChannelId", "SocialAccountId", "CreatedAt")
                SELECT sa."ChannelId", sa."Id", NOW() AT TIME ZONE 'UTC'
                FROM "SocialAccounts" sa
                WHERE sa."ChannelId" IS NOT NULL
                  AND NOT sa."IsDeleted"
                ON CONFLICT ("ChannelId", "SocialAccountId") DO NOTHING;
                """);

            // Merge duplicate team accounts (same TeamId + Platform + ExternalAccountId)
            const string mergeCte = """
                WITH ranked AS (
                    SELECT
                        sa."Id",
                        sa."TeamId",
                        sa."Platform",
                        sa."ExternalAccountId",
                        ROW_NUMBER() OVER (
                            PARTITION BY sa."TeamId", sa."Platform", sa."ExternalAccountId"
                            ORDER BY sa."IsDeleted" ASC, sa."IsActive" DESC, sa."UpdatedAt" DESC, sa."Id" DESC
                        ) AS rn
                    FROM "SocialAccounts" sa
                    WHERE COALESCE(sa."ExternalAccountId", '') <> ''
                ),
                losers AS (
                    SELECT "Id" AS loser_id, "TeamId", "Platform", "ExternalAccountId"
                    FROM ranked
                    WHERE rn > 1
                ),
                winners AS (
                    SELECT r."TeamId", r."Platform", r."ExternalAccountId", r."Id" AS winner_id
                    FROM ranked r
                    WHERE r.rn = 1
                )
                """;

            migrationBuilder.Sql(mergeCte + """
                INSERT INTO "ChannelSocialAccounts" ("ChannelId", "SocialAccountId", "CreatedAt")
                SELECT csa."ChannelId", w.winner_id, NOW() AT TIME ZONE 'UTC'
                FROM "ChannelSocialAccounts" csa
                INNER JOIN losers l ON l.loser_id = csa."SocialAccountId"
                INNER JOIN winners w
                    ON w."TeamId" = l."TeamId"
                   AND w."Platform" = l."Platform"
                   AND w."ExternalAccountId" = l."ExternalAccountId"
                ON CONFLICT ("ChannelId", "SocialAccountId") DO NOTHING;
                """);

            migrationBuilder.Sql(mergeCte + """
                UPDATE "PostPublications" pp
                SET "SocialAccountId" = w.winner_id
                FROM losers l
                INNER JOIN winners w
                    ON w."TeamId" = l."TeamId"
                   AND w."Platform" = l."Platform"
                   AND w."ExternalAccountId" = l."ExternalAccountId"
                WHERE pp."SocialAccountId" = l.loser_id;
                """);

            migrationBuilder.Sql(mergeCte + """
                UPDATE "SocialAccounts" sa
                SET "IsDeleted" = TRUE,
                    "DeletedAt" = NOW() AT TIME ZONE 'UTC',
                    "IsActive" = FALSE,
                    "UpdatedAt" = NOW() AT TIME ZONE 'UTC'
                FROM losers l
                WHERE sa."Id" = l.loser_id;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_SocialAccounts_Channels_ChannelId",
                table: "SocialAccounts");

            migrationBuilder.DropIndex(
                name: "IX_SocialAccounts_ChannelId",
                table: "SocialAccounts");

            migrationBuilder.DropIndex(
                name: "IX_SocialAccounts_TeamId_ChannelId",
                table: "SocialAccounts");

            migrationBuilder.DropIndex(
                name: "IX_SocialAccounts_TeamId_ChannelId_Platform_AccountHandle",
                table: "SocialAccounts");

            migrationBuilder.DropColumn(
                name: "ChannelId",
                table: "SocialAccounts");

            migrationBuilder.CreateIndex(
                name: "IX_SocialAccounts_TeamId_Platform_ExternalAccountId",
                table: "SocialAccounts",
                columns: new[] { "TeamId", "Platform", "ExternalAccountId" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChannelSocialAccounts");

            migrationBuilder.DropIndex(
                name: "IX_SocialAccounts_TeamId_Platform_ExternalAccountId",
                table: "SocialAccounts");

            migrationBuilder.AddColumn<int>(
                name: "ChannelId",
                table: "SocialAccounts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "ContentPosts",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SocialAccounts_ChannelId",
                table: "SocialAccounts",
                column: "ChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_SocialAccounts_TeamId_ChannelId",
                table: "SocialAccounts",
                columns: new[] { "TeamId", "ChannelId" });

            migrationBuilder.CreateIndex(
                name: "IX_SocialAccounts_TeamId_ChannelId_Platform_AccountHandle",
                table: "SocialAccounts",
                columns: new[] { "TeamId", "ChannelId", "Platform", "AccountHandle" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_SocialAccounts_Channels_ChannelId",
                table: "SocialAccounts",
                column: "ChannelId",
                principalTable: "Channels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
