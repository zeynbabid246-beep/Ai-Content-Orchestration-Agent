using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCampaignSlice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Campaigns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TeamId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Campaigns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Campaigns_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "IX_CampaignContentPosts_CampaignId",
                table: "CampaignContentPosts",
                column: "CampaignId");

            migrationBuilder.CreateIndex(
                name: "IX_CampaignContentPosts_ContentPostId",
                table: "CampaignContentPosts",
                column: "ContentPostId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_TeamId_CreatedAt",
                table: "Campaigns",
                columns: new[] { "TeamId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_TeamId_Name",
                table: "Campaigns",
                columns: new[] { "TeamId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_TeamId_Status",
                table: "Campaigns",
                columns: new[] { "TeamId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CampaignContentPosts");

            migrationBuilder.DropTable(
                name: "Campaigns");
        }
    }
}
