#!/usr/bin/env bash
# ==============================================================================
# MadK Store - Automated PostgreSQL Database Backup Script
# Chạy tự động qua Cron: 0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/madk_backup.log 2>&1
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/backups/postgresql}"
CONTAINER_NAME="${DB_CONTAINER_NAME:-madk-postgres}"
DB_NAME="${POSTGRES_DB:-madkstore_prod}"
DB_USER="${POSTGRES_USER:-madkstore}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/madkstore_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "=================================================="
echo "🕒 [$(date '+%Y-%m-%d %H:%M:%S')] Bắt đầu sao lưu cơ sở dữ liệu ${DB_NAME}..."
echo "=================================================="

# Thực hiện sao lưu nén gzip trực tiếp từ container PostgreSQL
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"
elif command -v pg_dump >/dev/null 2>&1; then
    pg_dump -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"
else
    echo "❌ LỖI: Không tìm thấy docker container '${CONTAINER_NAME}' hoặc lệnh pg_dump trên host!" >&2
    exit 1
fi

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "✅ Sao lưu thành công: ${BACKUP_FILE} (Kích thước: ${FILE_SIZE})"

# Tự động dọn dẹp các bản backup cũ hơn RETENTION_DAYS ngày
echo "🧹 Đang dọn dẹp các bản backup cũ hơn ${RETENTION_DAYS} ngày..."
find "${BACKUP_DIR}" -type f -name "madkstore_*.sql.gz" -mtime +"${RETENTION_DAYS}" -exec rm -f {} \;
echo "✅ Dọn dẹp hoàn tất."
echo "=================================================="
