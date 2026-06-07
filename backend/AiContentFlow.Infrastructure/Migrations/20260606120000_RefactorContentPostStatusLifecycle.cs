using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations;

public partial class RefactorContentPostStatusLifecycle : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Old enum: Draft=0, Review=1, Approved=2, Scheduled=3, Published=4, Archived=5
        // New enum: Draft=0, Ready=1, Scheduled=2, Published=3, Deleted=4
        migrationBuilder.Sql("""
            UPDATE "ContentPosts" SET "Status" = 1 WHERE "Status" IN (1, 2);
            UPDATE "ContentPosts" SET "Status" = 2 WHERE "Status" = 3;
            UPDATE "ContentPosts" SET "Status" = 3 WHERE "Status" = 4;
            UPDATE "ContentPosts" SET "Status" = 4 WHERE "Status" = 5;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            UPDATE "ContentPosts" SET "Status" = 5 WHERE "Status" = 4;
            UPDATE "ContentPosts" SET "Status" = 4 WHERE "Status" = 3;
            UPDATE "ContentPosts" SET "Status" = 3 WHERE "Status" = 2;
            UPDATE "ContentPosts" SET "Status" = 2 WHERE "Status" = 1;
            """);
    }
}
