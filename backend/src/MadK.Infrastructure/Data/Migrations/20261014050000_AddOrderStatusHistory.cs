using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadK.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddOrderStatusHistory : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "order_status_histories",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                order_id = table.Column<Guid>(type: "uuid", nullable: false),
                from_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                to_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                changed_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                changed_by_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_order_status_histories", x => x.id);
                table.ForeignKey(
                    name: "FK_order_status_histories_orders_order_id",
                    column: x => x.order_id,
                    principalTable: "orders",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "idx_order_status_histories_order_id",
            table: "order_status_histories",
            column: "order_id");

        migrationBuilder.CreateIndex(
            name: "idx_order_status_histories_created_at",
            table: "order_status_histories",
            column: "created_at");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "order_status_histories");
    }
}
