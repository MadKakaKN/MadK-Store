# MadK Store 🛒⚡

MadK Store là nền tảng thương mại điện tử chuyên về thiết bị và phụ kiện công nghệ cao cấp, tích hợp trải nghiệm xem mô hình 3D tương tác.

---

## 🏗️ Kiến trúc & Công nghệ

- **Backend**:
  - .NET 8 Web API tuân thủ **Clean Architecture** (`Domain`, `Application`, `Infrastructure`, `API`).
  - **Database & Cache**: PostgreSQL 16 (EF Core 8 + Npgsql), Redis 7.
  - **Giám sát & Logging**: Serilog (Console + Rolling File logs), Correlation ID (`X-Correlation-Id`), Global Exception Handling Middleware trả định dạng lỗi chuẩn.
  - **Health Checks**: Endpoint `/health` kiểm tra trạng thái thời gian thực của PostgreSQL và Redis.
- **Frontend**:
  - React 18 + TypeScript + Vite.
  - Styling: TailwindCSS.
  - Quản lý route: React Router v6.
  - Quản lý HTTP: Axios client với cấu hình tập trung theo `VITE_API_BASE_URL`.
- **DevOps & CI/CD**:
  - Containerization: Docker Compose (API, PostgreSQL, Redis).
  - CI Pipeline: GitHub Actions tự động hóa build, test cho cả Backend và Frontend trên mỗi commit/PR.

---

## 📋 Yêu cầu môi trường

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/) & npm
- [Docker](https://www.docker.com/) & Docker Compose

---

## 🚀 Hướng dẫn khởi chạy dự án

### Cách 1: Khởi chạy toàn bộ bằng Docker Compose (Khuyến nghị)

1. Sao chép cấu hình biến môi trường:
   ```bash
   cp .env.example .env
   ```
   *(Cập nhật mật khẩu `POSTGRES_PASSWORD` nếu cần)*

2. Khởi động tất cả dịch vụ (PostgreSQL, Redis, Backend API):
   ```bash
   docker compose up -d --build
   ```

3. Truy cập các dịch vụ:
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **Swagger UI**: [http://localhost:5000/swagger](http://localhost:5000/swagger)
   - **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
   - **Sample Ping**: [http://localhost:5000/api/v1/ping](http://localhost:5000/api/v1/ping)

4. Chạy Frontend (phát triển cục bộ):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Giao diện Frontend sẽ chạy tại [http://localhost:5173](http://localhost:5173).

---

### Cách 2: Khởi chạy thủ công cho lập trình (Local Development)

#### 1. Khởi động PostgreSQL và Redis
```bash
docker compose up postgres redis -d
```

#### 2. Khởi chạy Backend
```bash
cd backend
dotnet run --project src/MadK.API
```
API sẽ lắng nghe tại `http://localhost:5000` (hoặc cổng cấu hình trong `launchSettings.json`).

#### 3. Khởi chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🩺 Giám sát & Health Check

Hệ thống cung cấp endpoint kiểm tra sức khỏe tại `/health`:

### Khi tất cả dịch vụ hoạt động bình thường
- **HTTP Status**: `200 OK`
- **Response**:
  ```json
  {
    "status": "Healthy",
    "totalDuration": "00:00:00.0152340",
    "entries": {
      "postgresql": {
        "status": "Healthy",
        "duration": "00:00:00.0081230",
        "description": null,
        "error": null
      },
      "redis": {
        "status": "Healthy",
        "duration": "00:00:00.0054320",
        "description": null,
        "error": null
      }
    }
  }
  ```

### Khi tắt một trong hai dịch vụ (ví dụ tắt Redis hoặc PostgreSQL)
- **HTTP Status**: `503 Service Unavailable`
- **Response**:
  ```json
  {
    "status": "Unhealthy",
    "totalDuration": "00:00:01.0251230",
    "entries": {
      "postgresql": {
        "status": "Healthy",
        "duration": "00:00:00.0071230",
        "description": null,
        "error": null
      },
      "redis": {
        "status": "Unhealthy",
        "duration": "00:00:01.0180000",
        "description": null,
        "error": "Redis connection failed"
      }
    }
  }
  ```

---

## 🛡️ Correlation ID & Xử lý lỗi toàn cục

1. **Correlation ID**: Mỗi request được gắn một `X-Correlation-Id` (tự động tạo mới dạng GUID nếu client không gửi). Header này được đính kèm vào response và Serilog `LogContext` để truy vết luồng xử lý xuyên suốt các log file.
2. **Global Exception Handling**: Mọi ngoại lệ chưa được xử lý sẽ được ghi log chi tiết phía server và trả về client với định dạng thống nhất:
   ```json
   {
     "isSuccess": false,
     "error": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
     "traceId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
   }
   ```
3. **Log Storage**: File log được lưu trữ tại `logs/madk-store-.log` theo cơ chế cuốn chiếu ngày (rolling interval daily).

---

## 🧪 Kiểm thử (Testing & Linting)

### Kiểm thử Backend
```bash
dotnet test backend/MadK.sln --verbosity normal
```

### Kiểm thử & Build Frontend
```bash
cd frontend
npm run lint     # Kiểm tra ESLint
npm run build    # Kiểm tra TypeScript type check và build Vite
```

---

## 🔄 CI Pipeline

Quy trình CI được cấu hình tại [`.github/workflows/ci.yml`](.github/workflows/ci.yml) và tự động kích hoạt khi có:
- Push lên các nhánh `main`, `phase-*`, `feat/*`
- Pull Request trỏ vào `main`

Pipeline bao gồm:
1. **Backend CI**: Restore, Build Release, Chạy toàn bộ Test Suites (.NET 8).
2. **Frontend CI**: Cài đặt phụ thuộc, Kiểm tra Linting, Build bundle production (Node.js 20).
