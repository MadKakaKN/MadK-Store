-- =========================================================================
-- Migration: AddCartEntities (carts, cart_items, stock_quantity on variants)
-- =========================================================================

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 50;

CREATE TABLE IF NOT EXISTS carts (
    id UUID PRIMARY KEY,
    user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    anonymous_id VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_anonymous_id ON carts(anonymous_id);

CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT idx_cart_items_cart_variant_unique UNIQUE (cart_id, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);
