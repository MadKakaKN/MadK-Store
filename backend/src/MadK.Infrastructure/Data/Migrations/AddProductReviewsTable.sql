-- ============================================================================
-- Migration: AddProductReviewsTable
-- Description: Tạo bảng product_reviews và chỉ mục phục vụ đánh giá sản phẩm
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(150),
    comment TEXT NOT NULL,
    images_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'Approved',
    admin_reply TEXT,
    admin_replied_at TIMESTAMPTZ,
    helpful_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_product_reviews_product_id_status ON public.product_reviews(product_id, status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS ix_product_reviews_user_id ON public.product_reviews(user_id);
