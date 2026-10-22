#!/usr/bin/env bash
# ==============================================================================
# MadK Store - PostgreSQL Database Restore Script
# Sử dụng: ./scripts/restore-db.sh /path/to/backup.sql.gz [TARGET_DB]
# ==============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"
CONTAINER_NAME="${DB_CONTAINER_NAME:-madk-postgres}"
TARGET_DB="${2:-${POSTGRES_DB:-madkstore_prod}}"
DB_USER="${POSTGRES_USER:-madkstore}"

if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ LỖI: Vui lòng cung cấp đường dẫn hợp lệ tới file backup (.sql hoặc .sql.gz)!" >&2
    echo "Ví dụ: $0 /backups/postgresql/madkstore_prod_20261022_120000.sql.gz" >&2
    exit 1
fi

echo "=================================================="
echo "⚠️  CẢNH BÁO: Bắt đầu khôi phục dữ liệu vào ${TARGET_DB}..."
echo "File nguồn: ${BACKUP_FILE}"
echo "=================================================="

# Hàm giải nén và nạp dữ liệu
restore_stream() {
    if [[ "${BACKUP_FILE}" == *.gz ]]; then
        gunzip -c "${BACKUP_FILE}"
    else
        cat "${BACKUP_FILE}"
    fi
}

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "-> Đang nạp dữ liệu vào Docker container: ${CONTAINER_NAME}..."
    restore_stream | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${TARGET_DB}"
elif command -v psql >/dev/null 2>&1; then
    echo "-> Đang nạp dữ liệu qua psql trên host..."
    restore_stream | psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER}" -d "${TARGET_DB}"
else
    echo "❌ LỖI: Không tìm thấy container '${CONTAINER_NAME}' hoặc lệnh psql!" >&2
    exit 1
fi

echo "✅ Khôi phục cơ sở dữ liệu hoàn tất thành công!"
echo "=================================================="
