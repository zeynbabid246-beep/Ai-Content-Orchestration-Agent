using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncSocialAccountUniqueIndexFilter : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SocialAccounts_TeamId_Platform_ExternalAccountId",
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
            migrationBuilder.DropIndex(
                name: "IX_SocialAccounts_TeamId_Platform_ExternalAccountId",
                table: "SocialAccounts");

            migrationBuilder.CreateIndex(
                name: "IX_SocialAccounts_TeamId_Platform_ExternalAccountId",
                table: "SocialAccounts",
                columns: new[] { "TeamId", "Platform", "ExternalAccountId" },
                unique: true);
        }
    }
}
