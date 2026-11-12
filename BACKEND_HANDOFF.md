# TÀI LIỆU BÀN GIAO FRONTEND DÀNH CHO BACKEND DEVELOPER (BACKEND HANDOFF)
# HỆ THỐNG QUẢN LÝ HỌC TẬP TÍCH HỢP AI - EDUMIND LMS

> **Tài liệu tham khảo cho đội ngũ Backend Developer & Tech Lead**  
> **Dự án:** EduMind AI LMS  
> **Cấu trúc dữ liệu nguồn:** [frontend/src/types/index.ts](file:///d:/Nam%203/Ky1/dacs4/frontend/src/types/index.ts)  
> **Tầng giao tiếp dịch vụ:** [frontend/src/services/storageService.ts](file:///d:/Nam%203/Ky1/dacs4/frontend/src/services/storageService.ts)  
> **Dữ liệu mẫu khởi tạo:** [frontend/src/mock/initialData.ts](file:///d:/Nam%203/Ky1/dacs4/frontend/src/mock/initialData.ts)  

---

## MỤC LỤC
1. [Tổng quan Kiến trúc & Chiến lược Chuyển đổi (Migration Strategy)](#1-tong-quan-kien-truc--chien-luoc-chuyen-doi)
2. [Từ điển Dữ liệu & TypeScript Data Models (13 Cụm Chức năng)](#2-tu-dien-du-lieu--typescript-data-models)
3. [Danh mục Chi tiết Toàn bộ Hàm Service & Đề xuất RESTful API](#3-danh-muc-chi-tiet-toan-bo-ham-service--de-xuat-restful-api)
   - [Hệ thống & Tiện ích](#he-thong--tien-ich)
   - [Module 1: Tài khoản & Phân quyền](#module-1-tai-khoan--phan-quyen)
   - [Module 2: Môn học & Chủ đề](#module-2-mon-hoc--chu-de)
   - [Module 3: Khóa học](#module-3-khoa-hoc)
   - [Module 4: Bài học & Tài liệu](#module-4-bai-hoc--tai-lieu)
   - [Module 5: Ghi danh Khóa học](#module-5-ghi-danh-khoa-hoc)
   - [Module 6: Bài tập, Kiểm tra & Câu hỏi](#module-6-bai-tap-kiem-tra--cau-hoi)
   - [Module 7: Bài làm & Chấm điểm](#module-7-bai-lam--cham-diem)
   - [Module 8: Tiến độ Học tập](#module-8-tien-do-hoc-tap)
   - [Module 9: Trợ lý Học tập AI Tutor](#module-9-tro-ly-hoc-tap-ai-tutor)
   - [Module 10: Quét Tài liệu OCR](#module-10-quet-tai-lieu-ocr)
   - [Module 11: Đề xuất Học tập](#module-11-de-xuat-hoc-tap)
   - [Module 12: Thông báo Hệ thống](#module-12-thong-bao-he-thong)
   - [Module 13: Báo cáo, Nhật ký & Cấu hình AI](#module-13-bao-cao-nhat-ky--cau-hinh-ai)
4. [Các Quy tắc Nghiệp vụ & Bảo mật RBAC Cốt lõi](#4-cac-quy-tac-nghiep-vu--bao-mat-rbac-cot-loi)
5. [Mẫu Code Chuyển đổi (Migration Code Sample: Mock -> Real API)](#5-mau-code-chuyen-doi-migration-code-sample)

---

## 1. TỔNG QUAN KIẾN TRÚC & CHIẾN LƯỢC CHUYỂN ĐỔI

### Kiến trúc Hiện tại
Giao diện EduMind được thiết kế theo mô hình **Service Layer Abstraction**:
- Toàn bộ UI Components (Auth, Admin, Teacher, Student) hoàn toàn **không** tương tác trực tiếp với cơ chế lưu trữ nội bộ.
- Mọi thao tác đọc/ghi đều đi qua đối tượng `storageService` trong `frontend/src/services/storageService.ts`.
- Dữ liệu hiện tại được giả lập bằng Mock Data và lưu giữ liên tục trong trình duyệt qua `localStorage` (tiền tố `edumind_*`).

### Lợi ích khi Tích hợp Backend
Đội ngũ Backend chỉ cần:
1. Xây dựng các Endpoint API theo chuẩn RESTful hoặc GraphQL được khuyến nghị trong tài liệu này.
2. Viết lại phần thân (implementation) của các phương thức trong `storageService.ts` bằng `fetch` hoặc `axios` (hoặc chuyển sang `apiService.ts`).
3. **Toàn bộ giao diện người dùng (UI Components, State, Form, Modal, Charts) giữ nguyên 100% không cần viết lại.**

```
+-------------------------------------------------------------+
|                      EduMind UI Layer                       |
|   (AdminDashboard, TeacherCourses, LearningRoom, Quiz, ...) |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                    Service Abstraction                      |
|            (frontend/src/services/storageService.ts)        |
+-------------------------------------------------------------+
         |                                           |
         | (Giai đoạn hiện tại)                     | (Sau khi nối Backend)
         v                                           v
+------------------+                       +------------------+
| LocalStorage Mock|                       | Backend REST API |
| (edumind_* keys) |                       | (Node / Django / |
|                  |                       |  Spring Boot / Go|
+------------------+                       +------------------+
```

---

## 2. TỪ ĐIỂN DỮ LIỆU & TYPESCRIPT DATA MODELS

Tất cả các định nghĩa dưới đây được đặt tại [frontend/src/types/index.ts](file:///d:/Nam%203/Ky1/dacs4/frontend/src/types/index.ts). Backend Database (PostgreSQL / MySQL / MongoDB) có thể map trực tiếp theo cấu trúc này:

### Module 1: Tài khoản & Phân quyền
```typescript
export type UserRole = "admin" | "teacher" | "student";
export type UserStatus = "active" | "locked";

export interface User {
  id: string;               // UUID hoặc chuỗi định danh (vd: "user-1718000000")
  email: string;            // Duy nhất trong toàn hệ thống
  name: string;             // Họ và tên
  avatar: string;           // Tên viết tắt hiển thị avatar hoặc URL ảnh
  role: UserRole;           // "admin" | "teacher" | "student"
  status: UserStatus;       // "active" | "locked"
  phone?: string;           // Số điện thoại liên hệ
  bio?: string;             // Tiểu sử ngắn
  department?: string;      // Khoa / Khối / Lớp
  createdAt: string;        // ISO 8601 string
  updatedAt: string;        // ISO 8601 string
}
```

### Module 2: Môn học & Chủ đề
```typescript
export interface Subject {
  id: string;               // vd: "sub-cs", "sub-math"
  code: string;             // Mã môn: "CS101", "MATH201"
  name: string;             // Tên môn học
  description: string;      // Mô tả tổng quan
  iconName: string;         // Tên biểu tượng ("book", "calculator", "terminal")
  isHidden: boolean;        // true: môn học đang bị ẩn
  topicCount: number;       // Số chủ đề con thuộc môn này
  courseCount: number;      // Số khóa học liên kết
  createdAt: string;        // ISO 8601 string
}

export interface Topic {
  id: string;               // vd: "top-01"
  subjectId: string;        // Khóa ngoại tham chiếu Subject.id
  name: string;             // Tên chủ đề
  description: string;      // Tóm tắt chủ đề
  order: number;            // Thứ tự hiển thị trong môn học
  isHidden: boolean;        // true: chủ đề bị ẩn
}
```

### Module 3: Khóa học
```typescript
export type CourseStatus = "draft" | "published" | "archived" | "hidden";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;               // vd: "course-01"
  subjectId: string;        // Khóa ngoại Subject.id
  subjectName: string;      // Tên môn học hiển thị nhanh
  teacherId: string;        // Khóa ngoại User.id (giảng viên phụ trách)
  teacherName: string;      // Tên giảng viên phụ trách
  title: string;            // Tiêu đề khóa học
  description: string;      // Mô tả khóa học
  thumbnail: string;        // URL ảnh đại diện khóa học
  level: CourseLevel;       // Cấp độ: "beginner" | "intermediate" | "advanced"
  status: CourseStatus;     // "draft" | "published" | "archived" | "hidden"
  tone: "lavender" | "mint" | "sky" | "amber"; // Theme màu sắc card khóa học
  badgeMark: string;        // Ký hiệu nổi bật: "Py", "AI", "∑", "JS"
  durationHours: number;    // Tổng thời lượng ước tính (giờ)
  lessonCount: number;      // Tổng số bài học
  enrolledCount: number;    // Số học viên đã đăng ký
  createdAt: string;        // ISO 8601 string
  updatedAt: string;        // ISO 8601 string
}
```

### Module 4: Bài học & Tài liệu
```typescript
export interface Lesson {
  id: string;               // vd: "les-01"
  courseId: string;         // Khóa ngoại Course.id
  title: string;            // Tiêu đề bài học
  description: string;      // Tóm tắt bài học
  order: number;            // Thứ tự bài học trong khóa học
  durationMinutes: number;  // Thời lượng học ước tính (phút)
  videoUrl?: string;        // URL video bài giảng (YouTube, S3, MP4)
  contentMarkdown: string;  // Nội dung chi tiết định dạng Markdown / HTML
  isPublished: boolean;     // Trạng thái xuất bản của bài học
}

export type MaterialType = "pdf" | "docx" | "slide" | "code" | "zip";

export interface Material {
  id: string;               // vd: "mat-01"
  lessonId: string;         // Khóa ngoại Lesson.id
  courseId: string;         // Khóa ngoại Course.id
  title: string;            // Tên tài liệu đính kèm
  description?: string;     // Ghi chú tài liệu
  fileType: MaterialType;   // Loại tệp
  fileUrl: string;          // Đường dẫn tải về hoặc xem trực tiếp
  fileSize: string;         // Dung lượng hiển thị (vd: "2.4 MB")
  uploadedAt: string;       // ISO 8601 string
}
```

### Module 5: Ghi danh Khóa học
```typescript
export type EnrollmentStatus = "active" | "dropped" | "completed";

export interface Enrollment {
  id: string;               // vd: "enr-01"
  courseId: string;         // Khóa ngoại Course.id
  courseTitle: string;      // Tên khóa học
  studentId: string;        // Khóa ngoại User.id (học viên)
  studentName: string;      // Tên học viên
  studentAvatar: string;    // Avatar học viên
  studentEmail: string;     // Email học viên
  enrolledAt: string;       // Thời điểm tham gia
  status: EnrollmentStatus; // "active" | "dropped" | "completed"
  progressPercent: number;  // Tiến độ học tập tổng thể (%)
  lastAccessedAt: string;   // Thời điểm vào học gần nhất
}
```

### Module 6: Bài tập, Kiểm tra & Câu hỏi
```typescript
export type QuestionType = "multiple_choice" | "essay";

export interface QuestionOption {
  id: string;               // vd: "opt-1", "opt-2"
  text: string;             // Nội dung phương án lựa chọn
  isCorrect?: boolean;      // QUAN TRỌNG: Chỉ trả về cho Teacher/Admin! Bị loại bỏ khi gửi tới Student
}

export interface Question {
  id: string;               // vd: "q-01"
  quizId: string;           // Khóa ngoại Quiz.id
  content: string;          // Nội dung câu hỏi (hỗ trợ công thức KaTeX / Markdown)
  type: QuestionType;       // "multiple_choice" hoặc "essay"
  points: number;           // Thang điểm của câu hỏi
  options: QuestionOption[];// Danh sách lựa chọn (nếu là trắc nghiệm)
  explanation?: string;     // Lời giải thích (Chỉ trả về cho Teacher/Admin hoặc sau khi chấm)
}

export interface Quiz {
  id: string;               // vd: "quiz-01"
  courseId: string;         // Khóa ngoại Course.id
  courseTitle: string;      // Tên khóa học chứa bài kiểm tra
  lessonId?: string;        // Tùy chọn: liên kết với bài học cụ thể
  title: string;            // Tiêu đề bài kiểm tra
  description: string;      // Hướng dẫn làm bài
  timeLimitMinutes: number; // Giới hạn thời gian làm bài (phút)
  passingScore: number;     // Điểm đạt tối thiểu
  maxScore: number;         // Tổng điểm tối đa (thường là 10.0)
  isPublished: boolean;     // Đã mở cho học sinh làm hay chưa
  questionCount: number;    // Tổng số câu hỏi trong đề
  createdAt: string;        // ISO 8601 string
}
```

### Module 7: Bài làm & Chấm điểm
```typescript
export type AttemptStatus = "in_progress" | "submitted" | "graded";

export interface StudentAnswer {
  questionId: string;        // ID câu hỏi
  selectedOptionId?: string; // ID phương án học sinh chọn (đối với trắc nghiệm)
  essayAnswer?: string;      // Bài viết trả lời (đối với tự luận)
  scoreAwarded?: number;     // Điểm số giảng viên/hệ thống chấm cho câu này
  teacherFeedback?: string;  // Nhận xét chi tiết cho từng câu
}

export interface QuizAttempt {
  id: string;                // vd: "att-01"
  quizId: string;            // Khóa ngoại Quiz.id
  quizTitle: string;         // Tên bài kiểm tra
  courseId: string;          // Khóa ngoại Course.id
  studentId: string;         // Khóa ngoại User.id
  studentName: string;       // Tên học sinh
  studentAvatar: string;     // Avatar học sinh
  status: AttemptStatus;     // "in_progress" (nháp) | "submitted" (đã nộp, khóa sửa) | "graded"
  answers: StudentAnswer[];  // Chi tiết câu trả lời của từng câu
  totalScore: number;        // Tổng điểm đạt được
  maxScore: number;          // Điểm tối đa
  startedAt: string;         // Thời gian bắt đầu làm bài
  submittedAt?: string;      // Thời gian nộp bài
  gradedAt?: string;         // Thời gian hoàn thành chấm điểm
  gradedBy?: string;         // Tên giảng viên chấm bài
  teacherNotes?: string;     // Lời phê / nhận xét tổng quát từ giảng viên
}
```

### Module 8: Tiến độ Học tập
```typescript
export interface StudentProgress {
  id: string;                   // vd: "prog-01"
  studentId: string;            // Khóa ngoại User.id
  courseId: string;             // Khóa ngoại Course.id
  completedLessonIds: string[]; // Danh sách ID các bài học đã hoàn thành
  lastLessonId: string;         // ID bài học vừa xem gần nhất
  lastStudiedAt: string;        // Thời gian học gần nhất
  percentCompleted: number;     // Tỉ lệ hoàn thành (0 - 100)
  totalMinutesStudied: number;  // Tổng số phút đã dành học khóa này
}

export interface WeeklyActivityLog {
  day: string;  // "T2", "T3", "T4", "T5", "T6", "T7", "CN"
  date: string; // "2026-11-10"
  minutes: number; // Số phút hoạt động trong ngày
}
```

### Module 9: Trợ lý Học tập AI Tutor
```typescript
export interface Conversation {
  id: string;               // vd: "conv-01"
  studentId: string;        // Khóa ngoại User.id
  courseId?: string;        // Khóa ngoại Course.id nếu trò chuyện trong ngữ cảnh khóa học
  title: string;            // Tiêu đề đoạn hội thoại
  createdAt: string;        // ISO 8601 string
  updatedAt: string;        // ISO 8601 string
  isArchived: boolean;      // Trạng thái lưu trữ (Archived)
}

export interface ChatMessage {
  id: string;               // vd: "msg-01"
  conversationId: string;   // Khóa ngoại Conversation.id
  sender: "user" | "assistant";
  content: string;          // Nội dung tin nhắn (hỗ trợ Markdown & KaTeX)
  timestamp: string;        // ISO 8601 string
  suggestions?: string[];   // Danh sách gợi ý câu hỏi tiếp theo từ AI
}
```

### Module 10: Quét Tài liệu OCR
```typescript
export type OCRScanStatus = "processing" | "completed" | "failed";

export interface OCRScan {
  id: string;               // vd: "ocr-01"
  studentId: string;        // Khóa ngoại User.id
  fileName: string;         // Tên file ảnh gốc
  imageUrl: string;         // URL ảnh lưu trên server / S3 / base64
  recognizedText: string;   // Văn bản do OCR Engine bóc tách gốc
  correctedText: string;    // Văn bản sau khi học sinh xem và chỉnh sửa
  status: OCRScanStatus;    // "processing" | "completed" | "failed"
  createdAt: string;        // ISO 8601 string
  sentToAI: boolean;        // Đã chuyển nội dung sang AI Tutor hay chưa
  notes?: string;           // Ghi chú thêm
}
```

### Module 11: Đề xuất Học tập
```typescript
export type RecommendationType = "course" | "review" | "exercise" | "tip";

export interface Recommendation {
  id: string;               // vd: "rec-01"
  studentId: string;        // Khóa ngoại User.id
  title: string;            // Tiêu đề gợi ý
  description: string;      // Nội dung phân tích và gợi ý
  type: RecommendationType; // "course" | "review" | "exercise" | "tip"
  courseId?: string;        // ID khóa học gợi ý nếu có
  isRead: boolean;          // Đã bấm "Đánh dấu đã xem"
  isDismissed: boolean;     // Đã bấm "Bỏ qua"
  createdAt: string;        // ISO 8601 string
}
```

### Module 12: Thông báo Hệ thống
```typescript
export type NotificationType = "info" | "success" | "warning" | "alert";

export interface Notification {
  id: string;               // vd: "notif-01"
  userId: string;           // Người nhận thông báo
  title: string;            // Tiêu đề thông báo
  message: string;          // Nội dung chi tiết
  type: NotificationType;   // "info" | "success" | "warning" | "alert"
  isRead: boolean;          // Đã đọc hay chưa
  createdAt: string;        // ISO 8601 string
  link?: string;            // URL điều hướng khi click (vd: "#grading", "/courses/course-01")
}
```

### Module 13: Báo cáo, Nhật ký & Cấu hình AI
```typescript
export type LogLevel = "info" | "warn" | "error";

export interface SystemLog {
  id: string;               // vd: "log-01"
  level: LogLevel;          // "info" | "warn" | "error"
  action: string;           // Mã hành động: "USER_LOGIN", "QUIZ_SUBMITTED", "AI_CONFIG_UPDATED"
  actorId: string;          // ID người hoặc hệ thống thực hiện
  actorName: string;        // Tên người thực hiện
  actorRole: UserRole;      // Vai trò
  timestamp: string;        // ISO 8601 string
  details: string;          // Chi tiết log (Read-Only)
}

export interface AIConfig {
  provider: "gemini" | "openai";
  modelName: string;        // vd: "gemini-1.5-pro", "gpt-4o"
  apiKeyMasked: string;     // vd: "AIzaSy...XXXX"
  maxTokens: number;        // vd: 4096
  temperature: number;      // vd: 0.7
  ocrEngine: "gemini-multimodal" | "google-vision" | "tesseract";
  ocrConfidenceThreshold?: number; // vd: 85 (%)
  maxUploadSizeMB?: number; // vd: 10 (MB)
  serviceStatus: "healthy" | "degraded" | "offline";
  dailyUsageCount: number;  // Số lượt request đã dùng trong ngày
  dailyUsageLimit: number;  // Hạn mức request tối đa trong ngày
  updatedAt: string;        // ISO 8601 string
}
```

---

## 3. DANH MỤC CHI TIẾT TOÀN BỘ HÀM SERVICE & ĐỀ XUẤT RESTFUL API

Tất cả 50+ hàm sau đây hiện diện đầy đủ trong [frontend/src/services/storageService.ts](file:///d:/Nam%203/Ky1/dacs4/frontend/src/services/storageService.ts).

### Hệ thống & Tiện ích
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `resetToFactoryDefaults()` | Không | `void` | `POST /api/dev/reset-mock` | Khôi phục toàn bộ database/state về trạng thái mẫu ban đầu (phục vụ test). |

---

### Module 1: Tài khoản & Phân quyền
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getUsers()` | Không | `User[]` | `GET /api/users` | Lấy danh sách toàn bộ người dùng (Admin xem và lọc). |
| `saveUser(user)` | `Partial<User> & { email: string; name: string; role: UserRole }` | `User` | `POST /api/users` hoặc `PUT /api/users/:id` | Tạo mới người dùng hoặc cập nhật thông tin hồ sơ/vai trò. |
| `toggleLockUser(userId)` | `userId: string` | `User \| null` | `PATCH /api/users/:id/toggle-lock` | Đổi trạng thái tài khoản giữa `active` và `locked`. |
| `login(email, pass)` | `email: string, pass: string` | `{ success: boolean; user?: User; message: string }` | `POST /api/auth/login` | Xác thực đăng nhập, kiểm tra khóa tài khoản, trả về User và JWT token. |
| `register(name, email, role?, phone?, dept?)` | `name: string, email: string, role?: UserRole, ...` | `{ success: boolean; user?: User; message: string }` | `POST /api/auth/register` | Đăng ký tài khoản người dùng mới. |
| `changePassword(userId, oldPass, newPass)` | `userId: string, oldPass: string, newPass: string` | `{ success: boolean; message: string }` | `POST /api/auth/change-password` | Kiểm tra mật khẩu cũ và cập nhật mật khẩu mới (tối thiểu 6 ký tự). |

---

### Module 2: Môn học & Chủ đề
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getSubjects(includeHidden?)` | `includeHidden: boolean = true` | `Subject[]` | `GET /api/subjects?includeHidden=true` | Lấy danh sách môn học; có thể lọc bỏ môn bị ẩn đối với Student. |
| `saveSubject(subject)` | `Partial<Subject> & { code: string; name: string }` | `Subject` | `POST /api/subjects` hoặc `PUT /api/subjects/:id` | Thêm mới hoặc chỉnh sửa môn học. |
| `toggleHideSubject(subjectId)` | `subjectId: string` | `Subject \| null` | `PATCH /api/subjects/:id/toggle-hide` | Bật/tắt trạng thái ẩn (`isHidden`) của môn học. |
| `deleteSubject(subjectId)` | `subjectId: string` | `boolean` | `DELETE /api/subjects/:id` | Xóa vĩnh viễn môn học khỏi hệ thống. |
| `getTopics(subjectId?, includeHidden?)` | `subjectId?: string, includeHidden?: boolean` | `Topic[]` | `GET /api/subjects/:subjectId/topics` | Lấy danh sách các chủ đề con theo môn học, sắp xếp theo `order`. |
| `saveTopic(topic)` | `Partial<Topic> & { subjectId: string; name: string }` | `Topic` | `POST /api/topics` hoặc `PUT /api/topics/:id` | Tạo mới hoặc cập nhật chủ đề con, tăng `topicCount` của Subject tương ứng. |
| `toggleHideTopic(topicId)` | `topicId: string` | `Topic \| null` | `PATCH /api/topics/:id/toggle-hide` | Bật/tắt trạng thái ẩn của chủ đề con. |
| `deleteTopic(topicId)` | `topicId: string` | `boolean` | `DELETE /api/topics/:id` | Xóa chủ đề con, tự động giảm `topicCount` của môn học cha. |

---

### Module 3: Khóa học
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getCourses(role?, teacherId?)` | `role: UserRole = "student", teacherId?: string` | `Course[]` | `GET /api/courses?role=...&teacherId=...` | Student chỉ thấy `published`; Teacher thấy khóa mình phụ trách; Admin thấy tất cả. |
| `getCourseById(courseId)` | `courseId: string` | `Course \| undefined` | `GET /api/courses/:id` | Lấy thông tin chi tiết một khóa học. |
| `saveCourse(course)` | `Partial<Course> & { title: string; subjectId: string; teacherId: string }` | `Course` | `POST /api/courses` hoặc `PUT /api/courses/:id` | Tạo mới hoặc cập nhật khóa học; hỗ trợ đổi trạng thái (draft/published/hidden/archived). |
| `deleteCourse(courseId)` | `courseId: string` | `boolean` | `DELETE /api/courses/:id` | Xóa khóa học bản nháp. |

---

### Module 4: Bài học & Tài liệu
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getLessons(courseId)` | `courseId: string` | `Lesson[]` | `GET /api/courses/:courseId/lessons` | Lấy danh sách bài học thuộc khóa học, sắp xếp tăng dần theo `order`. |
| `saveLesson(lesson)` | `Partial<Lesson> & { courseId: string; title: string }` | `Lesson` | `POST /api/lessons` hoặc `PUT /api/lessons/:id` | Thêm hoặc sửa bài học; tự động cập nhật `lessonCount` trong Course. |
| `deleteLesson(lessonId)` | `lessonId: string` | `boolean` | `DELETE /api/lessons/:id` | Xóa bài học và giảm `lessonCount`. |
| `reorderLesson(courseId, lessonId, direction)` | `courseId: string, lessonId: string, direction: "up" \| "down"` | `boolean` | `PATCH /api/courses/:courseId/lessons/reorder` | Hoán đổi vị trí thứ tự `order` giữa bài học hiện tại và bài học liền kề. |
| `getMaterials(courseId, lessonId?)` | `courseId: string, lessonId?: string` | `Material[]` | `GET /api/courses/:courseId/materials` | Lấy danh sách tài liệu đính kèm (PDF, slide, code, docx). |
| `saveMaterial(mat)` | `Partial<Material> & { courseId: string; title: string }` | `Material` | `POST /api/materials` hoặc `PUT /api/materials/:id` | Tải lên hoặc sửa thông tin (tiêu đề, mô tả) của tài liệu. |
| `deleteMaterial(materialId)` | `materialId: string` | `boolean` | `DELETE /api/materials/:id` | Xóa tài liệu đính kèm. |

---

### Module 5: Ghi danh Khóa học
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getEnrollments(studentId?, courseId?)` | `studentId?: string, courseId?: string` | `Enrollment[]` | `GET /api/enrollments?studentId=...&courseId=...` | Xem các khóa học học viên đã tham gia, hoặc danh sách học viên trong 1 khóa (dành cho Teacher). |
| `enrollCourse(courseId, student)` | `courseId: string, student: User` | `Enrollment` | `POST /api/courses/:courseId/enroll` | Học viên tham gia khóa học, tăng `enrolledCount` của khóa học. |
| `dropCourse(courseId, studentId)` | `courseId: string, studentId: string` | `boolean` | `POST /api/courses/:courseId/drop` | Hủy tham gia khóa học (`status = 'dropped'`), giảm `enrolledCount`. |

---

### Module 6: Bài tập, Kiểm tra & Câu hỏi
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getQuizzes(courseId?)` | `courseId?: string` | `Quiz[]` | `GET /api/quizzes?courseId=...` | Danh sách bài kiểm tra. |
| `saveQuiz(quiz)` | `Partial<Quiz> & { title: string; courseId: string }` | `Quiz` | `POST /api/quizzes` hoặc `PUT /api/quizzes/:id` | Tạo mới hoặc cập nhật bài kiểm tra (thời lượng, điểm đạt, trạng thái xuất bản). |
| `deleteQuiz(quizId)` | `quizId: string` | `boolean` | `DELETE /api/quizzes/:id` | Xóa bài kiểm tra. |
| `getQuestions(quizId, userRole?)` | `quizId: string, userRole: UserRole = "student"` | `Question[]` | `GET /api/quizzes/:quizId/questions` | **Quy tắc RBAC:** Nếu `userRole === 'student'`, Backend **bắt buộc loại bỏ** `isCorrect` và `explanation` để chống gian lận. |
| `saveQuestion(question)` | `Omit<Question, "id"> & { id?: string }` | `Question` | `POST /api/questions` hoặc `PUT /api/questions/:id` | Thêm hoặc sửa câu hỏi (MCQ hoặc tự luận), cập nhật `questionCount` trong Quiz. |
| `deleteQuestion(questionId)` | `questionId: string` | `boolean` | `DELETE /api/questions/:id` | Xóa câu hỏi, giảm `questionCount`. |

---

### Module 7: Bài làm & Chấm điểm
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getAttempts(quizId?, studentId?)` | `quizId?: string, studentId?: string` | `QuizAttempt[]` | `GET /api/attempts?quizId=...&studentId=...` | Lấy danh sách lượt làm bài của học viên hoặc toàn bộ bài nộp của lớp để chấm. |
| `startOrGetAttempt(quizId, student)` | `quizId: string, student: User` | `QuizAttempt` | `POST /api/quizzes/:quizId/start` | Khởi tạo bài làm mới hoặc tiếp tục lượt làm đang dở dang (`in_progress`). |
| `saveAttemptDraft(attemptId, answers)` | `attemptId: string, answers: StudentAnswer[]` | `QuizAttempt \| null` | `PATCH /api/attempts/:id/draft` | Lưu tạm câu trả lời (Auto-save draft) khi học sinh đang làm bài. |
| `submitAttempt(attemptId, answers)` | `attemptId: string, answers: StudentAnswer[]` | `QuizAttempt \| null` | `POST /api/attempts/:id/submit` | Nộp bài: Khóa bài làm (`status = 'submitted'`), tự động chấm câu trắc nghiệm, gửi thông báo cho Giảng viên. |
| `gradeAttempt(attemptId, grades, teacherNotes, teacherName)` | `attemptId: string, grades: [...], notes: string, teacher: string` | `QuizAttempt \| null` | `POST /api/attempts/:id/grade` | Giảng viên nhập điểm câu tự luận, nhận xét và hoàn tất chấm bài (`status = 'graded'`), tự động gửi thông báo cho Học viên. |

---

### Module 8: Tiến độ Học tập
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getProgress(studentId, courseId)` | `studentId: string, courseId: string` | `StudentProgress \| undefined` | `GET /api/progress?studentId=...&courseId=...` | Lấy thông tin tiến độ: danh sách bài hoàn thành, bài đang học dở, tỉ lệ %. |
| `markLessonCompleted(studentId, courseId, lessonId)` | `studentId: string, courseId: string, lessonId: string` | `StudentProgress` | `POST /api/progress/complete-lesson` | Đánh dấu hoàn thành bài học, tự động tính lại % tiến độ và cập nhật vào `Enrollment`. **Lưu ý: Không có API xóa tiến độ.** |

---

### Module 9: Trợ lý Học tập AI Tutor
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getConversations(studentId, showArchived?)` | `studentId: string, showArchived: boolean = false` | `Conversation[]` | `GET /api/ai/conversations?studentId=...&archived=...` | Lấy danh sách các cuộc hội thoại chat của học sinh. |
| `createConversation(studentId, title, courseId?)` | `studentId: string, title: string, courseId?: string` | `Conversation` | `POST /api/ai/conversations` | Tạo cuộc trò chuyện mới, tự động chèn tin nhắn mở đầu chào mừng kèm gợi ý câu hỏi. |
| `deleteConversation(conversationId)` | `conversationId: string` | `boolean` | `DELETE /api/ai/conversations/:id` | Xóa cuộc hội thoại khỏi sidebar. |
| `renameConversation(conversationId, newTitle)` | `conversationId: string, newTitle: string` | `boolean` | `PATCH /api/ai/conversations/:id/rename` | Đổi tiêu đề cuộc hội thoại. |
| `toggleArchiveConversation(conversationId)` | `conversationId: string` | `boolean` | `PATCH /api/ai/conversations/:id/toggle-archive` | Lưu trữ / Khôi phục cuộc trò chuyện. |
| `getMessages(conversationId)` | `conversationId: string` | `ChatMessage[]` | `GET /api/ai/conversations/:id/messages` | Lấy toàn bộ lịch sử tin nhắn của cuộc trò chuyện theo thứ tự thời gian. |
| `sendMessage(conversationId, content)` | `conversationId: string, content: string` | `{ userMsg: ChatMessage; assistantMsg: ChatMessage }` | `POST /api/ai/conversations/:id/messages` | Gửi tin nhắn học sinh và nhận phản hồi từ AI. Hỗ trợ Server-Sent Events (SSE) để streaming chữ mượt mà. |

---

### Module 10: Quét Tài liệu OCR
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getOCRScans(studentId)` | `studentId: string` | `OCRScan[]` | `GET /api/ocr/scans?studentId=...` | Danh sách lịch sử quét tài liệu của học sinh. |
| `addOCRScan(studentId, fileName, imageUrl, rawText?, initialStatus?)` | `studentId: string, fileName: string, ...` | `OCRScan` | `POST /api/ocr/upload` | Tải ảnh lên hàng đợi xử lý OCR (ban đầu mang trạng thái `processing`). |
| `updateOCRStatus(scanId, status, recognizedText?)` | `scanId: string, status: OCRScanStatus, ...` | `OCRScan \| null` | `PATCH /api/ocr/scans/:id/status` | Worker cập nhật trạng thái từ `processing` sang `completed` hoặc `failed`. |
| `updateOCRText(scanId, correctedText)` | `scanId: string, correctedText: string` | `OCRScan \| null` | `PATCH /api/ocr/scans/:id/text` | Học sinh lưu lại nội dung văn bản sau khi chỉnh sửa thủ công trên giao diện 2 cột. |
| `sendOCRToAI(scanId, studentId)` | `scanId: string, studentId: string` | `Conversation` | `POST /api/ocr/scans/:id/send-to-ai` | Đánh dấu `sentToAI = true`, tự động tạo cuộc hội thoại AI Tutor và đẩy nội dung bài tập sang AI để giải. |
| `deleteOCRScan(scanId)` | `scanId: string` | `boolean` | `DELETE /api/ocr/scans/:id` | Xóa bản quét OCR. |

---

### Module 11: Đề xuất Học tập
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getRecommendations(studentId)` | `studentId: string` | `Recommendation[]` | `GET /api/recommendations?studentId=...` | Lấy danh sách các thẻ gợi ý cá nhân hóa chưa bị bỏ qua (`!isDismissed`). |
| `markRecommendationRead(recId)` | `recId: string` | `void` | `PATCH /api/recommendations/:id/read` | Đánh dấu đã xem gợi ý (`isRead = true`). |
| `dismissRecommendation(recId)` | `recId: string` | `PATCH /api/recommendations/:id/dismiss` | Bỏ qua gợi ý (`isDismissed = true`). |

---

### Module 12: Thông báo Hệ thống
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getNotifications(userId)` | `userId: string` | `Notification[]` | `GET /api/notifications?userId=...` | Lấy thông báo cá nhân, sắp xếp theo thời gian mới nhất. |
| `markNotificationRead(notificationId)` | `notificationId: string` | `void` | `PATCH /api/notifications/:id/read` | Đánh dấu 1 thông báo cụ thể là đã đọc. |
| `markAllNotificationsRead(userId)` | `userId: string` | `void` | `POST /api/notifications/mark-all-read` | Đánh dấu tất cả thông báo của người dùng là đã đọc. |
| `deleteNotification(notificationId)` | `notificationId: string` | `void` | `DELETE /api/notifications/:id` | Xóa thông báo khỏi danh sách. |
| `addNotification(userId, title, message, type?, link?)` | `userId: string, title: string, ...` | `Notification` | `POST /api/notifications` | Hệ thống hoặc Giảng viên tạo thông báo mới gửi cho User. |

---

### Module 13: Báo cáo, Nhật ký & Cấu hình AI
| Tên hàm Service | Tham số đầu vào | Kiểu trả về | Đề xuất REST Endpoint | Mô tả nghiệp vụ |
|---|---|---|---|---|
| `getSystemLogs()` | Không | `SystemLog[]` | `GET /api/admin/logs` | **Chỉ đọc (Read-only):** Xem nhật ký hệ thống kiểm toán (Admin Audit Logs). Tuyệt đối không cung cấp API sửa/xóa log. |
| `addSystemLog(action, details, level?)` | `action: string, details: string, level?: LogLevel` | `void` | Internal Backend Logger | Ghi nhận hoạt động bảo mật, phân quyền, cấu hình hoặc đăng nhập. |
| `getAIConfig()` | Không | `AIConfig` | `GET /api/admin/ai-config` | Lấy cấu hình tham số AI/OCR hiện thời (Model, Tokens, Temperature, Quota, Health Status). |
| `updateAIConfig(config)` | `Partial<AIConfig>` | `AIConfig` | `PUT /api/admin/ai-config` | Admin cập nhật tham số AI & OCR (chỉ người có vai trò Admin mới có quyền truy cập). |

---

## 4. CÁC QUY TẮC NGHIỆP VỤ & BẢO MẬT RBAC CỐT LÕI

Backend Developer cần lưu ý đặc biệt 5 nguyên tắc nghiệp vụ cốt lõi đã được ràng buộc trên Frontend:

1. **Bảo mật Đề thi & Đáp án (Quiz Security):**
   - Khi API nhận request từ người dùng có `role === 'student'`, trường `options[i].isCorrect` và trường `question.explanation` **bắt buộc phải bị lược bỏ hoàn toàn** khỏi JSON Response.
   - Điểm số của câu trắc nghiệm được chấm phía Backend tại thời điểm gọi `POST /api/attempts/:id/submit`, không tin tưởng bất kỳ điểm số nào client gửi lên.

2. **Khóa Bài làm sau khi Nộp (Immutable Submission):**
   - Sau khi học sinh ấn nút nộp bài (`status = 'submitted'`), Backend phải từ chối mọi yêu cầu chỉnh sửa đáp án (`PATCH /api/attempts/:id/draft` sẽ trả về `403 Forbidden`).

3. **Toàn vẹn Lịch sử Trò chuyện AI (No Message Editing):**
   - Tin nhắn đã gửi trong cuộc hội thoại AI Tutor là bất biến. Không cung cấp API sửa nội dung tin nhắn cũ nhằm bảo đảm tính xác thực của luồng trao đổi.

4. **Tiến độ Học tập Một chiều (No Progress Deletion):**
   - Tiến độ học tập chỉ được phép tăng khi hoàn thành bài học hoặc làm bài kiểm tra. Hệ thống không cho phép xóa tiến độ đã đạt được.

5. **Nhật ký Hệ thống Bất biến (Read-only Audit Logs):**
   - Bảng `SystemLog` phục vụ mục đích kiểm toán bảo mật. Backend chỉ cung cấp quyền `GET` cho Admin, không tạo endpoint `DELETE` hay `PUT/PATCH` cho bảng logs.

---

## 5. MẪU CODE CHUYỂN ĐỔI (MIGRATION CODE SAMPLE)

Dưới đây là ví dụ minh họa cách Backend Developer hoặc Frontend Integrator thay thế Mock bằng HTTP Client (`fetch` hoặc `axios`):

### Ví dụ: Chuyển đổi `login` và `getCourses` trong `frontend/src/services/apiClient.ts`

```typescript
// frontend/src/services/apiClient.ts
import { User, Course, UserRole } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Helper gắn kèm JWT Token tự động
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `Lỗi HTTP ${response.status}`);
  }

  return response.json();
}

export const realApiService = {
  // 1. Xác thực đăng nhập
  async login(email: string, pass: string): Promise<{ success: boolean; user?: User; token?: string; message: string }> {
    const data = await request<{ user: User; token: string }>(`/auth/login`, {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });
    
    // Lưu JWT token
    if (typeof window !== "undefined" && data.token) {
      localStorage.setItem("auth_token", data.token);
    }
    return { success: true, user: data.user, message: "Đăng nhập thành công!" };
  },

  // 2. Lấy danh sách khóa học
  async getCourses(role: UserRole = "student", teacherId?: string): Promise<Course[]> {
    const query = new URLSearchParams();
    query.set("role", role);
    if (teacherId) query.set("teacherId", teacherId);
    
    return request<Course[]>(`/courses?${query.toString()}`);
  },

  // 3. Nộp bài kiểm tra
  async submitAttempt(attemptId: string, answers: any[]): Promise<any> {
    return request(`/attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    });
  },

  // 4. AI Tutor Stream (Server-Sent Events)
  streamAIChat(conversationId: string, message: string, onChunk: (text: string) => void) {
    const token = localStorage.getItem("auth_token");
    const eventSource = new EventSource(
      `${API_BASE_URL}/ai/conversations/${conversationId}/stream?message=${encodeURIComponent(message)}&token=${token}`
    );

    eventSource.onmessage = (event) => {
      if (event.data === "[DONE]") {
        eventSource.close();
      } else {
        onChunk(event.data);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };
  }
};
```

---

## TỔNG KẾT

Tài liệu này đã bao quát đầy đủ:
- **13 Cụm chức năng (13 Modules)** theo chuẩn yêu cầu phân công CRUD.
- **50+ Phương thức Mock Services** tương ứng với các Endpoint RESTful tiêu chuẩn.
- **100% Cấu trúc dữ liệu TypeScript Models** chuẩn hóa.
- **Các quy tắc bảo mật & phân quyền vai trò (Admin, Teacher, Student)**.

Chúc đội ngũ phát triển tích hợp backend thành công và nhanh chóng! 🚀
