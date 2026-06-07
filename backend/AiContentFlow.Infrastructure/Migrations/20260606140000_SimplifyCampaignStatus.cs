using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations;

public partial class SimplifyCampaignStatus : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Old enum: Draft=0, Active=1, Paused=2, Completed=3, Archived=4
        // New enum: Active=0, Archived=1
        migrationBuilder.Sql("""
            UPDATE "Campaigns" SET "Status" = 0 WHERE "Status" IN (0, 1, 2, 3);
            UPDATE "Campaigns" SET "Status" = 1 WHERE "Status" = 4;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE "Campaigns" SET "Status" = 4 WHERE "Status" = 1;
            UPDATE "Campaigns" SET "Status" = 0 WHERE "Status" = 0;
            """);
    }
}
