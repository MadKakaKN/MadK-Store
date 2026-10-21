-- Migration: AddSoftDeleteToCatalog
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE brands ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT FALSE;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT FALSE;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;
