#!/usr/bin/env bash
# ==============================================================================
# MadK Store - 1-Click Automated VPS Setup & Bootstrap Script
# Tự động hóa toàn bộ: Cài Docker, Firewall, Tạo Secrets, Cấp SSL HTTPS, Khởi chạy
# Cách dùng:
#   chmod +x scripts/setup-vps.sh
#   ./scripts/setup-vps.sh --domain madk.store --email admin@madk.store
# ==============================================================================
set -euo pipefail

DOMAIN=""
EMAIL=""
APP_DIR="/opt/madk-store"

while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--domain)
      DOMAIN="$2"
      shift 2
      ;;
    -e|--email)
      EMAIL="$2"
      shift 2
      ;;
    -p|--path)
      APP_DIR="$2"
      shift 2
      ;;
    *)
      echo "Tham số không hợp lệ: $1"
      exit 1
      ;;
  esac
done

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "❌ LỖI: Vui lòng cung cấp Domain và Email!"
  echo "Ví dụ: sudo ./scripts/setup-vps.sh --domain madk.store --email admin@madk.store"
  exit 1
fi

echo "=================================================================="
echo "🚀 BẮT ĐẦU TỰ ĐỘNG HÓA THIẾT LẬP MÁY CHỦ CHO MADK STORE"
echo "Tên miền : $DOMAIN"
echo "Email SSL: $EMAIL"
echo "Thư mục  : $APP_DIR"
echo "=================================================================="

# 1. Cập nhật hệ thống & Cài đặt gói thiết yếu
echo "📦 [1/6] Cập nhật Ubuntu và cài đặt các gói hệ thống..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw openssl ca-certificates gnupg

# 2. Cài đặt Docker Engine & Docker Compose tự động
if ! command -v docker &> /dev/null; then
  echo "🐳 [2/6] Đang tự động cài đặt Docker Engine chính thức..."
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
  sudo systemctl enable docker
  sudo systemctl start docker
  rm -f /tmp/get-docker.sh
else
  echo "✅ [2/6] Docker đã được cài đặt sẵn."
fi

# 3. Cấu hình tường lửa UFW an toàn
echo "🛡️ [3/6] Cấu hình tường lửa UFW (chỉ mở cổng 22, 80, 443)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Let Encrypt'
sudo ufw allow 443/tcp comment 'HTTPS MadK Store'
sudo ufw --force enable

# 4. Sinh Secrets ngẫu nhiên mạnh và tạo file .env tự động
echo "🔑 [4/6] Tự động sinh khóa bảo mật & khởi tạo file .env sản xuất..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

generate_secret() {
  openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
}

POSTGRES_PWD=$(generate_secret)
REDIS_PWD=$(generate_secret)
RABBITMQ_PWD=$(generate_secret)
JWT_KEY=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | head -c 64)

if [ ! -f .env ]; then
  cat <<EOF > .env
# Auto-generated Production Secrets for MadK Store
# Generated at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

DOMAIN=$DOMAIN
SITE_URL=https://$DOMAIN

# Database Secrets
POSTGRES_DB=madkstore_prod
POSTGRES_USER=madkstore
POSTGRES_PASSWORD=$POSTGRES_PWD

# Cache & Message Queue
REDIS_PASSWORD=$REDIS_PWD
RABBITMQ_PASSWORD=$RABBITMQ_PWD

# JWT Signing Key (64 characters)
JWT_SECRET_KEY=$JWT_KEY

# Payment Gateway (VNPay Sandbox Default)
VNPAY_TMN_CODE=MADKTEST
VNPAY_HASH_SECRET=MADK_VNPAY_SECRET_KEY_FOR_LOCAL_TESTING_2026

# Email SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=

# Error Monitoring (Optional)
SENTRY_DSN=
EOF
  chmod 600 .env
  echo "✅ Đã tạo file .env với các mật khẩu ngẫu nhiên bảo mật cao."
else
  echo "ℹ️ File .env đã tồn tại, giữ nguyên cấu hình hiện có."
fi

# 5. Cấp chứng chỉ SSL/TLS miễn phí qua Certbot
echo "🔒 [5/6] Tự động cấp chứng chỉ bảo mật HTTPS (Let's Encrypt)..."
mkdir -p ./certbot/conf ./certbot/www ./nginx/ssl

# Kiểm tra nếu chưa có chứng chỉ thì cấp mới qua Certbot standalone
if [ ! -d "./certbot/conf/live/$DOMAIN" ]; then
  echo "-> Đang xin cấp chứng chỉ SSL cho $DOMAIN và www.$DOMAIN..."
  sudo docker run -it --rm --name certbot-init \
    -p 80:80 \
    -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
    -v "$(pwd)/certbot/www:/var/www/certbot" \
    certbot/certbot certonly --standalone \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --email "$EMAIL" --agree-tos --non-interactive || {
      echo "⚠️ Không thể cấp chứng chỉ SSL qua Certbot (kiểm tra lại trỏ DNS IP VPS)."
      echo "Tự động sinh chứng chỉ tự ký tạm thời (Self-signed) để Nginx khởi động thành công..."
      mkdir -p "./certbot/conf/live/$DOMAIN"
      openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "./certbot/conf/live/$DOMAIN/privkey.pem" \
        -out "./certbot/conf/live/$DOMAIN/fullchain.pem" \
        -subj "/CN=$DOMAIN"
    }
fi

# Cấu hình tự động gia hạn chứng chỉ (Cron Renewal)
CRON_JOB="0 3 * * * docker run --rm -v $(pwd)/certbot/conf:/etc/letsencrypt -v $(pwd)/certbot/www:/var/www/certbot certbot/certbot renew --quiet && docker exec madk-proxy nginx -s reload"
(crontab -l 2>/dev/null | grep -F "certbot renew" ) || (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

# 6. Khởi động toàn bộ cụm dịch vụ Production
echo "🚀 [6/6] Khởi chạy các container bằng docker-compose.prod.yml..."
sudo docker compose -f docker-compose.prod.yml up -d --build

# 7. Kiểm tra sức khỏe (Health Check)
echo "⏳ Đang chờ hệ thống khởi động hoàn tất (20s)..."
sleep 20

if curl -s -k -f "http://localhost/health" > /dev/null || curl -s -k -f "https://localhost/health" > /dev/null; then
  echo "=================================================================="
  echo "🎉 CHÚC MỪNG! WEBSITE MADK STORE ĐÃ ĐƯỢC TỰ ĐỘNG HÓA THÀNH CÔNG!"
  echo "🌐 Truy cập website tại: https://$DOMAIN"
  echo "📊 Kiểm tra tình trạng : https://$DOMAIN/health"
  echo "=================================================================="
else
  echo "⚠️ Dịch vụ đã khởi chạy. Vui lòng kiểm tra log nếu cần: docker compose -f docker-compose.prod.yml logs"
fi
