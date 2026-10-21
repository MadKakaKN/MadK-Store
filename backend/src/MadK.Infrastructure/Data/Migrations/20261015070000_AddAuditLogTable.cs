using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadK.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddAuditLogTable : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "audit_logs",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: true),
                user_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                user_role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                entity_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                entity_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                old_values = table.Column<string>(type: "text", nullable: true),
                new_values = table.Column<string>(type: "text", nullable: true),
                ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: true),
                user_agent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_audit_logs", x => x.id);
            });

        migrationBuilder.CreateIndex(
            name: "ix_audit_logs_user_id",
            table: "audit_logs",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "ix_audit_logs_entity_name",
            table: "audit_logs",
            column: "entity_name");

        migrationBuilder.CreateIndex(
            name: "ix_audit_logs_action",
            table: "audit_logs",
            column: "action");

        migrationBuilder.CreateIndex(
            name: "ix_audit_logs_created_at",
            table: "audit_logs",
            column: "created_at");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "audit_logs");
    }
}
