-- =========================================================================
-- Migration: AddAddressEntities (Provinces, Districts, Wards, Addresses)
-- Chuẩn hành chính Việt Nam & Sổ địa chỉ người dùng
-- =========================================================================

CREATE TABLE IF NOT EXISTS provinces (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    code_name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS districts (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    code_name VARCHAR(100) NOT NULL,
    province_code VARCHAR(20) NOT NULL REFERENCES provinces(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_districts_province_code ON districts(province_code);

CREATE TABLE IF NOT EXISTS wards (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    code_name VARCHAR(100) NOT NULL,
    district_code VARCHAR(20) NOT NULL REFERENCES districts(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wards_district_code ON wards(district_code);

CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    province_code VARCHAR(20) NOT NULL,
    province_name VARCHAR(100) NOT NULL,
    district_code VARCHAR(20) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    ward_code VARCHAR(20) NOT NULL,
    ward_name VARCHAR(100) NOT NULL,
    detailed_address VARCHAR(255) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
