// ============================================================================
// EDUMIND AI - INITIAL MOCK DATA (13 MODULES)
// Cung cấp dữ liệu mẫu phong phú và chuẩn hóa cho toàn hệ thống
// ============================================================================

import {
  User,
  Subject,
  Topic,
  Course,
  Lesson,
  Material,
  Enrollment,
  Quiz,
  Question,
  QuizAttempt,
  StudentProgress,
  Conversation,
  ChatMessage,
  OCRScan,
  Recommendation,
  Notification,
  SystemLog,
  AIConfig,
} from "@/types";

// ----------------------------------------------------------------------------
// 1. TÀI KHOẢN MẪU (3 VAI TRÒ CHÍNH)
// ----------------------------------------------------------------------------
export const initialUsers: User[] = [
  {
    id: "admin-01",
    email: "admin@edumind.edu.vn",
    name: "Nguyễn Quản Trị",
    avatar: "QT",
    role: "admin",
    status: "active",
    phone: "0901234567",
    department: "Phòng Đào tạo & Quản trị Hệ thống",
    bio: "Quản trị viên cấp cao của hệ thống LMS EduMind AI.",
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-11-10T10:00:00Z",
  },
  {
    id: "teacher-01",
    email: "nam.nguyen@edumind.edu.vn",
    name: "ThS. Nguyễn Hoàng Nam",
    avatar: "HN",
    role: "teacher",
    status: "active",
    phone: "0912345678",
    department: "Khoa Công nghệ Thông tin",
    bio: "Giảng viên chuyên ngành Khoa học Máy tính & AI. Hơn 8 năm kinh nghiệm giảng dạy.",
    createdAt: "2026-09-05T09:00:00Z",
    updatedAt: "2026-11-08T14:30:00Z",
  },
  {
    id: "teacher-02",
    email: "ha.tran@edumind.edu.vn",
    name: "TS. Trần Thu Hà",
    avatar: "TH",
    role: "teacher",
    status: "active",
    phone: "0923456789",
    department: "Khoa Toán - Tin học Ứng dụng",
    bio: "Tiến sĩ Toán ứng dụng, phụ trách các môn Toán rời rạc & Đại số tuyến tính.",
    createdAt: "2026-09-06T10:00:00Z",
    updatedAt: "2026-11-05T16:20:00Z",
  },
  {
    id: "student-01",
    email: "minhanh.tran@student.edumind.edu.vn",
    name: "Trần Minh Anh",
    avatar: "MA",
    role: "student",
    status: "active",
    phone: "0934567890",
    department: "Sinh viên K24 - CNTT",
    bio: "Đam mê lập trình Python, Trí tuệ nhân tạo và phát triển ứng dụng thông minh.",
    createdAt: "2026-09-10T07:30:00Z",
    updatedAt: "2026-11-12T08:00:00Z",
  },
  {
    id: "student-02",
    email: "bao.le@student.edumind.edu.vn",
    name: "Lê Quốc Bảo",
    avatar: "QB",
    role: "student",
    status: "active",
    phone: "0945678901",
    department: "Sinh viên K24 - Khoa học Dữ liệu",
    bio: "Học viên năng động, thường xuyên luyện tập thuật toán.",
    createdAt: "2026-09-10T08:00:00Z",
    updatedAt: "2026-11-11T11:00:00Z",
  },
  {
    id: "student-03",
    email: "yen.pham@student.edumind.edu.vn",
    name: "Phạm Hải Yến",
    avatar: "HY",
    role: "student",
    status: "locked", // Tài khoản đã bị Admin khóa để kiểm tra UI RBAC
    phone: "0956789012",
    department: "Sinh viên K23 - Hệ thống thông tin",
    bio: "Tài khoản đang tạm khóa do vi phạm nội quy kiểm tra trực tuyến.",
    createdAt: "2026-09-11T09:15:00Z",
    updatedAt: "2026-11-02T15:00:00Z",
  },
];

// ----------------------------------------------------------------------------
// 2. MÔN HỌC & CHỦ ĐỀ
// ----------------------------------------------------------------------------
export const initialSubjects: Subject[] = [
  {
    id: "sub-01",
    code: "CS101",
    name: "Lập trình máy tính & Cơ sở thuật toán",
    description: "Nền tảng ngôn ngữ lập trình, cấu trúc dữ liệu cơ bản và giải thuật máy tính.",
    iconName: "code",
    isHidden: false,
    topicCount: 4,
    courseCount: 2,
    createdAt: "2026-09-01T08:00:00Z",
  },
  {
    id: "sub-02",
    code: "MATH201",
    name: "Toán học ứng dụng & Đại số",
    description: "Đại số tuyến tính, ma trận, không gian vector và giải tích phục vụ tính toán khoa học.",
    iconName: "sigma",
    isHidden: false,
    topicCount: 3,
    courseCount: 1,
    createdAt: "2026-09-01T08:30:00Z",
  },
  {
    id: "sub-03",
    code: "AI301",
    name: "Trí tuệ nhân tạo & Học máy",
    description: "Nhập môn AI, mô hình ngôn ngữ lớn (LLM), thị giác máy tính và prompt engineering.",
    iconName: "brain",
    isHidden: false,
    topicCount: 3,
    courseCount: 1,
    createdAt: "2026-09-02T09:00:00Z",
  },
  {
    id: "sub-04",
    code: "SEC102",
    name: "An toàn thông tin cơ bản",
    description: "Môn học tự chọn về bảo mật ứng dụng web và mạng máy tính (tạm ẩn).",
    iconName: "shield",
    isHidden: true, // Thể hiện tính năng ẩn/hiện môn học của Admin
    topicCount: 2,
    courseCount: 0,
    createdAt: "2026-09-03T10:00:00Z",
  },
];

export const initialTopics: Topic[] = [
  { id: "top-01", subjectId: "sub-01", name: "Cú pháp & Kiểu dữ liệu cơ bản", description: "Biến, kiểu số, chuỗi, điều kiện rẽ nhánh", order: 1, isHidden: false },
  { id: "top-02", subjectId: "sub-01", name: "Vòng lặp & Cấu trúc lặp", description: "Vòng lặp for, while, nested loop", order: 2, isHidden: false },
  { id: "top-03", subjectId: "sub-01", name: "Hàm & Module", description: "Tổ chức mã nguồn theo hàm và thư viện tái sử dụng", order: 3, isHidden: false },
  { id: "top-04", subjectId: "sub-01", name: "Cấu trúc dữ liệu nâng cao", description: "List, Tuple, Dictionary, Stack, Queue", order: 4, isHidden: false },
  { id: "top-05", subjectId: "sub-02", name: "Ma trận & Hệ phương trình", description: "Các phép toán ma trận, định thức, khử Gauss", order: 1, isHidden: false },
  { id: "top-06", subjectId: "sub-02", name: "Không gian Vector & Phép biến đổi", description: "Cơ sở, số chiều, trị riêng và vector riêng", order: 2, isHidden: false },
  { id: "top-07", subjectId: "sub-03", name: "Tổng quan AI Hiện đại", description: "Lịch sử AI, LLM, Generative AI", order: 1, isHidden: false },
];

// ----------------------------------------------------------------------------
// 3. KHÓA HỌC
// ----------------------------------------------------------------------------
export const initialCourses: Course[] = [
  {
    id: "course-01",
    subjectId: "sub-01",
    subjectName: "LẬP TRÌNH",
    teacherId: "teacher-01",
    teacherName: "ThS. Nguyễn Hoàng Nam",
    title: "Python từ cơ bản đến ứng dụng",
    description: "Học lập trình Python từ con số 0, làm chủ các cấu trúc dữ liệu, giải thuật và xây dựng dự án mini.",
    thumbnail: "/courses/python.png",
    level: "beginner",
    status: "published",
    tone: "lavender",
    badgeMark: "Py",
    durationHours: 32,
    lessonCount: 8,
    enrolledCount: 128,
    createdAt: "2026-09-15T08:00:00Z",
    updatedAt: "2026-11-10T14:00:00Z",
  },
  {
    id: "course-02",
    subjectId: "sub-02",
    subjectName: "TOÁN HỌC",
    teacherId: "teacher-02",
    teacherName: "TS. Trần Thu Hà",
    title: "Đại số tuyến tính cho Khoa học Dữ liệu",
    description: "Trang bị nền tảng toán học vững chắc: ma trận, vector, chuẩn hóa dữ liệu ứng dụng trong Machine Learning.",
    thumbnail: "/courses/algebra.png",
    level: "intermediate",
    status: "published",
    tone: "mint",
    badgeMark: "∑",
    durationHours: 24,
    lessonCount: 6,
    enrolledCount: 85,
    createdAt: "2026-09-18T09:00:00Z",
    updatedAt: "2026-11-05T10:30:00Z",
  },
  {
    id: "course-03",
    subjectId: "sub-03",
    subjectName: "TRÍ TUỆ NHÂN TẠO",
    teacherId: "teacher-01",
    teacherName: "ThS. Nguyễn Hoàng Nam",
    title: "Thực hành Prompt Engineering & AI Agents",
    description: "Khóa học chuyên sâu về cách thiết kế prompt, khai thác Gemini/OpenAI API và xây dựng hệ thống Multi-Agent.",
    thumbnail: "/courses/ai-agent.png",
    level: "intermediate",
    status: "draft", // Thể hiện trạng thái Bản nháp mà Teacher đang soạn thảo
    tone: "sky",
    badgeMark: "AI",
    durationHours: 18,
    lessonCount: 4,
    enrolledCount: 0,
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-12T09:00:00Z",
  },
  {
    id: "course-04",
    subjectId: "sub-01",
    subjectName: "LẬP TRÌNH",
    teacherId: "teacher-01",
    teacherName: "ThS. Nguyễn Hoàng Nam",
    title: "Cấu trúc dữ liệu & Thuật toán nâng cao",
    description: "Luyện tư duy giải thuật, phân tích độ phức tạp O(n), cây nhị phân, đồ thị và quy hoạch động.",
    thumbnail: "/courses/dsa.png",
    level: "advanced",
    status: "published",
    tone: "amber",
    badgeMark: "DSA",
    durationHours: 40,
    lessonCount: 10,
    enrolledCount: 45,
    createdAt: "2026-09-20T11:00:00Z",
    updatedAt: "2026-11-07T15:00:00Z",
  },
];

// ----------------------------------------------------------------------------
// 4. BÀI HỌC & TÀI LIỆU
// ----------------------------------------------------------------------------
export const initialLessons: Lesson[] = [
  {
    id: "les-01",
    courseId: "course-01",
    title: "Bài 1: Giới thiệu ngôn ngữ Python & Cài đặt môi trường",
    description: "Tổng quan về Python, cài đặt VS Code và viết chương trình Hello World đầu tiên.",
    order: 1,
    durationMinutes: 30,
    videoUrl: "https://www.youtube.com/watch?v=kqtD5dpn9C8",
    contentMarkdown: `### 1. Tổng quan về Python\nPython là một ngôn ngữ lập trình bậc cao, thông dịch, hướng đối tượng và đa năng.\n\n### 2. Ví dụ đầu tiên\n\`\`\`python\nprint("Xin chào EduMind AI!")\n\`\`\``,
    isPublished: true,
  },
  {
    id: "les-02",
    courseId: "course-01",
    title: "Bài 2: Biến, Kiểu dữ liệu & Các toán tử số học",
    description: "Khám phá các kiểu dữ liệu int, float, str, bool và phép toán.",
    order: 2,
    durationMinutes: 45,
    contentMarkdown: `### Biến và Kiểu dữ liệu\nPython tự động suy diễn kiểu dữ liệu. Sử dụng hàm \`type()\` để kiểm tra.`,
    isPublished: true,
  },
  {
    id: "les-03",
    courseId: "course-01",
    title: "Bài 3: Cấu trúc điều kiện If - Else trong Python",
    description: "Kiểm tra biểu thức logic và phân nhánh luồng thực thi chương trình.",
    order: 3,
    durationMinutes: 40,
    contentMarkdown: `### Cú pháp if-elif-else\nLưu ý quy tắc thụt đầu dòng (indentation) rất nghiêm ngặt trong Python.`,
    isPublished: true,
  },
  {
    id: "les-04",
    courseId: "course-01",
    title: "Bài 4: Vòng lặp For & Hàm range()",
    description: "Duyệt qua danh sách, chuỗi và điều khiển số lần lặp với range().",
    order: 4,
    durationMinutes: 50,
    contentMarkdown: `### Vòng lặp for\n\`\`\`python\nfor i in range(1, 6):\n    print(f"Bước lặp thứ {i}")\n\`\`\``,
    isPublished: true,
  },
  {
    id: "les-05",
    courseId: "course-01",
    title: "Bài 5: Vòng lặp While & Lệnh break, continue",
    description: "Lặp với điều kiện duy trì và các kỹ thuật ngắt vòng lặp an toàn.",
    order: 5,
    durationMinutes: 45,
    contentMarkdown: `### Tránh vòng lặp vô tận\nLuôn đảm bảo biến đếm được cập nhật trong thân vòng lặp while.`,
    isPublished: true,
  },
  {
    id: "les-06",
    courseId: "course-01",
    title: "Bài 6: Cấu trúc danh sách List & Các phương thức tích hợp",
    description: "Thao tác mảng động: append, extend, slice, sort.",
    order: 6,
    durationMinutes: 60,
    contentMarkdown: `### List Comprehension\n\`\`\`python\nsquares = [x**2 for x in range(10)]\n\`\`\``,
    isPublished: true,
  },
  {
    id: "les-07",
    courseId: "course-01",
    title: "Bài 7: Dictionary & Set trong Python",
    description: "Lưu trữ dữ liệu dạng key-value và tập hợp không trùng lặp.",
    order: 7,
    durationMinutes: 45,
    contentMarkdown: `### Key-Value mapping\nTruy xuất dữ liệu siêu tốc độ với cấu trúc bảng băm (hash table).`,
    isPublished: true,
  },
  {
    id: "les-08",
    courseId: "course-01",
    title: "Bài 8: Viết hàm (Functions) & Xử lý ngoại lệ",
    description: "Tổ chức mã nguồn tái sử dụng với def, tham số mặc định và try-except.",
    order: 8,
    durationMinutes: 60,
    contentMarkdown: `### Bắt lỗi với try/except\nGiúp chương trình không bị crash bất ngờ khi gặp dữ liệu không hợp lệ.`,
    isPublished: true,
  },
];

export const initialMaterials: Material[] = [
  {
    id: "mat-01",
    lessonId: "les-04",
    courseId: "course-01",
    title: "Slide bài giảng: Vòng lặp for & range()",
    fileType: "slide",
    fileUrl: "/materials/python-loops.pdf",
    fileSize: "2.4 MB",
    uploadedAt: "2026-10-15T09:00:00Z",
  },
  {
    id: "mat-02",
    lessonId: "les-04",
    courseId: "course-01",
    title: "Mã nguồn bài tập mẫu (loops_demo.py)",
    fileType: "code",
    fileUrl: "/materials/loops_demo.py",
    fileSize: "14 KB",
    uploadedAt: "2026-10-15T09:15:00Z",
  },
  {
    id: "mat-03",
    lessonId: "les-04",
    courseId: "course-01",
    title: "Cheat Sheet: Python Syntax Summary",
    fileType: "pdf",
    fileUrl: "/materials/python-cheatsheet.pdf",
    fileSize: "1.1 MB",
    uploadedAt: "2026-10-16T11:00:00Z",
  },
];

// ----------------------------------------------------------------------------
// 5. GHI DANH KHÓA HỌC
// ----------------------------------------------------------------------------
export const initialEnrollments: Enrollment[] = [
  {
    id: "enr-01",
    courseId: "course-01",
    courseTitle: "Python từ cơ bản đến ứng dụng",
    studentId: "student-01",
    studentName: "Trần Minh Anh",
    studentAvatar: "MA",
    studentEmail: "minhanh.tran@student.edumind.edu.vn",
    enrolledAt: "2026-09-15T10:00:00Z",
    status: "active",
    progressPercent: 68,
    lastAccessedAt: "2026-11-12T09:30:00Z",
  },
  {
    id: "enr-02",
    courseId: "course-02",
    courseTitle: "Đại số tuyến tính cho Khoa học Dữ liệu",
    studentId: "student-01",
    studentName: "Trần Minh Anh",
    studentAvatar: "MA",
    studentEmail: "minhanh.tran@student.edumind.edu.vn",
    enrolledAt: "2026-09-20T14:00:00Z",
    status: "active",
    progressPercent: 42,
    lastAccessedAt: "2026-11-11T15:00:00Z",
  },
  {
    id: "enr-03",
    courseId: "course-04",
    courseTitle: "Cấu trúc dữ liệu & Thuật toán nâng cao",
    studentId: "student-01",
    studentName: "Trần Minh Anh",
    studentAvatar: "MA",
    studentEmail: "minhanh.tran@student.edumind.edu.vn",
    enrolledAt: "2026-10-01T08:30:00Z",
    status: "active",
    progressPercent: 15,
    lastAccessedAt: "2026-11-08T16:00:00Z",
  },
  {
    id: "enr-04",
    courseId: "course-01",
    courseTitle: "Python từ cơ bản đến ứng dụng",
    studentId: "student-02",
    studentName: "Lê Quốc Bảo",
    studentAvatar: "QB",
    studentEmail: "bao.le@student.edumind.edu.vn",
    enrolledAt: "2026-09-16T11:00:00Z",
    status: "active",
    progressPercent: 90,
    lastAccessedAt: "2026-11-11T14:20:00Z",
  },
];

// ----------------------------------------------------------------------------
// 6. BÀI TẬP, BÀI KIỂM TRA & CÂU HỎI
// ----------------------------------------------------------------------------
export const initialQuizzes: Quiz[] = [
  {
    id: "quiz-01",
    courseId: "course-01",
    courseTitle: "Python từ cơ bản đến ứng dụng",
    lessonId: "les-04",
    title: "Kiểm tra 15 phút: Vòng lặp & Cấu trúc điều khiển",
    description: "Đánh giá kiến thức về vòng lặp for, while và cú pháp điều kiện trong Python.",
    timeLimitMinutes: 15,
    passingScore: 5.0,
    maxScore: 10.0,
    isPublished: true,
    questionCount: 4,
    createdAt: "2026-10-18T10:00:00Z",
  },
  {
    id: "quiz-02",
    courseId: "course-01",
    courseTitle: "Python từ cơ bản đến ứng dụng",
    lessonId: "les-08",
    title: "Bài tập lớn giữa kỳ: Xây dựng CLI Quản lý danh bạ",
    description: "Thực hành thiết kế hàm, đọc ghi file và bắt lỗi ngoại lệ trong Python.",
    timeLimitMinutes: 60,
    passingScore: 6.0,
    maxScore: 10.0,
    isPublished: false, // Thể hiện trạng thái chưa xuất bản của Teacher
    questionCount: 3,
    createdAt: "2026-11-05T09:00:00Z",
  },
];

export const initialQuestions: Question[] = [
  {
    id: "q-01",
    quizId: "quiz-01",
    content: "Đoạn mã sau in ra kết quả gì?\n```python\nfor i in range(1, 6, 2):\n    print(i, end=' ')\n```",
    type: "multiple_choice",
    points: 2.5,
    options: [
      { id: "opt-1a", text: "1 2 3 4 5", isCorrect: false },
      { id: "opt-1b", text: "1 3 5", isCorrect: true },
      { id: "opt-1c", text: "2 4 6", isCorrect: false },
      { id: "opt-1d", text: "1 3", isCorrect: false },
    ],
    explanation: "range(start=1, stop=6, step=2) bắt đầu từ 1, nhảy cách 2 đơn vị và dừng trước 6 -> 1, 3, 5.",
  },
  {
    id: "q-02",
    quizId: "quiz-01",
    content: "Từ khóa nào trong Python được dùng để thoát ngay lập tức khỏi vòng lặp đang chạy?",
    type: "multiple_choice",
    points: 2.5,
    options: [
      { id: "opt-2a", text: "continue", isCorrect: false },
      { id: "opt-2b", text: "pass", isCorrect: false },
      { id: "opt-2c", text: "break", isCorrect: true },
      { id: "opt-2d", text: "exit", isCorrect: false },
    ],
    explanation: "Từ khóa 'break' dùng để ngắt vòng lặp ngay lập tức và chuyển quyền thực thi ra ngoài vòng lặp.",
  },
  {
    id: "q-03",
    quizId: "quiz-01",
    content: "Hàm nào sau đây dùng để đếm số lượng phần tử trong một List?",
    type: "multiple_choice",
    points: 2.5,
    options: [
      { id: "opt-3a", text: "count()", isCorrect: false },
      { id: "opt-3b", text: "length()", isCorrect: false },
      { id: "opt-3c", text: "len()", isCorrect: true },
      { id: "opt-3d", text: "size()", isCorrect: false },
    ],
    explanation: "Hàm tích hợp sẵn `len(iterable)` trả về số phần tử của danh sách.",
  },
  {
    id: "q-04",
    quizId: "quiz-01",
    content: "Hãy phân tích ngắn gọn: Khi nào nên sử dụng vòng lặp `for` và khi nào nên sử dụng vòng lặp `while` trong Python? Nêu 1 ví dụ cụ thể cho mỗi trường hợp.",
    type: "essay",
    points: 2.5,
    options: [],
    explanation: "Vòng lặp for dùng khi biết trước số lần lặp hoặc duyệt phần tử của tập hợp; while dùng khi lặp dựa vào điều kiện duy trì chưa biết trước số lần.",
  },
];

// ----------------------------------------------------------------------------
// 7. BÀI LÀM & CHẤM ĐIỂM
// ----------------------------------------------------------------------------
export const initialAttempts: QuizAttempt[] = [
  {
    id: "att-01",
    quizId: "quiz-01",
    quizTitle: "Kiểm tra 15 phút: Vòng lặp & Cấu trúc điều khiển",
    courseId: "course-01",
    studentId: "student-01",
    studentName: "Trần Minh Anh",
    studentAvatar: "MA",
    status: "submitted", // Đã nộp bài, đang chờ Teacher chấm tự luận!
    answers: [
      { questionId: "q-01", selectedOptionId: "opt-1b", scoreAwarded: 2.5 },
      { questionId: "q-02", selectedOptionId: "opt-2c", scoreAwarded: 2.5 },
      { questionId: "q-03", selectedOptionId: "opt-3c", scoreAwarded: 2.5 },
      {
        questionId: "q-04",
        essayAnswer: "Dùng for khi đã biết trước tập hợp duyệt (vd duyệt list sinh viên). Dùng while khi lặp dựa vào điều kiện chưa biết số lần (vd chờ người dùng nhập mật khẩu đúng).",
        // scoreAwarded chưa có vì Teacher chưa chấm
      },
    ],
    totalScore: 7.5, // 7.5 trắc nghiệm + phần tự luận đang chờ chấm
    maxScore: 10.0,
    startedAt: "2026-11-12T08:15:00Z",
    submittedAt: "2026-11-12T08:28:00Z",
  },
  {
    id: "att-02",
    quizId: "quiz-01",
    quizTitle: "Kiểm tra 15 phút: Vòng lặp & Cấu trúc điều khiển",
    courseId: "course-01",
    studentId: "student-02",
    studentName: "Lê Quốc Bảo",
    studentAvatar: "QB",
    status: "graded", // Đã được Teacher chấm hoàn tất
    answers: [
      { questionId: "q-01", selectedOptionId: "opt-1b", scoreAwarded: 2.5 },
      { questionId: "q-02", selectedOptionId: "opt-2c", scoreAwarded: 2.5 },
      { questionId: "q-03", selectedOptionId: "opt-3c", scoreAwarded: 2.5 },
      {
        questionId: "q-04",
        essayAnswer: "Vòng for dùng để duyệt qua các phần tử biết trước số lượng. Vòng while dùng khi lặp với điều kiện logic chưa biết trước số lần dừng.",
        scoreAwarded: 2.0,
        teacherFeedback: "Câu trả lời đúng ý chính nhưng ví dụ còn sơ sài.",
      },
    ],
    totalScore: 9.5,
    maxScore: 10.0,
    startedAt: "2026-11-11T10:00:00Z",
    submittedAt: "2026-11-11T10:14:00Z",
    gradedAt: "2026-11-11T15:30:00Z",
    gradedBy: "ThS. Nguyễn Hoàng Nam",
    teacherNotes: "Làm bài rất tốt, nắm vững lý thuyết và áp dụng chuẩn xác.",
  },
];

// ----------------------------------------------------------------------------
// 8. TIẾN ĐỘ HỌC TẬP
// ----------------------------------------------------------------------------
export const initialProgress: StudentProgress[] = [
  {
    id: "prog-01",
    studentId: "student-01",
    courseId: "course-01",
    completedLessonIds: ["les-01", "les-02", "les-03"],
    lastLessonId: "les-04",
    lastStudiedAt: "2026-11-12T09:30:00Z",
    percentCompleted: 68,
    totalMinutesStudied: 265,
  },
  {
    id: "prog-02",
    studentId: "student-01",
    courseId: "course-02",
    completedLessonIds: ["les-01", "les-02"],
    lastLessonId: "les-03",
    lastStudiedAt: "2026-11-11T15:00:00Z",
    percentCompleted: 42,
    totalMinutesStudied: 180,
  },
];

// ----------------------------------------------------------------------------
// 9. TRỢ LÝ HỌC TẬP AI (AI TUTOR)
// ----------------------------------------------------------------------------
export const initialConversations: Conversation[] = [
  {
    id: "conv-01",
    studentId: "student-01",
    courseId: "course-01",
    title: "Giải thích vòng lặp for & hàm range()",
    createdAt: "2026-11-12T09:00:00Z",
    updatedAt: "2026-11-12T09:12:00Z",
    isArchived: false,
  },
  {
    id: "conv-02",
    studentId: "student-01",
    courseId: "course-02",
    title: "Cách tính định thức ma trận 3x3",
    createdAt: "2026-11-10T14:00:00Z",
    updatedAt: "2026-11-10T14:20:00Z",
    isArchived: false,
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: "msg-01",
    conversationId: "conv-01",
    sender: "user",
    content: "Chào bạn, hãy giải thích giúp mình hàm range(start, stop, step) trong Python hoạt động như thế nào và cho một ví dụ dễ hiểu nhé!",
    timestamp: "2026-11-12T09:01:00Z",
  },
  {
    id: "msg-02",
    conversationId: "conv-01",
    sender: "assistant",
    content: `Chào Minh Anh! Hàm \`range()\` trong Python được sử dụng rất phổ biến trong vòng lặp \`for\` để sinh ra một chuỗi số nguyên.

Cú pháp đầy đủ:
\`\`\`python
range(start, stop, step)
\`\`\`
- **start**: Giá trị bắt đầu (mặc định là 0 nếu không điền).
- **stop**: Giá trị kết thúc (chuỗi sẽ dừng lại **ngay trước** giá trị này, không bao gồm stop).
- **step**: Bước nhảy giữa các số (mặc định là 1).

**Ví dụ thực tế:**
\`\`\`python
# In các số lẻ từ 1 đến 9:
for num in range(1, 10, 2):
    print(num)
# Kết quả: 1, 3, 5, 7, 9
\`\`\`

Bạn có muốn mình tạo thêm câu đố trắc nghiệm để bạn thử sức ngay không?`,
    timestamp: "2026-11-12T09:01:30Z",
    suggestions: [
      "Tạo câu hỏi trắc nghiệm ôn tập",
      "Sự khác nhau giữa for và while",
      "Cách duyệt ngược danh sách với range()",
    ],
  },
];

// ----------------------------------------------------------------------------
// 10. QUÉT TÀI LIỆU OCR
// ----------------------------------------------------------------------------
export const initialOCRScans: OCRScan[] = [
  {
    id: "ocr-01",
    studentId: "student-01",
    fileName: "bai_tap_ma_tran_trang_45.jpg",
    imageUrl: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&auto=format&fit=crop&q=60",
    recognizedText: "Cho ma tran A = [[2, 1], [5, 3]]. Tim ma tran nghich dao A^(-1) va giai he phuong trinh Ax = b voi b = [4, 7].",
    correctedText: "Cho ma trận $A = \\begin{bmatrix} 2 & 1 \\\\ 5 & 3 \\end{bmatrix}$. Tìm ma trận nghịch đảo $A^{-1}$ và giải hệ phương trình $Ax = b$ với $b = \\begin{bmatrix} 4 \\\\ 7 \\end{bmatrix}$.",
    status: "completed",
    createdAt: "2026-11-11T16:30:00Z",
    sentToAI: true,
    notes: "Đã trích xuất công thức LaTeX chuẩn xác, sẵn sàng gửi sang AI Tutor giải bài tập.",
  },
  {
    id: "ocr-02",
    studentId: "student-01",
    fileName: "ghi_chu_vong_lap_tay.png",
    imageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=60",
    recognizedText: "while condition: do something break if stop",
    correctedText: "while condition:\n    do_something()\n    if should_stop:\n        break",
    status: "completed",
    createdAt: "2026-11-12T07:45:00Z",
    sentToAI: false,
    notes: "Bản nháp ghi chú viết tay của học viên.",
  },
];

// ----------------------------------------------------------------------------
// 11. ĐỀ XUẤT HỌC TẬP
// ----------------------------------------------------------------------------
export const initialRecommendations: Recommendation[] = [
  {
    id: "rec-01",
    studentId: "student-01",
    title: "Ôn tập vòng lặp For & Bài tập List",
    description: "Bạn đã hoàn thành 68% khóa Python. Hãy làm bài kiểm tra 15 phút để củng cố kiến thức trước khi sang Bài 5.",
    type: "review",
    courseId: "course-01",
    isRead: false,
    isDismissed: false,
    createdAt: "2026-11-12T08:00:00Z",
  },
  {
    id: "rec-02",
    studentId: "student-01",
    title: "Khám phá: Cấu trúc dữ liệu & Thuật toán",
    description: "Khóa học này bổ trợ tuyệt vời cho tư duy tối ưu mã nguồn khi bạn đã nắm chắc Python cơ bản.",
    type: "course",
    courseId: "course-04",
    isRead: true,
    isDismissed: false,
    createdAt: "2026-11-10T12:00:00Z",
  },
];

// ----------------------------------------------------------------------------
// 12. THÔNG BÁO
// ----------------------------------------------------------------------------
export const initialNotifications: Notification[] = [
  {
    id: "notif-01",
    userId: "admin-01",
    title: "Cập nhật hệ thống",
    message: "Hệ thống AI Tutor đã xử lý 1,240 yêu cầu thành công trong 24 giờ qua mà không phát sinh lỗi.",
    type: "info",
    isRead: false,
    createdAt: "2026-11-12T08:30:00Z",
  },
  {
    id: "notif-02",
    userId: "teacher-01",
    title: "Có bài kiểm tra mới cần chấm!",
    message: "Học viên Trần Minh Anh vừa nộp bài 'Kiểm tra 15 phút: Vòng lặp' và đang chờ chấm phần tự luận.",
    type: "warning",
    isRead: false,
    createdAt: "2026-11-12T08:28:00Z",
    link: "#grading",
  },
  {
    id: "notif-03",
    userId: "student-01",
    title: "Nhắc nhở học tập hôm nay",
    message: "Bạn có lịch ôn tập 'Vòng lặp Python' lúc 09:30. Hãy dành 20 phút để giữ vững chuỗi streak 4 ngày nhé!",
    type: "info",
    isRead: false,
    createdAt: "2026-11-12T07:00:00Z",
  },
  {
    id: "notif-04",
    userId: "student-01",
    title: "Đã có điểm bài tập Đại số tuyến tính",
    message: "Cô Trần Thu Hà đã chấm điểm bài tập của bạn: Đạt 9.5 / 10 điểm.",
    type: "success",
    isRead: true,
    createdAt: "2026-11-11T16:00:00Z",
  },
];

// ----------------------------------------------------------------------------
// 13. NHẬT KÝ HỆ THỐNG & CẤU HÌNH AI
// ----------------------------------------------------------------------------
export const initialSystemLogs: SystemLog[] = [
  {
    id: "log-01",
    level: "info",
    action: "USER_LOGIN",
    actorId: "admin-01",
    actorName: "Nguyễn Quản Trị",
    actorRole: "admin",
    timestamp: "2026-11-12T08:00:00Z",
    details: "Đăng nhập thành công từ IP 192.168.1.10 (Bảng điều khiển Quản trị).",
  },
  {
    id: "log-02",
    level: "info",
    action: "SUBMISSION_RECEIVED",
    actorId: "student-01",
    actorName: "Trần Minh Anh",
    actorRole: "student",
    timestamp: "2026-11-12T08:28:00Z",
    details: "Nộp bài kiểm tra 'quiz-01' thành công. Hệ thống tự động chấm trắc nghiệm: 7.5đ.",
  },
  {
    id: "log-03",
    level: "warn",
    action: "ACCOUNT_LOCKED",
    actorId: "admin-01",
    actorName: "Nguyễn Quản Trị",
    actorRole: "admin",
    timestamp: "2026-11-02T15:00:00Z",
    details: "Khóa tài khoản 'student-03' (Phạm Hải Yến) do vi phạm quy chế thi trực tuyến.",
  },
  {
    id: "log-04",
    level: "info",
    action: "AI_CONFIG_UPDATED",
    actorId: "admin-01",
    actorName: "Nguyễn Quản Trị",
    actorRole: "admin",
    timestamp: "2026-11-01T10:30:00Z",
    details: "Cập nhật mô hình AI sang Gemini 2.0 Flash với giới hạn 10,000 tokens/ngày.",
  },
];

export const initialAIConfig: AIConfig = {
  provider: "gemini",
  modelName: "gemini-2.0-flash-exp",
  apiKeyMasked: "AIzaSyD-•••••••••••••••••••••••••••••",
  maxTokens: 4096,
  temperature: 0.7,
  ocrEngine: "gemini-multimodal",
  ocrConfidenceThreshold: 0.85,
  maxUploadSizeMB: 10,
  serviceStatus: "healthy",
  dailyUsageCount: 2450,
  dailyUsageLimit: 15000,
  updatedAt: "2026-11-12T08:00:00Z",
};
