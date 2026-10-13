-- =========================================================================
-- Migration: AddOrderEntities (orders, order_items)
-- =========================================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    customer_email VARCHAR(150) NULL,
    customer_phone VARCHAR(30) NULL,
    status VARCHAR(30) NOT NULL,
    payment_status VARCHAR(30) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    subtotal_amount NUMERIC(15,2) NOT NULL,
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    shipping_fee NUMERIC(15,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15,2) NOT NULL,
    shipping_address_snapshot JSONB NOT NULL,
    coupon_snapshot JSONB NULL,
    customer_note TEXT NULL,
    admin_note TEXT NULL,
    cancel_reason VARCHAR(255) NULL,
    cancelled_at TIMESTAMPTZ NULL,
    idempotency_key VARCHAR(150) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id UUID NULL REFERENCES product_variants(id) ON DELETE SET NULL,
    product_id UUID NULL REFERENCES products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(250) NOT NULL,
    variant_name_snapshot VARCHAR(200) NOT NULL,
    sku_snapshot VARCHAR(100) NOT NULL,
    unit_price_snapshot NUMERIC(15,2) NOT NULL,
    original_price_snapshot NUMERIC(15,2) NOT NULL,
    quantity INT NOT NULL,
    total_price NUMERIC(15,2) NOT NULL,
    attributes_snapshot JSONB NULL,
    specifications_snapshot JSONB NULL,
    thumbnail_url_snapshot VARCHAR(500) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_order_items_quantity CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
