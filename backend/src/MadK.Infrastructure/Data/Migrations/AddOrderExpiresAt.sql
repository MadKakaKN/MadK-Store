-- Migration: Thêm cột expires_at và index phục vụ job quét đơn quá hạn thanh toán
ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status_expires ON orders (status, expires_at);
