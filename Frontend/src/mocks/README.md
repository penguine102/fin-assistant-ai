# Hướng dẫn trình tự chat mock (flow mượt nhất)

Tài liệu này mô tả cách tương tác với các kịch bản mock để có trải nghiệm "mượt" nhất trong màn chat.

## 1) Nguyên tắc hiển thị
- Trả lời mock được render bằng HTML kèm CSS nền nhạt theo từng khối: Gợi ý, Lợi ích, Hạn chế, Nên làm, Thuế & chi phí, Bổ sung thông tin.
- Có delay suy nghĩ 3 giây. Trong thời gian này giao diện hiển thị "Thinking…".
- Trả lời stream từng ký tự với nhịp tự nhiên. Có nút Stop (dừng) để hủy giữa chừng; phần đã stream vẫn giữ lại.

Yêu cầu cài đặt để render HTML:
- `npm i rehype-raw`

## 2) Thứ tự hội thoại khuyến nghị
1. Chào hỏi để "mở" không khí và kiểm tra render khối:
   - Ví dụ: "xin chào", "chào bạn"
   - Kết quả: Trả về các khối Gợi ý/Lợi ích/Hạn chế/Nên làm/Bổ sung để định hình phong cách trả lời.

2. Đặt mục tiêu lớn để hệ thống yêu cầu điều kiện ban đầu:
   - Ví dụ: "Làm sao để kiếm 1 tỉ trong 1 năm?"
   - Kết quả: Các khối xuất hiện gồm "Xác định điều kiện ban đầu", "Thuế & chi phí", "Gợi ý", "Lợi ích", "Hạn chế", "Nên làm", "Bổ sung thông tin". Lưu ý mục tiêu là sau thuế.

3. Cung cấp dữ kiện tài chính cốt lõi (lương/tháng) để lượng hóa khoảng thiếu:
   - Ví dụ: "lương là 50 triệu/tháng" hoặc "thu nhập 50tr/tháng".
   - Kết quả: Hệ thống parse số, ước tính lương net, so sánh với mục tiêu ~83.3 triệu/tháng (để đạt 1 tỉ net/12 tháng) và hiển thị khoảng thiếu hàng tháng, kèm gợi ý kế hoạch bù.

4. Xin kế hoạch đầu tư cụ thể (ví dụ cổ phiếu/ETF):
   - Ví dụ: "lập kế hoạch để đầu tư chứng khoán".
   - Kết quả: Các khối "Bối cảnh & giả định", "Khung phân bổ gợi ý", "Nên làm (quy trình 6 bước)", "Lợi ích", "Hạn chế", "Thuế & chi phí", "Bổ sung thông tin".

5. (Tuỳ chọn) Làm rõ mức rủi ro và thời gian:
   - Ví dụ: "tôi chấp nhận rủi ro vừa, thời gian 5 năm".
   - Gợi ý: Có thể mở rộng thêm mock để phân nhánh theo rủi ro/khung thời gian nếu cần.

## 3) Cụm từ khoá kích hoạt (trigger)
- Chào hỏi: `xin chào|chào bạn|hello|hi`
- Mục tiêu 1 tỉ trong 1 năm: chứa đồng thời ý "1 tỉ/1 tỷ/1,000,000,000" và "1 năm/12 tháng".
- Lương theo tháng: "lương|thu nhập … X triệu/tháng", hỗ trợ các dạng "50 triệu", "50tr", "50,000,000 VNĐ/tháng".
- Kế hoạch đầu tư chứng khoán: "lập kế hoạch … chứng khoán" hoặc "đầu tư chứng khoán".

Lưu ý: Các regex được định nghĩa trong `src/mocks/chatMock.ts`. Có thể mở rộng/điều chỉnh để khớp sát ngôn ngữ nội bộ của bạn.

## 4) Mẹo để flow mượt
- Viết câu hỏi rõ ràng, chứa đủ từ khóa: giúp match vào kịch bản mong muốn.
- Cung cấp dần dữ kiện (vốn, rủi ro, thu nhập, thời gian rảnh): mock sẽ phản hồi chi tiết và có cấu trúc.
- Khi cần dừng phản hồi, bấm nút Stop; sau đó có thể hỏi tiếp hoặc đổi chủ đề ngay.
- Để stream trông tự nhiên: giữ mỗi khối tách nhau bằng 1 dòng trống (\n\n) trong nội dung mock.

## 5) Tùy biến nhanh
- Thêm/sửa kịch bản tại: `src/mocks/chatMock.ts`
- Thay đổi màu sắc/kiểu khối tại: `src/styles/chat.css` (selector `.assistant-article .finance-block` và biến thể `.suggest`, `.pros`, `.cons`, `.do`, `.info`).
- Điều chỉnh tốc độ stream trong `src/pages/Chat.tsx` (độ trễ theo ký tự, dấu câu, xuống dòng).

## 6) Ví dụ hội thoại mẫu
Người dùng: "xin chào"
Trợ lý: Hiển thị các khối Gợi ý/Lợi ích/Hạn chế/Nên làm/Bổ sung.

Người dùng: "Làm sao để kiếm 1 tỉ trong 1 năm?"
Trợ lý: Hiển thị các khối điều kiện ban đầu, Thuế & chi phí, Gợi ý, Nên làm...

Người dùng: "lương 50 triệu/tháng"
Trợ lý: Tính net ước tính, so sánh mục tiêu 83.3 triệu/tháng, đưa khoảng thiếu và kế hoạch bù.

Người dùng: "lập kế hoạch để đầu tư chứng khoán"
Trợ lý: Khung phân bổ ETF/trái phiếu/chủ động, DCA, rebalancing, thuế & chi phí.

---
Nếu cần phân nhánh sâu theo rủi ro (thấp/vừa/cao) hoặc theo mức vốn khởi điểm, hãy tạo thêm kịch bản mới ngay bên dưới các mục hiện có trong `chatMock.ts`.
