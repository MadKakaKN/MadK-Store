-- Add payments table for VNPay transaction auditing and reconciliation
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    txn_ref VARCHAR(100) NOT NULL,
    transaction_no VARCHAR(100),
    amount NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    payment_method VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    bank_code VARCHAR(50),
    bank_tran_no VARCHAR(100),
    card_type VARCHAR(50),
    order_info VARCHAR(255),
    response_code VARCHAR(10),
    transaction_status VARCHAR(10),
    secure_hash VARCHAR(256),
    raw_payload TEXT NOT NULL DEFAULT '{}',
    ip_address VARCHAR(50),
    payment_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_number ON payments(order_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_txn_ref ON payments(txn_ref);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_no ON payments(transaction_no);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
