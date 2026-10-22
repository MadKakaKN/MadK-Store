#!/usr/bin/env bash
# ==============================================================================
# MadK Store - Zero-Downtime Automated Deployment Script
# Tự động: Sao lưu trước khi deploy -> Kéo code mới -> Build -> Rolling update -> Health check -> Auto-rollback nếu lỗi
# ==============================================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/madk-store}"
COMPOSE_FILE="${APP_DIR}/docker-compose.prod.yml"

cd "$APP_DIR"

echo "=================================================================="
echo "🚀 [$(date '+%Y-%m-%d %H:%M:%S')] BẮT ĐẦU TRIỂN KHAI PHIÊN BẢN MỚI"
echo "=================================================================="

# 1. Tự động sao lưu database trước khi nâng cấp để đảm bảo an toàn tuyệt đối
echo "💾 [1/5] Sao lưu cơ sở dữ liệu an toàn trước khi deploy..."
if [ -f "./scripts/backup-db.sh" ]; then
  bash ./scripts/backup-db.sh || echo "⚠️ Cảnh báo: Sao lưu tự động gặp vấn đề, vẫn tiếp tục deploy."
fi

# 2. Cập nhật mã nguồn mới nhất từ Git
echo "📥 [2/5] Kéo mã nguồn mới nhất từ Git (branch main)..."
CURRENT_COMMIT=$(git rev-parse HEAD)
git fetch origin main
git reset --hard origin/main
NEW_COMMIT=$(git rev-parse HEAD)
echo "-> Commit trước: ${CURRENT_COMMIT:0:7} | Commit mới: ${NEW_COMMIT:0:7}"

# 3. Build container mới
echo "🔨 [3/5] Đang build các container mới..."
docker compose -f "$COMPOSE_FILE" build --parallel

# 4. Cập nhật dịch vụ không làm gián đoạn người dùng (Zero-Downtime Rolling Update)
echo "🔄 [4/5] Thực hiện nâng cấp dịch vụ..."
docker compose -f "$COMPOSE_FILE" up -d --no-deps api frontend reverse-proxy

# 5. Kiểm tra sức khỏe hệ thống (Health Check Verification)
echo "🩺 [5/5] Kiểm tra tình trạng hoạt động của phiên bản mới..."
MAX_RETRIES=10
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  sleep 5
  if docker exec madk-api curl -s -f http://localhost:8080/health > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "-> Đang kiểm tra sức khỏe lần $RETRY_COUNT/$MAX_RETRIES..."
done

if [ "$HEALTHY" = true ]; then
  echo "✅ TRIỂN KHAI THÀNH CÔNG! Hệ thống hoạt động hoàn hảo."
  # Dọn dẹp các image cũ để tiết kiệm dung lượng ổ cứng VPS
  docker image prune -f > /dev/null 2>&1 || true
  echo "=================================================================="
else
  echo "❌ PHÁT HIỆN LỖI: Phiên bản mới không vượt qua Health Check!"
  echo "⚠️ ĐANG TỰ ĐỘNG ROLLBACK VỀ PHIÊN BẢN ỔN ĐỊNH CŨ..."
  git reset --hard "$CURRENT_COMMIT"
  docker compose -f "$COMPOSE_FILE" up -d --build --no-deps api frontend
  echo "🔙 Đã rollback về commit: ${CURRENT_COMMIT:0:7}"
  exit 1
fi
