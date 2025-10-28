Backend – Hướng dẫn chạy và sử dụng API

## Yêu cầu hệ thống

- Python 3.11+
- PostgreSQL (có user/password và database sẵn)
- Redis (tùy chọn nhưng khuyến nghị để tăng tốc cache lịch sử chat)

## Cài đặt và chạy Backend

1) Tạo môi trường ảo và cài dependencies:

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2) Tạo file .env (tham khảo các biến sau):

```
# Backend
APP_HOST=0.0.0.0
APP_PORT=8000
ENV=development
API_PREFIX=/api/v1

# Database (PostgreSQL)
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=2010
DB_NAME=postgres
DB_PORT=5432
# Hoặc dùng DATABASE_URL: postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DBNAME
# DATABASE_URL=postgresql+asyncpg://postgres:2010@localhost:5432/postgres

# Redis (khuyến nghị)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=<password>

# JWT
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d

# Logging
LOG_LEVEL=INFO

# YEScale API (AI Provider)
CHAT_API_BASE=https://im06lq19wz.apifox.cn/api-262294474
CHAT_API_KEY=<your_api_key>
CHAT_MODEL=gpt-4o
CHAT_MAX_TOKENS=1000
CHAT_TEMPERATURE=0.2
```

3) Chạy ứng dụng (dev):

```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4) Môi trường production (ví dụ đơn giản):

```
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

5) Kiểm tra tài liệu Swagger:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Cấu trúc API

- Base URL: `http://<HOST>:<PORT>` (mặc định `http://localhost:8000`)
- API Prefix: lấy từ `API_PREFIX` trong `.env` (mặc định `/api/v1`)
- Ví dụ đầy đủ: `http://localhost:8000/api/v1`

## Các nhóm API chính

### Chat

- Tạo session chat
  - Method: `POST`
  - URL: `/chat/sessions?user_id=<USER_ID>`
  - Response: `SessionResponse`

- Danh sách sessions của user
  - Method: `GET`
  - URL: `/chat/sessions?user_id=<USER_ID>`
  - Response: `SessionResponse[]`

- Lấy lịch sử (luồng) chat theo session
  - Method: `GET`
  - URL: `/chat/history?session_id=<SESSION_ID>&limit=<N>`
  - Response: `ChatMessage[]`
  - Ghi chú: ưu tiên lấy từ Redis cache, nếu miss sẽ truy vấn DB.

- Gửi tin nhắn chat
  - Method: `POST`
  - URL: `/chat/`
  - Body (JSON):
    ```json
    {
      "user_id": "<USER_ID>",
      "session_id": "<SESSION_ID>",
      "query": "Xin chào!",
      "suggestion": false
    }
    ```
  - Response: `ChatResponse`

## Ví dụ gọi API

### PowerShell (Windows)

```powershell
$base = "http://localhost:8000/api/v1"

# Tạo session
Invoke-RestMethod -Method POST "$base/chat/sessions?user_id=<USER_ID>"

# Danh sách sessions
Invoke-RestMethod -Method GET "$base/chat/sessions?user_id=<USER_ID>"

# Lịch sử chat (tăng limit để lấy nhiều hơn)
Invoke-RestMethod -Method GET "$base/chat/history?session_id=<SESSION_ID>&limit=100"

# Gửi tin nhắn
$body = @{ user_id = "<USER_ID>"; session_id = "<SESSION_ID>"; query = "Xin chào" } | ConvertTo-Json
Invoke-RestMethod -Method POST "$base/chat/" -ContentType "application/json" -Body $body
```

### cURL

```bash
BASE="http://localhost:8000/api/v1"

# Tạo session
curl -X POST "$BASE/chat/sessions?user_id=<USER_ID>"

# Danh sách sessions
curl "$BASE/chat/sessions?user_id=<USER_ID>"

# Lịch sử chat
curl "$BASE/chat/history?session_id=<SESSION_ID>&limit=100"

# Gửi tin nhắn
curl -X POST "$BASE/chat/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "<USER_ID>",
    "session_id": "<SESSION_ID>",
    "query": "Xin chào!"
  }'
```

## Lưu ý triển khai

- Redis cache: nếu `REDIS_HOST/PORT` hợp lệ, lịch sử chat sẽ được cache để giảm truy vấn DB.
- Migrations (nếu có): đảm bảo schema DB đã khớp với models trước khi chạy.
- Bảo mật: thay `JWT_SECRET`, `CHAT_API_KEY` trước khi đưa vào production.


