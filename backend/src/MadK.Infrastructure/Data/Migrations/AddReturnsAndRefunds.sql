-- Migration: Bảng ReturnRequest và ReturnRequestItem phục vụ nghiệp vụ Đổi trả & Hoàn tiền
CREATE TABLE IF NOT EXISTS return_requests (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(150),
    customer_email VARCHAR(150),
    customer_phone VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    reason VARCHAR(255) NOT NULL,
    customer_note TEXT,
    refund_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    refund_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    refund_transaction_no VARCHAR(100),
    refunded_at TIMESTAMP WITH TIME ZONE,
    sales_note TEXT,
    rejection_reason TEXT,
    processed_by_user_id UUID,
    processed_by_name VARCHAR(150),
    processed_at TIMESTAMP WITH TIME ZONE,
    is_restocked BOOLEAN NOT NULL DEFAULT FALSE,
    restocked_at TIMESTAMP WITH TIME ZONE,
    idempotency_key VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS return_request_items (
    id UUID PRIMARY KEY,
    return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
    order_item_id UUID,
    variant_id UUID,
    product_name VARCHAR(255) NOT NULL,
    variant_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    total_price NUMERIC(15, 2) NOT NULL,
    reason VARCHAR(255),
    condition VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order_number ON return_requests(order_number);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_requests_refund_status ON return_requests(refund_status);
CREATE INDEX IF NOT EXISTS idx_return_requests_idempotency_key ON return_requests(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_return_requests_created_at ON return_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_return_request_items_request_id ON return_request_items(return_request_id);
CREATE INDEX IF NOT EXISTS idx_return_request_items_variant_id ON return_request_items(variant_id);
