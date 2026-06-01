using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBrandStudioProductsServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProductsJson",
                table: "TeamBrandStudios",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ServicesJson",
                table: "TeamBrandStudios",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProductsJson",
                table: "TeamBrandStudios");

            migrationBuilder.DropColumn(
                name: "ServicesJson",
                table: "TeamBrandStudios");
        }
    }
}
