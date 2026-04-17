using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChannelAndSocialAccountSlice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Channels",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Channels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Channels_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SocialAccounts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    ChannelId = table.Column<int>(type: "integer", nullable: false),
                    Platform = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AccountHandle = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SocialAccounts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SocialAccounts_Channels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "Channels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SocialAccounts_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_SocialAccountId",
                table: "ContentPosts",
                column: "SocialAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_Channels_TeamId_CreatedAt",
                table: "Channels",
                columns: new[] { "TeamId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Channels_TeamId_Name",
                table: "Channels",
                columns: new[] { "TeamId", "Name" },
                unique: true);

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

            migrationBuilder.CreateIndex(
                name: "IX_SocialAccounts_TeamId_Platform",
                table: "SocialAccounts",
                columns: new[] { "TeamId", "Platform" });

            migrationBuilder.Sql("""
                INSERT INTO "Channels" ("TeamId", "Name", "Description", "IsDeleted", "DeletedAt", "CreatedAt", "UpdatedAt")
                SELECT DISTINCT cp."TeamId", '__migrated_default_channel__', 'Auto-created during Channel/SocialAccount migration', FALSE, NULL::timestamp with time zone, NOW(), NOW()
                FROM "ContentPosts" cp
                ON CONFLICT ("TeamId", "Name") DO NOTHING;
                """);

            migrationBuilder.Sql("""
                INSERT INTO "SocialAccounts" ("TeamId", "ChannelId", "Platform", "Status", "AccountHandle", "DisplayName", "IsDeleted", "DeletedAt", "CreatedAt", "UpdatedAt")
                SELECT c."TeamId", c."Id", 1, 0, '__migrated_default_account__', 'Migrated Default Account', FALSE, NULL::timestamp with time zone, NOW(), NOW()
                FROM "Channels" c
                WHERE c."Name" = '__migrated_default_channel__'
                ON CONFLICT ("TeamId", "ChannelId", "Platform", "AccountHandle") DO NOTHING;
                """);

            migrationBuilder.Sql("""
                UPDATE "ContentPosts" cp
                SET "ChannelId" = c."Id"
                FROM "Channels" c
                WHERE c."TeamId" = cp."TeamId"
                  AND c."Name" = '__migrated_default_channel__';
                """);

            migrationBuilder.Sql("""
                UPDATE "ContentPosts" cp
                SET "SocialAccountId" = sa."Id"
                FROM "SocialAccounts" sa
                INNER JOIN "Channels" c ON c."Id" = sa."ChannelId"
                WHERE sa."TeamId" = cp."TeamId"
                  AND c."Name" = '__migrated_default_channel__'
                  AND sa."AccountHandle" = '__migrated_default_account__';
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_ContentPosts_Channels_ChannelId",
                table: "ContentPosts",
                column: "ChannelId",
                principalTable: "Channels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ContentPosts_SocialAccounts_SocialAccountId",
                table: "ContentPosts",
                column: "SocialAccountId",
                principalTable: "SocialAccounts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ContentPosts_Channels_ChannelId",
                table: "ContentPosts");

            migrationBuilder.DropForeignKey(
                name: "FK_ContentPosts_SocialAccounts_SocialAccountId",
                table: "ContentPosts");

            migrationBuilder.DropTable(
                name: "SocialAccounts");

            migrationBuilder.DropTable(
                name: "Channels");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_SocialAccountId",
                table: "ContentPosts");
        }
    }
}
