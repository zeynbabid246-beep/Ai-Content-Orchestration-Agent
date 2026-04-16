using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TeamFirstOnboardingScopedCampaignsOptionalContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_ChannelId_SocialAccountId",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_Channels_TeamId_Name",
                table: "Channels");

            migrationBuilder.AddColumn<bool>(
                name: "IsNameSetupRequired",
                table: "Teams",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<int>(
                name: "SocialAccountId",
                table: "ContentPosts",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "ChannelId",
                table: "ContentPosts",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "NormalizedName",
                table: "Channels",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Channels\" SET \"NormalizedName\" = UPPER(TRIM(\"Name\")) WHERE \"NormalizedName\" IS NULL;");

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedName",
                table: "Channels",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ChannelId",
                table: "Campaigns",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_ChannelId",
                table: "ContentPosts",
                column: "ChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_ContentPosts_TeamId_ChannelId_SocialAccountId",
                table: "ContentPosts",
                columns: new[] { "TeamId", "ChannelId", "SocialAccountId" });

            migrationBuilder.CreateIndex(
                name: "IX_Channels_TeamId_NormalizedName",
                table: "Channels",
                columns: new[] { "TeamId", "NormalizedName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_ChannelId",
                table: "Campaigns",
                column: "ChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_Campaigns_TeamId_ChannelId",
                table: "Campaigns",
                columns: new[] { "TeamId", "ChannelId" });

            migrationBuilder.AddForeignKey(
                name: "FK_Campaigns_Channels_ChannelId",
                table: "Campaigns",
                column: "ChannelId",
                principalTable: "Channels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Campaigns_Channels_ChannelId",
                table: "Campaigns");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_ChannelId",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_ContentPosts_TeamId_ChannelId_SocialAccountId",
                table: "ContentPosts");

            migrationBuilder.DropIndex(
                name: "IX_Channels_TeamId_NormalizedName",
                table: "Channels");

            migrationBuilder.DropIndex(
                name: "IX_Campaigns_ChannelId",
                table: "Campaigns");

            migrationBuilder.DropIndex(
                name: "IX_Campaigns_TeamId_ChannelId",
                table: "Campaigns");

            migrationBuilder.DropColumn(
                name: "IsNameSetupRequired",
                table: "Teams");

            migrationBuilder.DropColumn(
                name: "NormalizedName",
                table: "Channels");

            migrationBuilder.DropColumn(
                name: "ChannelId",
                table: "Campaigns");

            migrationBuilder.AlterColumn<int>(
                name: "SocialAccountId",
                table: "ContentPosts",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

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
                name: "IX_ContentPosts_ChannelId_SocialAccountId",
                table: "ContentPosts",
                columns: new[] { "ChannelId", "SocialAccountId" });

            migrationBuilder.CreateIndex(
                name: "IX_Channels_TeamId_Name",
                table: "Channels",
                columns: new[] { "TeamId", "Name" },
                unique: true);
        }
    }
}
