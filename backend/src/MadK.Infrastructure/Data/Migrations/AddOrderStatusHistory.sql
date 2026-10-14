-- =========================================================================
-- Migration: AddOrderStatusHistory (order_status_histories)
-- =========================================================================

CREATE TABLE IF NOT EXISTS order_status_histories (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(30) NULL,
    to_status VARCHAR(30) NOT NULL,
    changed_by_user_id UUID NULL,
    changed_by_name VARCHAR(100) NOT NULL,
    reason VARCHAR(500) NULL,
    note VARCHAR(1000) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_order_status_histories_order_id ON order_status_histories(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_histories_created_at ON order_status_histories(created_at);
