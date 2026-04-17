using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class synchRefreshTokens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "RefreshTokens");

            migrationBuilder.RenameColumn(
                name: "RevokedAt",
                table: "RefreshTokens",
                newName: "ExpiresAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ExpiresAt",
                table: "RefreshTokens",
                newName: "RevokedAt");

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiryDate",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
