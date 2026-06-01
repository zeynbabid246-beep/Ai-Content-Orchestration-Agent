using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBrandStudioFoundation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TeamBrandStudios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    WebsiteUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CompanyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Mission = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TargetAudience = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    KeywordsJson = table.Column<string>(type: "jsonb", nullable: false),
                    ToneOfVoice = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamBrandStudios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TeamBrandStudios_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BrandImportJobs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    TeamBrandStudioId = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    WebsiteUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Error = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    RawSnapshot = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BrandImportJobs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BrandImportJobs_TeamBrandStudios_TeamBrandStudioId",
                        column: x => x.TeamBrandStudioId,
                        principalTable: "TeamBrandStudios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BrandImportJobs_TeamBrandStudioId",
                table: "BrandImportJobs",
                column: "TeamBrandStudioId");

            migrationBuilder.CreateIndex(
                name: "IX_BrandImportJobs_TeamId_CreatedAt",
                table: "BrandImportJobs",
                columns: new[] { "TeamId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BrandImportJobs_TeamId_Status",
                table: "BrandImportJobs",
                columns: new[] { "TeamId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_TeamBrandStudios_TeamId",
                table: "TeamBrandStudios",
                column: "TeamId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BrandImportJobs");

            migrationBuilder.DropTable(
                name: "TeamBrandStudios");
        }
    }
}
