# Frontend - Tài chính AI

## Triển khai Docker đơn giản (không Nginx)

Dockerfile đa stage đã được thêm. Cách build và chạy:

```bash
# 1) Build image
docker build -t my-frontend .

# 2) Run container, map cổng 3000
docker run -d --name my-frontend -p 3000:3000 my-frontend

# 3) Kiểm tra
# Truy cập: http://<IP_VPS>:3000
```

Lưu ý:
- Image dùng `serve` để phục vụ thư mục `dist`. Ứng dụng đã được build bằng Vite ở stage builder.
- Không cần Nginx. Nếu muốn HTTPS/HTTP2/Cache nâng cao, cân nhắc thêm reverse proxy sau này.
- File `.dockerignore` đã tối ưu context build.

Frontend cho hệ thống quản lý tài chính cá nhân với AI chat.

## 🚀 Cài đặt và chạy

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Chạy development server
```bash
npm run dev
```

### 3. Build production
```bash
npm run build
```

## 🏗️ Cấu trúc dự án

```
src/
├── api/
│   ├── backend.ts          # API service cho backend
│   └── index.ts           # API utilities
├── components/
│   ├── MainLayout.tsx     # Layout chính với navigation
│   ├── UserManagement.tsx # Quản lý người dùng
│   ├── ChatSystem.tsx     # Hệ thống chat AI
│   └── ApiTest.tsx        # Test API connection
├── App.tsx                # App component chính
└── main.tsx              # Entry point
```

## 🛠️ Công nghệ sử dụng

- **React 18** với TypeScript
- **Ant Design** cho UI components
- **Axios** cho API calls
- **Vite** cho build tool

## 📱 Tính năng chính

### 1. **Dashboard**
- Tổng quan hệ thống
- Thống kê cơ bản

### 2. **Quản lý người dùng**
- Tạo người dùng mới
- Xem danh sách người dùng
- Quản lý thông tin cá nhân

### 3. **Chat AI**
- Tạo phiên chat mới
- Gửi tin nhắn với AI
- Lưu lịch sử chat
- Test mock response

### 4. **API Test**
- Test kết nối backend
- Kiểm tra health endpoint
- Test các API functions

## ✅ Tích Hợp Hoàn Chỉnh với Backend

Frontend đã được tích hợp **hoàn toàn** với Backend API.

### Cấu Trúc API Integration

```
src/
├── services/
│   └── api.ts              # Tất cả API calls
├── components/
│   └── OCRUpload.tsx        # Upload hóa đơn
└── pages/
    ├── Chat.tsx            # Chat mock (backup)
    └── ChatBackend.tsx     # Chat với real API ⭐
```

### 🔗 Kết nối Backend

Frontend kết nối với backend tại: `http://localhost:8000`

#### Setup Environment

```bash
# Tạo file .env
cp .env.example .env

# Cập nhật API URL nếu cần
# VITE_API_BASE_URL=http://localhost:8000
```

### API Endpoints Được Sử Dụng:

**Chat:**
- `POST /api/v1/chat/sessions?user_id=xxx` - Tạo session
- `GET /api/v1/chat/sessions?user_id=xxx` - Lấy sessions
- `POST /api/v1/chat/` - Gửi tin nhắn ⭐
- `GET /api/v1/chat/history?session_id=xxx` - Lấy lịch sử
- `POST /api/v1/chat/suggestion` - Lấy suggestion

**OCR:**
- `POST /api/v1/ocr/expense:extract` - Upload hóa đơn ⭐

**Users:**
- `POST /api/v1/users/` - Tạo user
- `GET /api/v1/users/` - Lấy users

**Health:**
- `GET /health` - Health check

### 🚀 Quick Start

1. **Chạy Backend:**
```bash
cd Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. **Chạy Frontend:**
```bash
cd Frontend
npm install
npm run dev
```

3. **Mở browser:** `http://localhost:3000`

### 📖 Chi Tiết Tích Hợp

Xem file `INTEGRATION_GUIDE.md` để biết chi tiết về:
- Cách sử dụng API service
- Luồng xử lý messages
- OCR upload workflow
- Error handling
- Testing

## 🎨 UI/UX Features

- **Responsive design** với Ant Design
- **Dark/Light theme** support
- **Vietnamese localization**
- **Real-time chat interface**
- **Form validation**
- **Loading states**
- **Error handling**

## 🚀 Development

```bash
# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📋 Requirements

- Node.js 16+
- Backend server chạy tại port 8000
- PostgreSQL database
- Redis (optional) 