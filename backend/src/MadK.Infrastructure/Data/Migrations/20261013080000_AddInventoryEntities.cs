using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadK.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddInventoryEntities : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "inventories",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                variant_id = table.Column<Guid>(type: "uuid", nullable: false),
                on_hand_quantity = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                reserved_quantity = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_inventories", x => x.id);
                table.CheckConstraint("chk_inventory_available", "on_hand_quantity - reserved_quantity >= 0");
                table.CheckConstraint("chk_inventory_on_hand", "on_hand_quantity >= 0");
                table.CheckConstraint("chk_inventory_reserved", "reserved_quantity >= 0");
                table.ForeignKey(
                    name: "FK_inventories_product_variants_variant_id",
                    column: x => x.variant_id,
                    principalTable: "product_variants",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "stock_movements",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                inventory_id = table.Column<Guid>(type: "uuid", nullable: false),
                variant_id = table.Column<Guid>(type: "uuid", nullable: false),
                type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                quantity = table.Column<int>(type: "integer", nullable: false),
                on_hand_before = table.Column<int>(type: "integer", nullable: false),
                on_hand_after = table.Column<int>(type: "integer", nullable: false),
                reserved_before = table.Column<int>(type: "integer", nullable: false),
                reserved_after = table.Column<int>(type: "integer", nullable: false),
                reference_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                reference_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_stock_movements", x => x.id);
                table.ForeignKey(
                    name: "FK_stock_movements_inventories_inventory_id",
                    column: x => x.inventory_id,
                    principalTable: "inventories",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "idx_inventories_variant_id",
            table: "inventories",
            column: "variant_id",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "idx_stock_movements_reference",
            table: "stock_movements",
            columns: new[] { "reference_type", "reference_id" });

        migrationBuilder.CreateIndex(
            name: "idx_stock_movements_variant_id",
            table: "stock_movements",
            column: "variant_id");

        migrationBuilder.CreateIndex(
            name: "IX_stock_movements_inventory_id",
            table: "stock_movements",
            column: "inventory_id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "stock_movements");

        migrationBuilder.DropTable(
            name: "inventories");
    }
}
