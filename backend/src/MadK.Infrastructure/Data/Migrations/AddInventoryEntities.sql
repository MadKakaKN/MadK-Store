-- =========================================================================
-- Migration: AddInventoryEntities (inventories, stock_movements)
-- =========================================================================

CREATE TABLE IF NOT EXISTS inventories (
    id UUID PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    on_hand_quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    CONSTRAINT chk_inventory_on_hand CHECK (on_hand_quantity >= 0),
    CONSTRAINT chk_inventory_reserved CHECK (reserved_quantity >= 0),
    CONSTRAINT chk_inventory_available CHECK (on_hand_quantity - reserved_quantity >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventories_variant_id ON inventories(variant_id);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    quantity INT NOT NULL,
    on_hand_before INT NOT NULL,
    on_hand_after INT NOT NULL,
    reserved_before INT NOT NULL,
    reserved_after INT NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id VARCHAR(100) NULL,
    reason VARCHAR(500) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_variant_id ON stock_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_id ON stock_movements(inventory_id);
