-- ============================================================================
-- Migration: AddWishlistTable
-- Description: Tạo bảng wishlist_items phục vụ danh sách yêu thích của khách hàng
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_wishlist_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS ix_wishlist_items_user_id ON public.wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS ix_wishlist_items_product_id ON public.wishlist_items(product_id);
