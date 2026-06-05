using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AiContentFlow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnsureUserProfileColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "AvatarUrl" text;
                ALTER TABLE "AspNetUsers" ADD COLUMN IF NOT EXISTS "Bio" text;
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'AspNetUsers' AND column_name = 'CreatedAt'
                    ) THEN
                        ALTER TABLE "AspNetUsers"
                            ADD COLUMN "CreatedAt" timestamp with time zone NOT NULL
                            DEFAULT TIMESTAMPTZ '2026-01-01 00:00:00+00';
                    END IF;
                END $$;
                UPDATE "AspNetUsers"
                SET "CreatedAt" = NOW() AT TIME ZONE 'UTC'
                WHERE "CreatedAt" = TIMESTAMPTZ '2026-01-01 00:00:00+00';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
