using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MadK.Infrastructure.Data.Migrations;

/// <inheritdoc />
public partial class AddOrderEntities : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "orders",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                order_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: true),
                customer_email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                customer_phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                payment_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                payment_method = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                subtotal_amount = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false),
                discount_amount = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false, defaultValue: 0m),
                shipping_fee = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false, defaultValue: 0m),
                total_amount = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false),
                shipping_address_snapshot = table.Column<string>(type: "jsonb", nullable: false),
                coupon_snapshot = table.Column<string>(type: "jsonb", nullable: true),
                customer_note = table.Column<string>(type: "text", nullable: true),
                admin_note = table.Column<string>(type: "text", nullable: true),
                cancel_reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                idempotency_key = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_orders", x => x.id);
                table.ForeignKey(
                    name: "FK_orders_users_user_id",
                    column: x => x.user_id,
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "order_items",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                order_id = table.Column<Guid>(type: "uuid", nullable: false),
                variant_id = table.Column<Guid>(type: "uuid", nullable: true),
                product_id = table.Column<Guid>(type: "uuid", nullable: true),
                product_name_snapshot = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                variant_name_snapshot = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                sku_snapshot = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                unit_price_snapshot = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false),
                original_price_snapshot = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false),
                quantity = table.Column<int>(type: "integer", nullable: false),
                total_price = table.Column<decimal>(type: "numeric(15,2)", precision: 15, scale: 2, nullable: false),
                attributes_snapshot = table.Column<string>(type: "jsonb", nullable: false),
                specifications_snapshot = table.Column<string>(type: "jsonb", nullable: true),
                thumbnail_url_snapshot = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "now()"),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_order_items", x => x.id);
                table.ForeignKey(
                    name: "FK_order_items_orders_order_id",
                    column: x => x.order_id,
                    principalTable: "orders",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_order_items_product_variants_variant_id",
                    column: x => x.variant_id,
                    principalTable: "product_variants",
                    principalColumn: "id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateIndex(
            name: "idx_orders_created_at",
            table: "orders",
            column: "created_at");

        migrationBuilder.CreateIndex(
            name: "idx_orders_idempotency_key",
            table: "orders",
            column: "idempotency_key");

        migrationBuilder.CreateIndex(
            name: "idx_orders_order_number",
            table: "orders",
            column: "order_number",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "idx_orders_status_payment",
            table: "orders",
            columns: new[] { "status", "payment_status" });

        migrationBuilder.CreateIndex(
            name: "idx_orders_user_id",
            table: "orders",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "idx_order_items_order_id",
            table: "order_items",
            column: "order_id");

        migrationBuilder.CreateIndex(
            name: "idx_order_items_variant_id",
            table: "order_items",
            column: "variant_id");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "order_items");

        migrationBuilder.DropTable(
            name: "orders");
    }
}
