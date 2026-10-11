CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE brands (
    id uuid NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    logo_url character varying(500),
    description text,
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_brands" PRIMARY KEY (id)
);

CREATE TABLE categories (
    id uuid NOT NULL,
    parent_id uuid,
    name character varying(150) NOT NULL,
    slug character varying(180) NOT NULL,
    description text,
    icon_url character varying(500),
    display_order integer NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_categories" PRIMARY KEY (id),
    CONSTRAINT "FK_categories_categories_parent_id" FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE category_spec_templates (
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    schema_definition jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_category_spec_templates" PRIMARY KEY (id),
    CONSTRAINT "FK_category_spec_templates_categories_category_id" FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
);

CREATE TABLE products (
    id uuid NOT NULL,
    category_id uuid NOT NULL,
    brand_id uuid NOT NULL,
    name character varying(250) NOT NULL,
    slug character varying(280) NOT NULL,
    short_description character varying(500),
    description text,
    specifications jsonb NOT NULL DEFAULT '{}',
    model_3d_url character varying(500),
    thumbnail_url character varying(500),
    base_price numeric(15,2) NOT NULL,
    is_featured boolean NOT NULL DEFAULT FALSE,
    is_active boolean NOT NULL DEFAULT TRUE,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_products" PRIMARY KEY (id),
    CONSTRAINT "FK_products_brands_brand_id" FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE RESTRICT,
    CONSTRAINT "FK_products_categories_category_id" FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE product_variants (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    sku character varying(100) NOT NULL,
    name character varying(200) NOT NULL,
    attributes jsonb NOT NULL DEFAULT '{}',
    original_price numeric(15,2) NOT NULL,
    sale_price numeric(15,2) NOT NULL,
    cost_price numeric(15,2) NOT NULL DEFAULT 0.0,
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_product_variants" PRIMARY KEY (id),
    CONSTRAINT "FK_product_variants_products_product_id" FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE product_images (
    id uuid NOT NULL,
    product_id uuid NOT NULL,
    variant_id uuid,
    image_url character varying(500) NOT NULL,
    alt_text character varying(200),
    display_order integer NOT NULL DEFAULT 0,
    is_primary boolean NOT NULL DEFAULT FALSE,
    created_at timestamp with time zone NOT NULL DEFAULT (now()),
    updated_at timestamp with time zone,
    CONSTRAINT "PK_product_images" PRIMARY KEY (id),
    CONSTRAINT "FK_product_images_product_variants_variant_id" FOREIGN KEY (variant_id) REFERENCES product_variants (id) ON DELETE SET NULL,
    CONSTRAINT "FK_product_images_products_product_id" FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_brands_slug ON brands (slug);

CREATE INDEX idx_categories_is_active_order ON categories (is_active, display_order);

CREATE INDEX idx_categories_parent_id ON categories (parent_id);

CREATE UNIQUE INDEX idx_categories_slug ON categories (slug);

CREATE UNIQUE INDEX idx_category_spec_templates_category_id ON category_spec_templates (category_id);

CREATE INDEX idx_category_spec_templates_schema_gin ON category_spec_templates USING gin (schema_definition);

CREATE INDEX idx_product_images_product_id ON product_images (product_id);

CREATE INDEX idx_product_images_variant_id ON product_images (variant_id);

CREATE INDEX idx_product_variants_attributes_gin ON product_variants USING gin (attributes);

CREATE INDEX idx_product_variants_product_id ON product_variants (product_id);

CREATE INDEX idx_product_variants_sale_price ON product_variants (sale_price);

CREATE UNIQUE INDEX idx_product_variants_sku ON product_variants (sku);

CREATE INDEX idx_products_base_price ON products (base_price);

CREATE INDEX idx_products_brand_id ON products (brand_id);

CREATE INDEX idx_products_category_id ON products (category_id);

CREATE INDEX idx_products_search_vector_gin ON products USING gin (search_vector);

CREATE UNIQUE INDEX idx_products_slug ON products (slug);

CREATE INDEX idx_products_specifications_gin ON products USING gin (specifications);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261011112313_AddCatalogEntities', '8.0.11');

COMMIT;

