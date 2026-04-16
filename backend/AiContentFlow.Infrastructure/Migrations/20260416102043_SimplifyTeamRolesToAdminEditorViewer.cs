using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyTeamRolesToAdminEditorViewer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"UserTeams\" SET \"Role\" = 1 WHERE \"Role\" = 2;");
            migrationBuilder.Sql("UPDATE \"UserTeams\" SET \"Role\" = 2 WHERE \"Role\" = 3;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE \"UserTeams\" SET \"Role\" = 3 WHERE \"Role\" = 2;");
        }
    }
}
