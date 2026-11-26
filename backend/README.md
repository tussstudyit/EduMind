# EduMind Backend

NestJS REST API dùng PostgreSQL và TypeORM. Schema được quản lý bằng migration, `synchronize` tắt.

## Chạy bằng Docker

Từ thư mục gốc repo:

```powershell
docker compose up -d --build
docker compose ps
```

API mặc định: `http://localhost:3001/api`; health check: `GET /api/health`.

Để bật tài khoản admin đầu tiên, tạo file `.env` ở thư mục gốc repo với các giá trị riêng của bạn:

```env
JWT_SECRET=<chuỗi-ngẫu-nhiên-dài>
BOOTSTRAP_ADMIN_EMAIL=<email-admin>
BOOTSTRAP_ADMIN_PASSWORD=<mật-khẩu-tối-thiểu-8-ký-tự>
BOOTSTRAP_ADMIN_NAME=EduMind Administrator
```

Khởi động lại Backend sau khi thêm cấu hình. Hệ thống chỉ tạo admin ban đầu nếu chưa có tài khoản admin; đăng ký công khai qua API luôn tạo vai trò `student`.

## Chạy riêng

Cần Node.js 22.13+ và PostgreSQL. Tạo database `edumind`, sao chép `.env.example` thành `.env`, rồi:

```powershell
cd backend
npm ci
npm run start:dev
```

## Các nhóm API

Mọi endpoint dùng tiền tố `/api`. Ngoại trừ đăng ký/đăng nhập và health check, API nghiệp vụ cần JWT Bearer.

| Module | Endpoint chính |
|---|---|
| 1. Tài khoản & RBAC | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/profile`, `PATCH /auth/change-password`; admin: `/users` CRUD và `POST /users/:id/reset-password` |
| 2. Môn học & chủ đề | `/subjects` CRUD, `PATCH /subjects/:id/toggle-hide`; `/topics` CRUD, `PATCH /topics/:id/toggle-hide` |
| 3. Khóa học | `/courses` CRUD; học viên chỉ thấy khóa đã xuất bản, giảng viên chỉ quản lý khóa được giao |
| 4. Bài học & tài liệu | `/lessons` CRUD, `PATCH /lessons/courses/:courseId/reorder`; `/materials` CRUD metadata |
| 5. Ghi danh | `/enrollments` danh sách/tạo/quản lý, `POST /enrollments/courses/:courseId/drop` |
| 6. Bài kiểm tra & câu hỏi | `/quizzes` CRUD, `/quizzes/:id/questions`, `/questions` CRUD |
| 7. Bài nộp & chấm điểm | `POST /quizzes/:quizId/start`, `PATCH /attempts/:id/draft`, `POST /attempts/:id/submit`, `POST /attempts/:id/grade`, `GET /attempts` |
| 8. Tiến độ | `GET /progress?courseId=...`, `POST /progress/complete-lesson`; không có API xóa tiến độ |
| 9. AI Tutor | `/ai/conversations` và lịch sử tin nhắn; lịch sử được lưu PostgreSQL |
| 10. OCR | `GET /ocr/scans`, `POST /ocr/upload`, cập nhật trạng thái/văn bản, gửi nội dung sang AI Tutor, xóa bản quét |
| 11. Đề xuất | `GET/POST /recommendations`, `PATCH /recommendations/:id/read`, `PATCH /recommendations/:id/dismiss` |
| 12. Thông báo | `GET/POST /notifications`, đánh dấu đã đọc, đọc tất cả, xóa |
| 13. Báo cáo, nhật ký, cấu hình AI | `GET /admin/reports/summary`, `GET /admin/logs` chỉ đọc, `GET/PUT /admin/ai-config` |

## Trạng thái triển khai

- 13 nhóm chức năng đã có module API và bảng PostgreSQL; quyền được kiểm tra theo vai trò và quyền sở hữu ở các module CRUD mới.
- Học viên tự đăng ký chỉ có vai trò `student`; admin ban đầu được tạo qua biến môi trường `BOOTSTRAP_ADMIN_*`. Email reset mật khẩu tự phục vụ chưa cấu hình vì dự án chưa có nhà cung cấp email; admin có API đặt lại mật khẩu.
- Bài kiểm tra được chấm trắc nghiệm phía server; câu trả lời đúng và giải thích không trả về học viên; bài đã nộp không thể sửa.
- Tài liệu đang lưu metadata/URL, chưa có lưu trữ tệp nhị phân. OCR đang nhận/cập nhật trạng thái qua API, chưa kết nối OCR engine/worker. AI Tutor hiện ghi nhận câu hỏi và trả lời tạm thời, chưa gọi mô hình AI thật. Chưa có WebSocket.
- Frontend hiện vẫn dùng mock/localStorage cho phần lớn màn hình; chỉ AI Tutor đang gọi API. Cần tích hợp token và các API còn lại ở bước FE tiếp theo.
- Lịch sử AI Tutor cũ đang được FE dùng chưa chuyển sang JWT; các luồng này cần được nối xác thực trước khi triển khai công khai.

Chi tiết mô hình và quy tắc nghiệp vụ: [`docs/BACKEND_HANDOFF.md`](docs/BACKEND_HANDOFF.md).
