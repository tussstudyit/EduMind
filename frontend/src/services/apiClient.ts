import {
  AIConfig,
  AIConputTestResult,
  AiCorpusDocument,
  AiDatasetEntry,
  AiModelVersion,
  AiTrainingJob,
  ChatMessage,
  Conversation,
  Course,
  CourseLevel,
  CourseReport,
  CourseStatus,
  Enrollment,
  Lesson,
  LessonStatus,
  Material,
  Notification,
  OCRScan,
  Question,
  Quiz,
  QuizAttempt,
  Recommendation,
  StudentAnswer,
  StudentProgress,
  Subject,
  SystemLog,
  TeacherReview,
  TeacherReviewSummary,
  Topic,
  User,
} from "@/types";
import type { ImportedQuestionDraft } from "@/services/questionImportService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const ACCESS_TOKEN_KEY = "edumind_access_token";

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  user: User;
}

export type CreateUserInput = Pick<User, "name" | "email" | "role"> & {
  password: string;
  phone?: string;
  institution?: string;
  department?: string;
};

export type UpdateUserInput = Partial<
  Pick<User, "name" | "email" | "role" | "status" | "phone" | "institution" | "department">
>;

export interface PasswordResetRequest {
  id: string;
  userId: string;
  email: string;
  name: string;
  status: "pending" | "sent" | "completed";
  requestedAt: string;
  sentAt: string | null;
  completedAt: string | null;
}

export interface AdminReportSummary {
  users: number;
  teachers: number;
  students: number;
  courses: number;
  publishedCourses: number;
  activeEnrollments: number;
  quizzes: number;
  attempts: number;
  submittedAttempts: number;
  ocrScans: number;
  aiTutorReplies: number;
  recommendationsCount: number;
  passRatePercent: number;
  weeklyExamActivity: Array<{ day: string; attempts: number; rate: number }>;
}

type ApiChatMessage = Omit<ChatMessage, "timestamp"> & {
  timestamp?: string;
  createdAt?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const token = typeof window !== "undefined" ? window.localStorage.getItem(ACCESS_TOKEN_KEY) : null;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(typeof FormData !== "undefined" && init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("Không kết nối được backend. Hãy kiểm tra máy chủ và PostgreSQL đã chạy chưa.");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message || "Yêu cầu không thành công.";
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function normalizeMessage(message: ApiChatMessage): ChatMessage {
  return {
    ...message,
    timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
  };
}

function normalizeQuiz(quiz: Quiz): Quiz {
  return {
    ...quiz,
    timeLimitMinutes: Number(quiz.timeLimitMinutes) || 0,
    passingScore: Number(quiz.passingScore) || 0,
    maxScore: Number(quiz.maxScore) || 0,
    questionCount: Number(quiz.questionCount) || 0,
  };
}

function normalizeQuestion(question: Question): Question {
  return {
    ...question,
    points: Number(question.points) || 0,
    options: Array.isArray(question.options) ? question.options : [],
  };
}

function normalizeAttempt(attempt: QuizAttempt): QuizAttempt {
  return {
    ...attempt,
    totalScore: Number(attempt.totalScore) || 0,
    maxScore: Number(attempt.maxScore) || 0,
    answers: Array.isArray(attempt.answers)
      ? attempt.answers.map((a) => ({
          ...a,
          scoreAwarded: a.scoreAwarded !== undefined && a.scoreAwarded !== null ? Number(a.scoreAwarded) : undefined,
        }))
      : [],
  };
}

export const apiClient = {
  getAccessToken(): string | null {
    return typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    if (typeof window !== "undefined") window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  clearAccessToken(): void {
    if (typeof window !== "undefined") window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  // --------------------------------------------------------------------------
  // MODULE 1: AUTH, PROFILE & USERS
  // --------------------------------------------------------------------------
  login(email: string, password: string): Promise<AuthResponse> {
    return request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  },

  register(data: {
    name: string;
    email: string;
    password: string;
    role: "student" | "teacher";
    phone?: string;
    institution?: string;
  }): Promise<AuthResponse> {
    return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
  },

  changePassword(currentPassword: string, newPassword: string): Promise<{ changed: boolean }> {
    return request("/auth/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  requestPasswordReset(email: string): Promise<{ message: string }> {
    return request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
  },

  completePasswordReset(token: string, password: string): Promise<{ changed: boolean }> {
    return request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
  },

  getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    return request("/admin/password-reset-requests");
  },

  sendPasswordResetLink(id: string): Promise<{ sent: boolean; requestId: string }> {
    return request(`/admin/password-reset-requests/${encodeURIComponent(id)}/send`, { method: "POST" });
  },

  getMe(): Promise<User> {
    return request("/auth/me");
  },

  updateProfile(data: Partial<Pick<User, "name" | "phone" | "institution" | "department" | "bio">>): Promise<User> {
    return request("/auth/profile", { method: "PATCH", body: JSON.stringify(data) });
  },

  getUsers(): Promise<User[]> {
    return request("/users");
  },

  getTeacherDirectory(): Promise<User[]> {
    return request("/users/directory/teachers");
  },

  createUser(data: CreateUserInput): Promise<User> {
    return request("/users", { method: "POST", body: JSON.stringify(data) });
  },

  updateUser(id: string, data: UpdateUserInput): Promise<User> {
    return request(`/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
  },

  deleteUser(id: string): Promise<{ deleted: boolean }> {
    return request(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  // --------------------------------------------------------------------------
  // MODULE 2: SUBJECTS & TOPICS
  // --------------------------------------------------------------------------
  getSubjects(includeHidden = true): Promise<Subject[]> {
    return request(`/subjects?includeHidden=${includeHidden}`);
  },

  createSubject(data: {
    code: string;
    name: string;
    description?: string;
    iconName?: string;
    isHidden?: boolean;
  }): Promise<Subject> {
    return request("/subjects", {
      method: "POST",
      body: JSON.stringify({
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description?.trim() ?? "",
        iconName: data.iconName ?? "book",
        isHidden: !!data.isHidden,
      }),
    });
  },

  updateSubject(
    id: string,
    data: Partial<{ code: string; name: string; description: string; iconName: string; isHidden: boolean }>,
  ): Promise<Subject> {
    const payload: Record<string, unknown> = {};
    if (data.code !== undefined) payload.code = data.code.trim().toUpperCase();
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.iconName !== undefined) payload.iconName = data.iconName;
    if (data.isHidden !== undefined) payload.isHidden = !!data.isHidden;
    return request(`/subjects/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  toggleHideSubject(id: string): Promise<Subject> {
    return request(`/subjects/${encodeURIComponent(id)}/toggle-hide`, { method: "PATCH" });
  },

  deleteSubject(id: string): Promise<{ deleted: boolean }> {
    return request(`/subjects/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  getTopics(subjectId?: string, includeHidden = true): Promise<Topic[]> {
    const params = new URLSearchParams({ includeHidden: String(includeHidden) });
    if (subjectId) params.set("subjectId", subjectId);
    return request(`/topics?${params.toString()}`);
  },

  createTopic(data: {
    subjectId: string;
    name: string;
    description?: string;
    order?: number;
    isHidden?: boolean;
  }): Promise<Topic> {
    return request("/topics", {
      method: "POST",
      body: JSON.stringify({
        subjectId: data.subjectId,
        name: data.name.trim(),
        description: data.description?.trim() ?? "",
        order: Math.max(1, Number(data.order) || 1),
        isHidden: !!data.isHidden,
      }),
    });
  },

  updateTopic(
    id: string,
    data: Partial<{ subjectId: string; name: string; description: string; order: number; isHidden: boolean }>,
  ): Promise<Topic> {
    const payload: Record<string, unknown> = {};
    if (data.subjectId !== undefined) payload.subjectId = data.subjectId;
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.order !== undefined) payload.order = Math.max(1, Number(data.order) || 1);
    if (data.isHidden !== undefined) payload.isHidden = !!data.isHidden;
    return request(`/topics/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  toggleHideTopic(id: string): Promise<Topic> {
    return request(`/topics/${encodeURIComponent(id)}/toggle-hide`, { method: "PATCH" });
  },

  deleteTopic(id: string): Promise<{ deleted: boolean }> {
    return request(`/topics/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  // --------------------------------------------------------------------------
  // MODULE 3: COURSES
  // --------------------------------------------------------------------------
  getCourses(filters?: { subjectId?: string; status?: string }): Promise<Course[]> {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.set("subjectId", filters.subjectId);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return request(`/courses${qs ? `?${qs}` : ""}`);
  },

  getCourse(id: string): Promise<Course> {
    return request(`/courses/${encodeURIComponent(id)}`);
  },

  createCourse(data: {
    id?: string;
    title: string;
    subjectId?: string;
    subjectName?: string;
    teacherId?: string;
    teacherName?: string;
    description?: string;
    thumbnail?: string;
    level?: CourseLevel;
    status?: CourseStatus;
    tone?: Course["tone"];
    badgeMark?: string;
    durationHours?: number;
  }): Promise<Course> {
    return request("/courses", {
      method: "POST",
      body: JSON.stringify({
        id: data.id,
        title: data.title.trim(),
        subjectId: data.subjectId,
        subjectName: data.subjectName?.trim(),
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        description: data.description?.trim() ?? "",
        thumbnail: data.thumbnail ?? "/courses/default.png",
        level: data.level ?? "beginner",
        status: data.status ?? "draft",
        tone: data.tone ?? "lavender",
        badgeMark: data.badgeMark ?? "EDU",
        durationHours: Math.max(0, Number(data.durationHours) || 24),
      }),
    });
  },

  updateCourse(
    id: string,
    data: Partial<{
      title: string;
      subjectId: string;
      subjectName: string;
      description: string;
      thumbnail: string;
      level: CourseLevel;
      status: CourseStatus;
      tone: Course["tone"];
      badgeMark: string;
      durationHours: number;
    }>,
  ): Promise<Course> {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.subjectId !== undefined) payload.subjectId = data.subjectId;
    if (data.subjectName !== undefined) payload.subjectName = data.subjectName.trim();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.thumbnail !== undefined) payload.thumbnail = data.thumbnail;
    if (data.level !== undefined) payload.level = data.level;
    if (data.status !== undefined) payload.status = data.status;
    if (data.tone !== undefined) payload.tone = data.tone;
    if (data.badgeMark !== undefined) payload.badgeMark = data.badgeMark;
    if (data.durationHours !== undefined) payload.durationHours = Math.max(0, Number(data.durationHours) || 0);
    return request(`/courses/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteCourse(id: string): Promise<{ deleted: boolean }> {
    return request(`/courses/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  getCourseReports(courseId?: string): Promise<CourseReport[]> {
    const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
    return request(`/courses/reports/list${qs}`);
  },

  submitCourseReport(
    courseId: string,
    data: { reason: string; details?: string; description?: string },
  ): Promise<CourseReport> {
    return request(`/courses/${encodeURIComponent(courseId)}/report`, {
      method: "POST",
      body: JSON.stringify({
        reason: data.reason,
        details: data.details ?? data.description ?? "",
      }),
    });
  },

  moderateCourseReport(
    reportId: string,
    data: {
      action: "temporarily_locked" | "permanently_locked" | "unlock" | "dismissed";
      adminActionNote?: string;
    },
  ): Promise<{ report: CourseReport; courseStatus: CourseStatus }> {
    return request(`/courses/reports/${encodeURIComponent(reportId)}/moderate`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getTeacherReviews(
    teacherId?: string,
    courseId?: string,
  ): Promise<{ reviews: TeacherReview[]; summary: TeacherReviewSummary }> {
    const params = new URLSearchParams();
    if (teacherId) params.set("teacherId", teacherId);
    if (courseId) params.set("courseId", courseId);
    const qs = params.toString();
    return request(`/courses/reviews/list${qs ? `?${qs}` : ""}`);
  },

  submitTeacherReview(data: {
    courseId?: string;
    teacherId?: string;
    rating: number;
    comment: string;
  }): Promise<{ review: TeacherReview; summary: TeacherReviewSummary }> {
    return request("/courses/reviews/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  sendProgressReminderN8n(data: {
    studentId: string;
    courseId: string;
    customMessage?: string;
  }): Promise<{
    sent: boolean;
    n8nSent: boolean;
    teacherEmail: string;
    studentEmail: string;
    studentName: string;
    attendedLessons: number;
    totalLessons: number;
    percentCompleted: number;
  }> {
    return request("/progress/remind-n8n", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // --------------------------------------------------------------------------
  // MODULE 4: LESSONS & MATERIALS
  // --------------------------------------------------------------------------
  getLessons(courseId?: string): Promise<Lesson[]> {
    const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
    return request(`/lessons${qs}`);
  },

  createLesson(data: {
    id?: string;
    courseId: string;
    title: string;
    description?: string;
    order?: number;
    durationMinutes?: number;
    videoUrl?: string;
    contentMarkdown?: string;
    isPublished?: boolean;
    status?: LessonStatus;
  }): Promise<Lesson> {
    const resolvedStatus = data.status ?? (data.isPublished === false ? "draft" : "published");
    return request("/lessons", {
      method: "POST",
      body: JSON.stringify({
        id: data.id,
        courseId: data.courseId,
        title: data.title.trim(),
        description: data.description?.trim() ?? "",
        order: data.order ? Math.max(1, Number(data.order)) : undefined,
        durationMinutes: Math.max(1, Number(data.durationMinutes) || 30),
        videoUrl: data.videoUrl || undefined,
        contentMarkdown: data.contentMarkdown ?? "",
        status: resolvedStatus,
        isPublished: resolvedStatus === "published",
      }),
    });
  },

  updateLesson(
    id: string,
    data: Partial<{
      courseId: string;
      title: string;
      description: string;
      order: number;
      durationMinutes: number;
      videoUrl: string;
      contentMarkdown: string;
      isPublished: boolean;
      status: LessonStatus;
    }>,
  ): Promise<Lesson> {
    const payload: Record<string, unknown> = {};
    if (data.courseId !== undefined) payload.courseId = data.courseId;
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.order !== undefined) payload.order = Math.max(1, Number(data.order));
    if (data.durationMinutes !== undefined) payload.durationMinutes = Math.max(1, Number(data.durationMinutes) || 30);
    if (data.videoUrl !== undefined) payload.videoUrl = data.videoUrl;
    if (data.contentMarkdown !== undefined) payload.contentMarkdown = data.contentMarkdown;
    if (data.status !== undefined) {
      payload.status = data.status;
      payload.isPublished = data.status === "published";
    } else if (data.isPublished !== undefined) {
      payload.isPublished = data.isPublished;
      payload.status = data.isPublished ? "published" : "draft";
    }
    return request(`/lessons/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  reorderLesson(courseId: string, lessonId: string, direction: "up" | "down"): Promise<Lesson[]> {
    return request(`/lessons/courses/${encodeURIComponent(courseId)}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ lessonId, direction }),
    });
  },

  deleteLesson(id: string): Promise<{ deleted: boolean }> {
    return request(`/lessons/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  getMaterials(courseId?: string, lessonId?: string): Promise<Material[]> {
    const params = new URLSearchParams();
    if (courseId) params.set("courseId", courseId);
    if (lessonId) params.set("lessonId", lessonId);
    const qs = params.toString();
    return request(`/materials${qs ? `?${qs}` : ""}`);
  },

  uploadMaterialFile(materialId: string, courseId: string, lessonId: string, file: File): Promise<{ fileUrl: string }> {
    const formData = new FormData();
    formData.append("courseId", courseId);
    formData.append("lessonId", lessonId);
    formData.append("file", file);
    return request(`/materials/upload/${encodeURIComponent(materialId)}`, {
      method: "POST",
      body: formData,
    });
  },

  createMaterialPlaybackUrl(materialId: string): Promise<{ streamUrl: string; expiresAt: string }> {
    return request(`/materials/${encodeURIComponent(materialId)}/playback-url`, { method: "POST" });
  },

  async hasMaterialFile(materialId: string): Promise<boolean> {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/materials/${encodeURIComponent(materialId)}/file`, {
        method: "HEAD",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      throw new Error("Không kết nối được backend để kiểm tra tệp.");
    }
    if (response.status === 404) return false;
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.message || "Không kiểm tra được tệp khóa học.");
    }
    return true;
  },

  async getMaterialFile(materialId: string): Promise<{ blob: Blob; fileName: string }> {
    const token = typeof window !== "undefined" ? window.localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/materials/${encodeURIComponent(materialId)}/file`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch {
      throw new Error("Không kết nối được backend để mở tệp.");
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = Array.isArray(payload?.message)
        ? payload.message.join(" ")
        : payload?.message || "Không mở được tệp khóa học.";
      throw new Error(message);
    }

    const disposition = response.headers.get("Content-Disposition") || "";
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    let fileName = `tai-lieu-${materialId}`;
    if (encodedName) {
      try { fileName = decodeURIComponent(encodedName); } catch { fileName = encodedName; }
    }
    return { blob: await response.blob(), fileName };
  },

  createMaterial(data: {
    id?: string;
    courseId: string;
    lessonId: string;
    title: string;
    description?: string;
    fileType?: Material["fileType"];
    fileUrl: string;
    fileSize?: string;
  }): Promise<Material> {
    return request("/materials", {
      method: "POST",
      body: JSON.stringify({
        id: data.id,
        courseId: data.courseId,
        lessonId: data.lessonId,
        title: data.title.trim(),
        description: data.description?.trim() ?? "",
        fileType: data.fileType ?? "pdf",
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ?? "1.5 MB",
      }),
    });
  },

  updateMaterial(
    id: string,
    data: Partial<{
      courseId: string;
      lessonId: string;
      title: string;
      description: string;
      fileType: Material["fileType"];
      fileUrl: string;
      fileSize: string;
    }>,
  ): Promise<Material> {
    const payload: Record<string, unknown> = {};
    if (data.courseId !== undefined) payload.courseId = data.courseId;
    if (data.lessonId !== undefined) payload.lessonId = data.lessonId;
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.fileType !== undefined) payload.fileType = data.fileType;
    if (data.fileUrl !== undefined) payload.fileUrl = data.fileUrl;
    if (data.fileSize !== undefined) payload.fileSize = data.fileSize;
    return request(`/materials/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  deleteMaterial(id: string): Promise<{ deleted: boolean }> {
    return request(`/materials/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  // --------------------------------------------------------------------------
  // MODULE 5: ENROLLMENTS
  // --------------------------------------------------------------------------
  getEnrollments(studentId?: string, courseId?: string): Promise<Enrollment[]> {
    const params = new URLSearchParams();
    if (studentId) params.set("studentId", studentId);
    if (courseId) params.set("courseId", courseId);
    const qs = params.toString();
    return request(`/enrollments${qs ? `?${qs}` : ""}`);
  },

  enrollCourse(courseId: string): Promise<Enrollment> {
    return request("/enrollments", {
      method: "POST",
      body: JSON.stringify({ courseId }),
    });
  },

  dropCourse(courseId: string): Promise<Enrollment> {
    return request(`/enrollments/courses/${encodeURIComponent(courseId)}/drop`, {
      method: "POST",
    });
  },

  // --------------------------------------------------------------------------
  // MODULE 6: QUIZZES & QUESTIONS
  // --------------------------------------------------------------------------
  async getQuizzes(courseId?: string): Promise<Quiz[]> {
    const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
    const list = await request<Quiz[]>(`/quizzes${qs}`);
    return list.map(normalizeQuiz);
  },

  async createQuiz(data: {
    title: string;
    courseId?: string | null;
    courseTitle?: string;
    lessonId?: string;
    description?: string;
    timeLimitMinutes?: number;
    passingScore?: number;
    maxScore?: number;
    isPublished?: boolean;
  }): Promise<Quiz> {
    const res = await request<Quiz>("/quizzes", {
      method: "POST",
      body: JSON.stringify({
        title: data.title.trim(),
        courseId: data.courseId || undefined,
        courseTitle: data.courseTitle,
        lessonId: data.lessonId || undefined,
        description: data.description?.trim() ?? "",
        timeLimitMinutes: Math.max(0, Number(data.timeLimitMinutes) || 15),
        passingScore: Math.max(0, Number(data.passingScore) || 5),
        maxScore: Math.max(0, Number(data.maxScore) || 10),
        isPublished: !!data.isPublished,
      }),
    });
    return normalizeQuiz(res);
  },

  async updateQuiz(
    id: string,
    data: Partial<{
      title: string;
      courseId: string | null;
      courseTitle: string;
      lessonId: string;
      description: string;
      timeLimitMinutes: number;
      passingScore: number;
      maxScore: number;
      isPublished: boolean;
    }>,
  ): Promise<Quiz> {
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.courseId !== undefined) payload.courseId = data.courseId;
    if (data.courseTitle !== undefined) payload.courseTitle = data.courseTitle;
    if (data.lessonId !== undefined) payload.lessonId = data.lessonId;
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.timeLimitMinutes !== undefined) payload.timeLimitMinutes = Math.max(0, Number(data.timeLimitMinutes) || 0);
    if (data.passingScore !== undefined) payload.passingScore = Math.max(0, Number(data.passingScore) || 0);
    if (data.maxScore !== undefined) payload.maxScore = Math.max(0, Number(data.maxScore) || 0);
    if (data.isPublished !== undefined) payload.isPublished = !!data.isPublished;
    const res = await request<Quiz>(`/quizzes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return normalizeQuiz(res);
  },

  deleteQuiz(id: string): Promise<{ deleted: boolean }> {
    return request(`/quizzes/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async getQuestions(quizId: string, viewAsStudent = false): Promise<Question[]> {
    const qs = viewAsStudent ? "?viewAs=student" : "";
    const list = await request<Question[]>(`/quizzes/${encodeURIComponent(quizId)}/questions${qs}`);
    return list.map(normalizeQuestion);
  },

  async createQuestion(data: {
    quizId: string;
    content: string;
    type: Question["type"];
    points: number;
    options?: Question["options"];
    explanation?: string;
    order?: number;
  }): Promise<Question> {
    const res = await request<Question>("/questions", {
      method: "POST",
      body: JSON.stringify({
        quizId: data.quizId,
        content: data.content.trim(),
        type: data.type,
        points: Math.max(0, Number(data.points) || 1),
        options: (data.options ?? []).map((opt) => ({
          id: opt.id,
          text: opt.text.trim() || opt.attachmentName || "Tệp đính kèm",
          isCorrect: !!opt.isCorrect,
          ...(opt.attachmentName
            ? {
                attachmentName: opt.attachmentName,
                attachmentType: opt.attachmentType,
                attachmentSize: opt.attachmentSize,
                attachmentDataUrl: opt.attachmentDataUrl,
                attachmentExtractedText: opt.attachmentExtractedText,
              }
            : {}),
        })),
        explanation: data.explanation?.trim() ?? "",
        order: data.order ? Math.max(1, Number(data.order)) : undefined,
      }),
    });
    return normalizeQuestion(res);
  },

  async updateQuestion(
    id: string,
    data: Partial<{
      quizId: string;
      content: string;
      type: Question["type"];
      points: number;
      options: Question["options"];
      explanation: string;
      order: number;
    }>,
  ): Promise<Question> {
    const payload: Record<string, unknown> = {};
    if (data.quizId !== undefined) payload.quizId = data.quizId;
    if (data.content !== undefined) payload.content = data.content.trim();
    if (data.type !== undefined) payload.type = data.type;
    if (data.points !== undefined) payload.points = Math.max(0, Number(data.points) || 1);
    if (data.explanation !== undefined) payload.explanation = data.explanation.trim();
    if (data.order !== undefined) payload.order = Math.max(1, Number(data.order));
    if (data.options !== undefined) {
      payload.options = data.options.map((opt) => ({
        id: opt.id,
        text: opt.text.trim() || opt.attachmentName || "Tệp đính kèm",
        isCorrect: !!opt.isCorrect,
        ...(opt.attachmentName
          ? {
              attachmentName: opt.attachmentName,
              attachmentType: opt.attachmentType,
              attachmentSize: opt.attachmentSize,
              attachmentDataUrl: opt.attachmentDataUrl,
              attachmentExtractedText: opt.attachmentExtractedText,
            }
          : {}),
      }));
    }
    const res = await request<Question>(`/questions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return normalizeQuestion(res);
  },

  deleteQuestion(id: string): Promise<{ deleted: boolean }> {
    return request(`/questions/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  generateQuizQuestionsWithAi(data: {
    topic: string;
    sourceText?: string;
    questionCount?: number;
    difficulty?: "beginner" | "intermediate" | "advanced" | "mixed";
    questionType?: "multiple_choice" | "essay" | "mixed";
    courseId?: string;
  }): Promise<{ questions: ImportedQuestionDraft[]; modelUsed: string }> {
    return request("/quizzes/ai-generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  rewriteQuizQuestionsWithAi(data: {
    questions?: ImportedQuestionDraft[];
    rawText?: string;
    mode?: "improve" | "add_explanation" | "harder" | "unstructured_to_quiz";
    instruction?: string;
  }): Promise<{ questions: ImportedQuestionDraft[]; modelUsed: string }> {
    return request("/questions/ai-rewrite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // --------------------------------------------------------------------------
  // MODULE 7: SUBMISSIONS / QUIZ ATTEMPTS & GRADING
  // --------------------------------------------------------------------------
  async getAttempts(quizId?: string, studentId?: string): Promise<QuizAttempt[]> {
    const params = new URLSearchParams();
    if (quizId) params.set("quizId", quizId);
    if (studentId) params.set("studentId", studentId);
    const qs = params.toString();
    const list = await request<QuizAttempt[]>(`/attempts${qs ? `?${qs}` : ""}`);
    return list.map(normalizeAttempt);
  },

  async startQuizAttempt(quizId: string): Promise<QuizAttempt> {
    const res = await request<QuizAttempt>(`/quizzes/${encodeURIComponent(quizId)}/start`, {
      method: "POST",
    });
    return normalizeAttempt(res);
  },

  async saveAttemptDraft(attemptId: string, answers: StudentAnswer[]): Promise<QuizAttempt> {
    const res = await request<QuizAttempt>(`/attempts/${encodeURIComponent(attemptId)}/draft`, {
      method: "PATCH",
      body: JSON.stringify({
        answers: answers.map((a) => ({
          questionId: a.questionId,
          ...(a.selectedOptionId ? { selectedOptionId: a.selectedOptionId } : {}),
          ...(a.essayAnswer !== undefined ? { essayAnswer: a.essayAnswer } : {}),
          ...(a.attachmentName
            ? {
                attachmentName: a.attachmentName,
                attachmentType: a.attachmentType,
                attachmentSize: a.attachmentSize,
                attachmentDataUrl: a.attachmentDataUrl,
                attachmentExtractedText: a.attachmentExtractedText,
              }
            : {}),
        })),
      }),
    });
    return normalizeAttempt(res);
  },

  async submitAttempt(attemptId: string, answers: StudentAnswer[]): Promise<QuizAttempt> {
    const res = await request<QuizAttempt>(`/attempts/${encodeURIComponent(attemptId)}/submit`, {
      method: "POST",
      body: JSON.stringify({
        answers: answers.map((a) => ({
          questionId: a.questionId,
          ...(a.selectedOptionId ? { selectedOptionId: a.selectedOptionId } : {}),
          ...(a.essayAnswer !== undefined ? { essayAnswer: a.essayAnswer } : {}),
          ...(a.attachmentName
            ? {
                attachmentName: a.attachmentName,
                attachmentType: a.attachmentType,
                attachmentSize: a.attachmentSize,
                attachmentDataUrl: a.attachmentDataUrl,
                attachmentExtractedText: a.attachmentExtractedText,
              }
            : {}),
        })),
      }),
    });
    return normalizeAttempt(res);
  },

  async gradeAttempt(
    attemptId: string,
    grades: Array<{ questionId: string; scoreAwarded: number; teacherFeedback?: string }>,
    teacherNotes?: string,
  ): Promise<QuizAttempt> {
    const res = await request<QuizAttempt>(`/attempts/${encodeURIComponent(attemptId)}/grade`, {
      method: "POST",
      body: JSON.stringify({
        grades: grades.map((g) => ({
          questionId: g.questionId,
          scoreAwarded: Math.max(0, Number(g.scoreAwarded) || 0),
          teacherFeedback: g.teacherFeedback ?? "",
        })),
        teacherNotes: teacherNotes ?? "",
      }),
    });
    return normalizeAttempt(res);
  },

  // --------------------------------------------------------------------------
  // MODULE 8: STUDENT PROGRESS
  // --------------------------------------------------------------------------
  getAllProgress(studentId?: string): Promise<StudentProgress[]> {
    const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return request(`/progress${qs}`);
  },

  getProgress(courseId: string, studentId?: string): Promise<StudentProgress> {
    const params = new URLSearchParams({ courseId });
    if (studentId) params.set("studentId", studentId);
    return request(`/progress?${params.toString()}`);
  },

  accessLesson(courseId: string, lessonId: string): Promise<StudentProgress> {
    return request("/progress/access-lesson", {
      method: "POST",
      body: JSON.stringify({ courseId, lessonId }),
    });
  },

  completeLesson(courseId: string, lessonId: string): Promise<StudentProgress> {
    return request("/progress/complete-lesson", {
      method: "POST",
      body: JSON.stringify({ courseId, lessonId }),
    });
  },

  // --------------------------------------------------------------------------
  // MODULE 9: AI TUTOR & RUNTIME STATUS
  // --------------------------------------------------------------------------
  getAiRuntimeStatus(): Promise<{
    provider: string;
    modelName: string;
    ocrEngine: string;
    serviceStatus: string;
    dailyUsageCount: number;
    dailyUsageLimit: number;
    updatedAt: string;
  }> {
    return request("/ai/conversations/runtime-status");
  },

  getConversations(studentId: string, archived = false): Promise<Conversation[]> {
    const query = new URLSearchParams({ studentId, archived: String(archived) });
    return request(`/ai/conversations?${query.toString()}`);
  },

  createConversation(studentId: string, title?: string, courseId?: string): Promise<Conversation> {
    return request("/ai/conversations", {
      method: "POST",
      body: JSON.stringify({ studentId, title, courseId }),
    });
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const messages = await request<ApiChatMessage[]>(
      `/ai/conversations/${encodeURIComponent(conversationId)}/messages`,
    );
    return messages.map(normalizeMessage);
  },

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<{ userMsg: ChatMessage; assistantMsg: ChatMessage; modelUsed?: string; providerUsed?: string }> {
    const result = await request<{
      userMsg: ApiChatMessage;
      assistantMsg: ApiChatMessage;
      modelUsed?: string;
      providerUsed?: string;
    }>(`/ai/conversations/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    return {
      userMsg: normalizeMessage(result.userMsg),
      assistantMsg: normalizeMessage(result.assistantMsg),
      modelUsed: result.modelUsed,
      providerUsed: result.providerUsed,
    };
  },

  renameConversation(conversationId: string, title: string): Promise<Conversation> {
    return request(`/ai/conversations/${encodeURIComponent(conversationId)}/rename`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
  },

  toggleArchiveConversation(conversationId: string): Promise<Conversation> {
    return request(`/ai/conversations/${encodeURIComponent(conversationId)}/toggle-archive`, {
      method: "PATCH",
    });
  },

  deleteConversation(conversationId: string): Promise<{ deleted: boolean }> {
    return request(`/ai/conversations/${encodeURIComponent(conversationId)}`, {
      method: "DELETE",
    });
  },

  // --------------------------------------------------------------------------
  // MODULE 10: OCR DOCUMENT SCANNER
  // --------------------------------------------------------------------------
  getOcrScans(): Promise<OCRScan[]> {
    return request("/ocr/scans");
  },

  uploadOcrScan(data: {
    fileName: string;
    imageUrl: string;
    recognizedText?: string;
    notes?: string;
  }): Promise<OCRScan> {
    return request("/ocr/upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  reprocessOcrScan(scanId: string): Promise<OCRScan> {
    return request(`/ocr/scans/${encodeURIComponent(scanId)}/reprocess`, {
      method: "POST",
    });
  },

  updateOcrScanText(scanId: string, correctedText: string): Promise<OCRScan> {
    return request(`/ocr/scans/${encodeURIComponent(scanId)}/text`, {
      method: "PATCH",
      body: JSON.stringify({ correctedText }),
    });
  },

  sendOcrScanToAi(scanId: string): Promise<{ conversation: Conversation; scan: OCRScan }> {
    return request(`/ocr/scans/${encodeURIComponent(scanId)}/send-to-ai`, {
      method: "POST",
    });
  },

  deleteOcrScan(scanId: string): Promise<{ deleted: boolean }> {
    return request(`/ocr/scans/${encodeURIComponent(scanId)}`, {
      method: "DELETE",
    });
  },

  // --------------------------------------------------------------------------
  // MODULE 11: PERSONALIZED LEARNING RECOMMENDATIONS
  // --------------------------------------------------------------------------
  getRecommendations(includeDismissed = false): Promise<Recommendation[]> {
    return request(`/recommendations?includeDismissed=${includeDismissed}`);
  },

  generateRecommendations(): Promise<Recommendation[]> {
    return request("/recommendations/generate", {
      method: "POST",
    });
  },

  markRecommendationRead(id: string): Promise<Recommendation> {
    return request(`/recommendations/${encodeURIComponent(id)}/read`, {
      method: "PATCH",
    });
  },

  dismissRecommendation(id: string): Promise<Recommendation> {
    return request(`/recommendations/${encodeURIComponent(id)}/dismiss`, {
      method: "PATCH",
    });
  },

  // --------------------------------------------------------------------------
  // MODULE 12: NOTIFICATIONS
  // --------------------------------------------------------------------------
  getNotifications(): Promise<Notification[]> {
    return request("/notifications");
  },

  markNotificationRead(id: string): Promise<Notification> {
    return request(`/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
  },

  markAllNotificationsRead(): Promise<{ updated: boolean }> {
    return request("/notifications/mark-all-read", { method: "POST" });
  },

  deleteNotification(id: string): Promise<{ deleted: boolean }> {
    return request(`/notifications/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  // --------------------------------------------------------------------------
  // MODULE 13: ADMIN DASHBOARD SUMMARY, AI CONFIG & AUDIT LOGS
  // --------------------------------------------------------------------------
  getAdminReportSummary(): Promise<AdminReportSummary> {
    return request("/admin/reports/summary");
  },

  getAiConfig(): Promise<AIConfig> {
    return request("/admin/ai-config");
  },

  updateAiConfig(data: Partial<AIConfig>): Promise<AIConfig> {
    return request("/admin/ai-config", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  testAiConnection(prompt?: string): Promise<AIConputTestResult> {
    return request("/admin/ai-config/test", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    });
  },

  getSystemLogs(limit = 100): Promise<SystemLog[]> {
    return request(`/admin/logs?limit=${limit}`);
  },

  // --------------------------------------------------------------------------
  // MODULE 14: AI TRAINING, FINE-TUNING & KNOWLEDGE CORPUS PIPELINE
  // --------------------------------------------------------------------------
  getCorpusDocuments(status = "all"): Promise<AiCorpusDocument[]> {
    return request(`/ai-training/corpus?status=${encodeURIComponent(status)}`);
  },

  uploadCorpusDocument(data: {
    id?: string;
    title: string;
    description?: string;
    subject: string;
    category?: string;
    fileName: string;
    mimeType?: string;
    fileSize?: number;
    extractedText?: string;
  }): Promise<AiCorpusDocument> {
    return request("/ai-training/corpus", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  reviewCorpusDocument(
    id: string,
    data: {
      status: "approved" | "indexed" | "rejected";
      reviewNotes?: string;
      includedInTraining?: boolean;
      autoGenerateDataset?: boolean;
    },
  ): Promise<{ document: AiCorpusDocument; generatedPairs: number }> {
    return request(`/ai-training/corpus/${encodeURIComponent(id)}/review`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteCorpusDocument(id: string): Promise<{ deleted: boolean }> {
    return request(`/ai-training/corpus/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  getTrainingDatasets(status = "all", subject = "all"): Promise<AiDatasetEntry[]> {
    const query = new URLSearchParams({ status, subject });
    return request(`/ai-training/datasets?${query.toString()}`);
  },

  createTrainingDataset(data: {
    subject: string;
    prompt: string;
    expectedResponse: string;
    systemPrompt?: string;
    tags?: string[];
    qualityScore?: number;
    status?: "draft" | "labeled" | "validated";
    sourceType?: string;
  }): Promise<AiDatasetEntry> {
    return request("/ai-training/datasets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTrainingDataset(
    id: string,
    data: Partial<Pick<AiDatasetEntry, "subject" | "prompt" | "expectedResponse" | "systemPrompt" | "tags" | "qualityScore" | "status">>,
  ): Promise<AiDatasetEntry> {
    return request(`/ai-training/datasets/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteTrainingDataset(id: string): Promise<{ deleted: boolean }> {
    return request(`/ai-training/datasets/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },

  harvestTrainingDatasets(): Promise<{ addedCount: number; totalCount: number }> {
    return request("/ai-training/datasets/harvest", {
      method: "POST",
    });
  },

  exportTrainingDatasetsJsonl(): Promise<{ count: number; format: string; content: string }> {
    return request("/ai-training/datasets/export-jsonl");
  },

  getTrainingJobs(): Promise<AiTrainingJob[]> {
    return request("/ai-training/jobs");
  },

  startTrainingJob(data: {
    name: string;
    baseModel?: string;
    targetModelName?: string;
    hyperparameters?: {
      epochs?: number;
      learningRate?: number;
      batchSize?: number;
      loraRank?: number;
    };
  }): Promise<AiTrainingJob> {
    return request("/ai-training/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  cancelTrainingJob(id: string): Promise<AiTrainingJob> {
    return request(`/ai-training/jobs/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
    });
  },

  getModelVersions(): Promise<AiModelVersion[]> {
    return request("/ai-training/models");
  },

  deployModelVersion(id: string): Promise<AiModelVersion> {
    return request(`/ai-training/models/${encodeURIComponent(id)}/deploy`, {
      method: "POST",
    });
  },

  evaluateModelVersion(
    id: string,
    testPrompt?: string,
  ): Promise<{
    modelVersion: AiModelVersion;
    testPrompt: string;
    response: string;
    measuredLatencyMs: number;
    passedThreshold: boolean;
  }> {
    return request(`/ai-training/models/${encodeURIComponent(id)}/evaluate`, {
      method: "POST",
      body: JSON.stringify({ testPrompt }),
    });
  },
};
