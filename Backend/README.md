

Backend API cho dự án. Phiên bản này chuyển sang Python + FastAPI.

## Cấu Trúc Dự Án (Python/FastAPI)

```
backend/
|-- app/
|   |-- main.py           # Entry FastAPI (uvicorn)
|   |-- api/
|   |   |-- v1/
|   |   |   |-- routes.py # Routers phiên bản v1
|   |-- core/
|   |   |-- config.py     # Cấu hình & env
|   |   |-- logging.py    # Cấu hình logging
|   |-- db/
|   |   |-- session.py    # Kết nối SQLAlchemy Async (PostgreSQL)
|   |-- redis/
|   |   |-- client.py     # Kết nối Redis async
|   |-- deps/
|   |   |-- deps.py       # Dependencies chung (DB session, etc.)
|-- tests/                # Unit/Integration tests (pytest)
|-- requirements.txt      # Danh sách package Python
|-- pyproject.toml        # Tuỳ chọn: quản lý tool (ruff/black/mypy)
|-- docker/
|   |-- Dockerfile        # Image Python
|   |-- docker-compose.yml# Dịch vụ DB/Redis (tuỳ chọn)
|-- .env                  # Biến môi trường
|-- README.md             # Hướng dẫn setup và chạy
```

## Công Nghệ Sử Dụng

- **Python 3.11+**
- **FastAPI**: Web framework hiệu năng cao
- **Uvicorn**: ASGI server
- **SQLAlchemy Async** + **asyncpg**: PostgreSQL
- **redis**/**aioredis**: Redis client async
- **Pydantic v2**: Schema validation
- **pytest**: Testing
- **loguru** hoặc logging chuẩn: Logging

## Cài Đặt

1. Clone dự án:
   ```
   git clone <repository-url>
   cd backend
   ```

2. Tạo venv và cài đặt dependencies:
   ```
   python -m venv .venv
   .venv\\Scripts\\activate
   pip install -r requirements.txt
   ```

3. Tạo file .env:
   ```
# Backend Configuration
APP_HOST=0.0.0.0
APP_PORT=8000
ENV=development
API_PREFIX=/api/v1

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=2010
DB_NAME=postgres
DB_PORT=5432
# Alternative: Use DATABASE_URL instead of individual variables
# DATABASE_URL=postgresql+asyncpg://postgres:2010@localhost:5432/postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your_redis_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_me_in_production
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=INFO

# API Configuration (AI Chat Provider)
# Documentation: 
CHAT_API_BASE=
CHAT_API_KEY=
CHAT_MODEL=gpt-4o
CHAT_MAX_TOKENS=1000
CHAT_TEMPERATURE=0.2

# Available Models on YEScale:
# - gpt-4o (recommended)
# - gpt-4o-mini
# - gpt-3.5-turbo
# - claude-3-5-sonnet-20241022
# - claude-3-5-haiku-20241022
# - gemini-2.0-flash-exp
# - gemini-1.5-pro
# - deepseek-chat
# - deepseek-coder
   ```

## Chạy Dự Ánn

### Môi trường phát triển:
```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production:
```
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Chạy unit test:
```
pytest -q
```

## API Documentation

Truy cập `http://localhost:8000/docs` (Swagger UI) hoặc `/redoc`.

- Tài liệu chi tiết: xem `Backend/API_GUIDE.md`.

## Chat API Usage

### 1. Tạo User
```bash
POST /api/v1/users/
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "User Name"
}
```

### 2. Tạo Session
```bash
POST /api/v1/chat/sessions?user_id=3a1e7c5c-0a22-4f3f-9f2d-5e9a3a1b2c3d
```

### 3. Lấy danh sách Sessions
```bash
GET /api/v1/chat/sessions?user_id=3a1e7c5c-0a22-4f3f-9f2d-5e9a3a1b2c3d
```

### 4. Gửi tin nhắn
```bash
POST /api/v1/chat/
{
  "user_id": "3a1e7c5c-0a22-4f3f-9f2d-5e9a3a1b2c3d",
  "session_id": "0f7a2b9c-6d55-4b1f-8c21-1234567890ab",
  "query": "Xin chào!"
}
```

### Luồng hoạt động:
1. **User** → **Session** → **Message**
2. Mỗi tin nhắn được lưu vào database
3. Lịch sử chat được lưu và có thể truy xuất
4. Sử dụng Google API để xử lý AI chat

## Transactions API (Quản lý thu/chi)

### 1. Tạo giao dịch
```bash
POST /api/v1/transactions/
{
  "user_id": "3a1e7c5c-0a22-4f3f-9f2d-5e9a3a1b2c3d",
  "amount": 1500000,
  "type": "income",            # "income" | "expense"
  "category": "salary",
  "note": "Lương tháng 10",
  "occurred_at": "2025-10-01 09:00:00"
}
```

Tham số body:
- `user_id` (string UUID): ID người dùng sở hữu giao dịch. Bắt buộc.
- `amount` (number > 0): Số tiền dương; loại giao dịch quyết định thu/chi. Bắt buộc.
- `type` (string): `income` (thu) hoặc `expense` (chi). Bắt buộc.
- `category` (string, optional): Danh mục, ví dụ `salary`, `food`, `rent`, ...
- `note` (string, optional): Ghi chú ngắn.
- `occurred_at` (chuỗi thời gian VN): Chỉ chấp nhận định dạng `YYYY-MM-DD HH:MM:SS` (giờ Việt Nam).

Lưu ý về thời gian:
- Chỉ chấp nhận chuỗi thời gian theo định dạng duy nhất: `YYYY-MM-DD HH:MM:SS` (giờ Việt Nam - UTC+7). Ví dụ: `2025-10-08 14:30:45`.
- Hệ thống sẽ chuyển sang UTC-naive trước khi lưu/truy vấn.

Ví dụ có giây:
```json
{
  "user_id": "3a1e7c5c-0a22-4f3f-9f2d-5e9a3a1b2c3d",
  "amount": 50000,
  "type": "expense",
  "category": "food",
  "note": "ăn trưa",
  "occurred_at": "2025-10-08 14:30:45"
}
```

Phản hồi (201): Đối tượng giao dịch gồm `id`, `created_at` và các trường đã gửi.

### 2. Lấy tổng thu/chi theo khoảng thời gian
```bash
GET /api/v1/transactions/summary?user_id=3a1e7c5c-0a22-4f3f-9f2d-5e9a3a1b2c3d&start=2025-10-01 00:00:00&end=2025-11-01 00:00:00
```

Query params:
- `user_id` (string UUID): Người dùng cần thống kê.
- `start` (ISO datetime): Thời điểm bắt đầu (bao gồm).
- `end` (ISO datetime): Thời điểm kết thúc (loại trừ).

Lưu ý về thời gian `start`/`end`:
- Chỉ chấp nhận định dạng `YYYY-MM-DD HH:MM:SS` (giờ Việt Nam - UTC+7). Ví dụ: `start=2025-10-01 00:00:00`.

Phản hồi (200):
```json
{
  "income": 1500000.0,
  "expense": 500000.0,
  "net": 1000000.0
}
```

## Tính Năng Chính

- Xác thực và phân quyền
- Quản lý người dùng
- [Các tính năng khác]

## Tác Giả

[Nguyễn Thanh Thảo] 