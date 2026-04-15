using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixRefreshTokenSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ADD COLUMN IF NOT EXISTS \"TokenHash\" character varying(128);");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ADD COLUMN IF NOT EXISTS \"Email\" text;");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ADD COLUMN IF NOT EXISTS \"Username\" text;");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ADD COLUMN IF NOT EXISTS \"ReplacedByTokenHash\" text;");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ADD COLUMN IF NOT EXISTS \"RevokedAt\" timestamp with time zone;");

            migrationBuilder.Sql("UPDATE \"RefreshTokens\" SET \"TokenHash\" = COALESCE(\"TokenHash\", CONCAT('legacy-', \"Id\"::text)) WHERE \"TokenHash\" IS NULL OR \"TokenHash\" = '';" );
            migrationBuilder.Sql("DELETE FROM \"RefreshTokens\" WHERE \"UserId\" IS NULL;");
            migrationBuilder.Sql("DELETE FROM \"RefreshTokens\" rt WHERE NOT EXISTS (SELECT 1 FROM \"AspNetUsers\" u WHERE u.\"Id\" = rt.\"UserId\");");

            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" DROP CONSTRAINT IF EXISTS \"FK_RefreshTokens_AspNetUsers_UserId\";");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ALTER COLUMN \"UserId\" SET NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ALTER COLUMN \"TokenHash\" SET NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" DROP COLUMN IF EXISTS \"Token\";");
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_RefreshTokens_TokenHash\" ON \"RefreshTokens\" (\"TokenHash\");");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ADD CONSTRAINT \"FK_RefreshTokens_AspNetUsers_UserId\" FOREIGN KEY (\"UserId\") REFERENCES \"AspNetUsers\" (\"Id\") ON DELETE CASCADE;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" DROP CONSTRAINT IF EXISTS \"FK_RefreshTokens_AspNetUsers_UserId\";");
            migrationBuilder.Sql("DROP INDEX IF EXISTS \"IX_RefreshTokens_TokenHash\";");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ADD COLUMN IF NOT EXISTS \"Token\" text;");
            migrationBuilder.Sql("UPDATE \"RefreshTokens\" SET \"Token\" = COALESCE(\"Token\", \"TokenHash\");");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" DROP COLUMN IF EXISTS \"TokenHash\";");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" DROP COLUMN IF EXISTS \"Email\";");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" DROP COLUMN IF EXISTS \"Username\";");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" DROP COLUMN IF EXISTS \"ReplacedByTokenHash\";");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" DROP COLUMN IF EXISTS \"RevokedAt\";");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ALTER COLUMN \"UserId\" DROP NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE \"RefreshTokens\" ADD CONSTRAINT \"FK_RefreshTokens_AspNetUsers_UserId\" FOREIGN KEY (\"UserId\") REFERENCES \"AspNetUsers\" (\"Id\");");
        }
    }
}
