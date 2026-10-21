-- Migration: AddPriceSchedules
-- Supports time-based pricing, promotion schedules, and price change history per variant

CREATE TABLE IF NOT EXISTS price_schedules (
    id UUID PRIMARY KEY,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    price_type INT NOT NULL DEFAULT 2,
    price NUMERIC(15,2) NOT NULL,
    original_price NUMERIC(15,2) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NULL,
    reason VARCHAR(250) NOT NULL,
    note TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by VARCHAR(150) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_price_schedules_variant_id ON price_schedules(variant_id);
CREATE INDEX IF NOT EXISTS idx_price_schedules_dates ON price_schedules(variant_id, start_date, end_date, is_active) WHERE is_deleted = FALSE;
