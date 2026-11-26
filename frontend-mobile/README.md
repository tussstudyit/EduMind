# EduMind AI Mobile Frontend

Ứng dụng Next.js riêng cho giao diện điện thoại Android/iOS. FE mobile dùng cùng API EduMind hiện có qua `/api`; không có backend hay database riêng.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở [http://localhost:3002](http://localhost:3002). FE desktop tiếp tục dùng cổng 3000.

## Chạy bằng Docker Compose

Từ thư mục gốc repo:

```bash
docker compose up -d --build frontend frontend-mobile
```

- Desktop: `http://localhost:3000`
- Mobile: `http://localhost:3002`
- Cả hai chuyển tiếp `/api/*` tới cùng backend NestJS trong mạng Docker.

FE mobile hiện có cùng các luồng Admin, Giảng viên, Sinh viên và dùng bố cục mobile tại breakpoint điện thoại. Dữ liệu nghiệp vụ vẫn nằm ở backend/PostgreSQL.
