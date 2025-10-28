# Database Migrations

Thư mục này chứa các migration files cho database schema.

## Cài đặt Alembic

```bash
pip install alembic
```

## Chạy migrations

### 1. Tạo migration mới (auto-generate):
```bash
alembic revision --autogenerate -m "Description of changes"
```

### 2. Tạo migration trống:
```bash
alembic revision -m "Description of changes"
```

### 3. Chạy migration (upgrade):
```bash
alembic upgrade head
```

### 4. Rollback migration:
```bash
alembic downgrade -1
```

### 5. Xem lịch sử migration:
```bash
alembic history
```

### 6. Xem trạng thái hiện tại:
```bash
alembic current
```

## Migration hiện có

- **0000**: Tạo bảng `users` (bảng người dùng)
- **0001**: Tạo bảng `sessions` và `messages` cho chat system

## Lưu ý

- Luôn backup database trước khi chạy migration
- Test migration trên môi trường development trước
- Không edit migration files đã được chạy trên production
