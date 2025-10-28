# USER FLOW - LUỒNG CHAT

## Tổng quan hệ thống

Hệ thống chat AI được xây dựng bằng FastAPI với các tính năng:
- Quản lý session chat
- Tích hợp Redis cache
- Hệ thống suggestion thông minh
- Error handling với fallback
- Metadata storage

## 1. KHỞI TẠO VÀ QUẢN LÝ SESSION

### 1.1 Tạo session mới
```
User đăng nhập → Tạo session mới → POST /api/v1/chat/sessions
→ Backend tạo Session trong DB → Trả về SessionResponse với session_id
→ Lưu session_id vào frontend state
```

**API Endpoint:**
- `POST /api/v1/chat/sessions`
- **Request:** `user_id: str`
- **Response:** `SessionResponse`

### 1.2 Lấy danh sách sessions
```
User muốn xem danh sách chat → GET /api/v1/chat/sessions
→ Backend query sessions từ DB → Trả về list SessionResponse
→ Hiển thị danh sách sessions
```

**API Endpoint:**
- `GET /api/v1/chat/sessions`
- **Request:** `user_id: str`
- **Response:** `list[SessionResponse]`

## 2. LUỒNG CHAT CHÍNH

### 2.1 Gửi tin nhắn chat
```
User nhập tin nhắn → Frontend gửi ChatRequest → POST /api/v1/chat/
→ Backend xác thực session_id và user_id
→ Lấy chat history từ Redis cache
→ Nếu cache miss: Lấy từ Database và cache vào Redis
→ Build messages với system prompt
→ Lưu tin nhắn user vào DB + Redis
→ Gọi AI Provider
→ Lưu response AI vào DB + Redis
→ Trả về ChatResponse
→ Frontend hiển thị kết quả
```

**API Endpoint:**
- `POST /api/v1/chat/`
- **Request:** `ChatRequest`
- **Response:** `ChatResponse`

### 2.2 Lấy lịch sử chat
```
User chọn session → GET /api/v1/chat/history?session_id=xxx
→ Backend kiểm tra Redis cache
→ Nếu cache miss: Lấy từ Database và cache vào Redis
→ Trả về list ChatMessage
→ Frontend hiển thị lịch sử
```

**API Endpoint:**
- `GET /api/v1/chat/history`
- **Request:** `session_id: str, limit: int = 20`
- **Response:** `list[ChatMessage]`

## 3. LUỒNG SUGGESTION (GỢI Ý)

### 3.1 Suggestion song song với chat
```
User bật suggestion → Frontend gửi ChatRequest với suggestion=true
→ Backend xử lý song song:
  - Chat inference
  - Suggestion inference
→ Lưu chat response và suggestion vào metadata
→ Trả về ChatResponse với suggestion
→ Frontend hiển thị chat + suggestion
```

### 3.2 Suggestion riêng biệt
```
User muốn suggestion riêng → POST /api/v1/chat/suggestion
→ Backend dùng suggestion prompt
→ Trả về SuggestionResponse
→ Frontend hiển thị suggestion
```

**API Endpoint:**
- `POST /api/v1/chat/suggestion`
- **Request:** `SuggestionRequest`
- **Response:** `SuggestionResponse`

## 4. LUỒNG CACHE MANAGEMENT

### 4.1 Xóa cache
```
User muốn xóa cache → DELETE /api/v1/chat/cache/{session_id}
→ Backend xóa Redis cache
→ Trả về success message
```

### 4.2 Xem thống kê cache
```
User muốn xem cache stats → GET /api/v1/chat/cache/{session_id}/stats
→ Backend lấy thống kê từ Redis
→ Trả về cache statistics
```

**API Endpoints:**
- `DELETE /api/v1/chat/cache/{session_id}`
- `GET /api/v1/chat/cache/{session_id}/stats`

## 5. DATA MODELS

### 5.1 ChatRequest
```json
{
  "user_id": "string",
  "session_id": "string", 
  "query": "string",
  "suggestion": false
}
```

### 5.2 ChatResponse
```json
{
  "answer": "string",
  "suggestion": "string",
  "session_id": "string"
}
```

### 5.3 SessionResponse
```json
{
  "id": "string",
  "user_id": "string", 
  "session_name": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "is_active": true
}
```

### 5.4 ChatMessage
```json
{
  "role": "user|assistant|system",
  "content": "string"
}
```

### 5.5 SuggestionRequest
```json
{
  "user_id": "string",
  "session_id": "string",
  "context": "string",
  "query": "string"
}
```

### 5.6 SuggestionResponse
```json
{
  "suggestion": "string",
  "session_id": "string"
}
```

## 6. TÍNH NĂNG NỔI BẬT

### 6.1 Redis Cache
- Ưu tiên cache để tăng tốc độ
- TTL: 1 giờ
- Tối đa 20 messages trong cache
- Fallback về database khi cache miss

### 6.2 Session Management
- Quản lý nhiều cuộc trò chuyện
- Tự động tạo session name theo thời gian
- Xác thực quyền truy cập session

### 6.3 Suggestion System
- Gợi ý thông minh song song với chat
- Suggestion riêng biệt khi cần
- Lưu suggestion vào metadata

### 6.4 Error Handling
- Fallback khi AI service lỗi
- Mock response khi API lỗi
- Graceful degradation

### 6.5 Metadata Storage
- Lưu thông tin bổ sung trong message
- Suggestion, tokens, etc.
- JSON format linh hoạt

### 6.6 Cache Statistics
- Theo dõi hiệu suất cache
- Message count, TTL
- Debug và monitoring

## 7. API ENDPOINTS TỔNG HỢP

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/chat/sessions` | Tạo session mới |
| GET | `/api/v1/chat/sessions` | Lấy danh sách sessions |
| POST | `/api/v1/chat/` | Gửi tin nhắn chat |
| GET | `/api/v1/chat/history` | Lấy lịch sử chat |
| POST | `/api/v1/chat/suggestion` | Lấy gợi ý riêng |
| DELETE | `/api/v1/chat/cache/{session_id}` | Xóa cache |
| GET | `/api/v1/chat/cache/{session_id}/stats` | Thống kê cache |
| POST | `/api/v1/chat/mock` | Test endpoint với mock response |
| GET | `/api/v1/chat/test/ai-format` | Test AI response format |

## 8. LUỒNG XỬ LÝ CHI TIẾT

### 8.1 Chat Inference Flow
1. **Xác thực**: Kiểm tra session_id và user_id
2. **Build Messages**: System prompt + history + user query
3. **Cache Check**: Ưu tiên Redis, fallback DB
4. **Save User Message**: Lưu vào DB + Redis
5. **AI Call**: Gọi provider với timeout
6. **Save AI Response**: Lưu vào DB + Redis với metadata
7. **Return Response**: Trả về ChatResponse

### 8.2 Cache Strategy
1. **Read**: Redis → DB → Cache vào Redis
2. **Write**: DB + Redis đồng thời
3. **TTL**: 1 giờ cho session, message
4. **Limit**: Tối đa 20 messages per session
5. **Cleanup**: Tự động xóa khi hết TTL

### 8.3 Error Handling Strategy
1. **AI Provider Error**: Mock response
2. **Database Error**: Log và retry
3. **Redis Error**: Fallback về DB
4. **Validation Error**: Return 400 với message
5. **Timeout**: Return 408 với retry suggestion

## 9. MONITORING VÀ DEBUG

### 9.1 Cache Monitoring
- Cache hit/miss ratio
- Message count per session
- TTL remaining
- Redis connection status

### 9.2 Performance Metrics
- Response time per request
- AI provider latency
- Database query time
- Cache operation time

### 9.3 Debug Endpoints
- `/api/v1/chat/test/ai-format` - Test AI response
- `/api/v1/chat/mock` - Mock response
- `/api/v1/chat/cache/{session_id}/stats` - Cache stats

## 10. SECURITY CONSIDERATIONS

### 10.1 Authentication
- User ID validation
- Session ownership check
- API key protection

### 10.2 Data Protection
- Message encryption in transit
- Secure Redis connection
- Database connection security

### 10.3 Rate Limiting
- Request throttling
- Session-based limits
- AI provider rate limits

