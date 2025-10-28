# Docker Setup với Auto Migration

## 🚀 Cách chạy

### 1. Chạy toàn bộ stack (Database + Redis + App)
```bash
cd Chat/Backend
docker compose -f docker/docker-compose.yml up --build
```

### 2. Chạy trong background
```bash
docker compose -f docker/docker-compose.yml up -d --build
```

### 3. Xem logs
```bash
# Xem logs của app
docker compose -f docker/docker-compose.yml logs -f app

# Xem logs của database
docker compose -f docker/docker-compose.yml logs -f db

# Xem logs của Redis
docker compose -f docker/docker-compose.yml logs -f redis
```

## 🔧 Auto Migration Features

### ✅ Tự động chạy migration khi start
- Kiểm tra kết nối database
- Chạy `alembic upgrade head`
- Start FastAPI application

### 📋 Migration Process
1. **Database Health Check**: Kiểm tra kết nối PostgreSQL
2. **Migration Status**: Hiển thị trạng thái migration hiện tại
3. **Run Migrations**: Chạy `alembic upgrade head`
4. **Start App**: Khởi động FastAPI server

### 🎯 Endpoints sau khi chạy
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

## 🛠️ Troubleshooting

### Lỗi Migration
```bash
# Xem logs chi tiết
docker compose -f docker/docker-compose.yml logs app

# Chạy migration thủ công
docker compose -f docker/docker-compose.yml exec app alembic upgrade head
```

### Lỗi Database Connection
```bash
# Kiểm tra database
docker compose -f docker/docker-compose.yml exec db psql -U postgres -d postgres -c "SELECT 1;"

# Kiểm tra Redis
docker compose -f docker/docker-compose.yml exec redis redis-cli -a 2010 ping
```

### Reset Database
```bash
# Xóa volumes và chạy lại
docker compose -f docker/docker-compose.yml down -v
docker compose -f docker/docker-compose.yml up --build
```

## 📊 Services

| Service | Port | Description |
|---------|------|-------------|
| **app** | 8000 | FastAPI Backend |
| **db** | 5434 | PostgreSQL Database |
| **redis** | 6380 | Redis Cache |

## 🔍 Health Checks

- **Database**: `pg_isready` check
- **Redis**: `redis-cli ping` check
- **App**: FastAPI health endpoint

## 📝 Environment Variables

Các biến môi trường được load từ `.env`:
- Database connection
- Redis connection  
- API keys
- OCR settings
