-- Migration: Bảng coupons cho module Promotions & Discount
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    discount_type VARCHAR(30) NOT NULL DEFAULT 'Percentage',
    discount_value NUMERIC(15, 2) NOT NULL,
    max_discount_amount NUMERIC(15, 2),
    min_order_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INT,
    used_count INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_start_end_date ON coupons(start_date, end_date);
