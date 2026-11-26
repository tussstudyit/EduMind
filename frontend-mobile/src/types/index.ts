// ============================================================================
// EDUMIND AI - TYPE DEFINITIONS & DATA MODELS (13 MODULES)
// Chuẩn hóa TypeScript Interfaces phục vụ Frontend Mock và bàn giao Backend
// ============================================================================

// ----------------------------------------------------------------------------
// MODULE 1: TÀI KHOẢN VÀ PHÂN QUYỀN (Account & RBAC)
// ----------------------------------------------------------------------------
export type UserRole = "admin" | "teacher" | "student";
export type UserStatus = "active" | "locked";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  institution?: string;
  bio?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------------------
// MODULE 2: MÔN HỌC VÀ CHỦ ĐỀ (Subjects & Topics)
// ----------------------------------------------------------------------------
export interface Subject {
  id: string;
  code: string; // Vd: "CS101", "MATH201"
  name: string;
  description: string;
  iconName: string;
  isHidden: boolean;
  topicCount: number;
  courseCount: number;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  order: number;
  isHidden: boolean;
}

// ----------------------------------------------------------------------------
// MODULE 3: KHÓA HỌC (Courses)
// ----------------------------------------------------------------------------
export type CourseStatus = "draft" | "published" | "archived" | "hidden";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  thumbnail: string;
  level: CourseLevel;
  status: CourseStatus;
  tone: "lavender" | "mint" | "sky" | "amber";
  badgeMark: string; // Vd: "Py", "∑", "AI"
  durationHours: number;
  lessonCount: number;
  enrolledCount: number;
  averageRating?: number;
  reviewCount?: number;
  pendingReportCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseReport {
  id: string;
  courseId: string;
  courseTitle: string;
  teacherId: string;
  teacherName: string;
  reporterId: string;
  reporterName: string;
  reporterEmail: string;
  reason: string;
  details: string;
  status: "pending" | "temporarily_locked" | "permanently_locked" | "dismissed";
  adminActionNote: string;
  n8nSynced: boolean;
  createdAt: string;
  resolvedAt?: string | null;
}

// ----------------------------------------------------------------------------
// MODULE 4: BÀI HỌC VÀ TÀI LIỆU (Lessons & Materials)
// ----------------------------------------------------------------------------
export type LessonStatus = "published" | "draft" | "hidden";

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  durationMinutes: number;
  videoUrl?: string;
  contentMarkdown: string;
  isPublished: boolean;
  status?: LessonStatus;
}

export type MaterialType = "pdf" | "docx" | "slide" | "code" | "zip" | "video";

export interface Material {
  id: string;
  lessonId: string;
  courseId: string;
  title: string;
  description?: string;
  fileType: MaterialType;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
}

export interface TeacherReview {
  id: string;
  teacherId: string;
  teacherName?: string;
  courseId: string;
  courseTitle?: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherReviewSummary {
  averageRating: number;
  totalReviews: number;
  starCounts: Record<number, number>;
  badge: string;
  n8nAggregated?: boolean;
}

// ----------------------------------------------------------------------------
// MODULE 5: GHI DANH KHÓA HỌC (Course Enrollment)
// ----------------------------------------------------------------------------
export type EnrollmentStatus = "active" | "dropped" | "completed";

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  studentEmail: string;
  enrolledAt: string;
  status: EnrollmentStatus;
  progressPercent: number;
  completedLessonIds?: string[];
  lastAccessedAt: string;
}

// ----------------------------------------------------------------------------
// MODULE 6: BÀI TẬP, BÀI KIỂM TRA VÀ CÂU HỎI (Assessments & Questions)
// ----------------------------------------------------------------------------
export type QuestionType = "multiple_choice" | "essay";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean; // LƯU Ý: Chỉ hiển thị cho Teacher & Admin, bị ẩn ở phía Student
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: string;
  attachmentDataUrl?: string;
  attachmentExtractedText?: string;
}

export interface Question {
  id: string;
  quizId: string;
  content: string;
  type: QuestionType;
  points: number;
  options: QuestionOption[];
  explanation?: string;
}

export interface Quiz {
  id: string;
  courseId: string | null;
  courseTitle: string;
  lessonId?: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScore: number;
  maxScore: number;
  isPublished: boolean;
  questionCount: number;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// MODULE 7: BÀI LÀM VÀ CHẤM ĐIỂM (Submissions & Grading)
// ----------------------------------------------------------------------------
export type AttemptStatus = "in_progress" | "submitted" | "graded";

export interface StudentAnswer {
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
  scoreAwarded?: number;
  teacherFeedback?: string;
  isCorrect?: boolean;
  correctOptionId?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: string;
  attachmentDataUrl?: string;
  attachmentExtractedText?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  courseId: string | null;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  status: AttemptStatus;
  answers: StudentAnswer[];
  totalScore: number;
  maxScore: number;
  startedAt: string;
  submittedAt?: string;
  gradedAt?: string;
  gradedBy?: string; // Teacher Name
  teacherNotes?: string;
}

// ----------------------------------------------------------------------------
// MODULE 8: TIẾN ĐỘ HỌC TẬP (Learning Progress)
// ----------------------------------------------------------------------------
export interface StudentProgress {
  id: string;
  studentId: string;
  courseId: string;
  completedLessonIds: string[];
  lastLessonId: string;
  lastStudiedAt: string;
  percentCompleted: number;
  totalMinutesStudied: number;
}

export interface WeeklyActivityLog {
  day: string; // Vd: "T2", "T3"
  date: string;
  minutes: number;
}

// ----------------------------------------------------------------------------
// MODULE 9: TRỢ LÝ HỌC TẬP AI (AI Tutor)
// ----------------------------------------------------------------------------
export interface Conversation {
  id: string;
  studentId: string;
  courseId?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: string[];
}

// ----------------------------------------------------------------------------
// MODULE 10: QUÉT TÀI LIỆU OCR (OCR Document Scanner)
// ----------------------------------------------------------------------------
export type OCRScanStatus = "processing" | "completed" | "failed";

export interface OCRScan {
  id: string;
  studentId: string;
  fileName: string;
  imageUrl: string;
  recognizedText: string;
  correctedText: string;
  status: OCRScanStatus;
  createdAt: string;
  sentToAI: boolean;
  notes?: string;
}

// ----------------------------------------------------------------------------
// MODULE 11: ĐỀ XUẤT HỌC TẬP (Recommendations)
// ----------------------------------------------------------------------------
export type RecommendationType = "course" | "review" | "exercise" | "tip";

export interface Recommendation {
  id: string;
  studentId: string;
  title: string;
  description: string;
  reason?: string;
  type: RecommendationType;
  courseId?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

// ----------------------------------------------------------------------------
// MODULE 12: THÔNG BÁO (Notifications)
// ----------------------------------------------------------------------------
export type NotificationType = "info" | "success" | "warning" | "alert";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  link?: string | null;
}

// ----------------------------------------------------------------------------
// MODULE 13: BÁO CÁO, NHẬT KÝ VÀ CẤU HÌNH AI (Reports, Logs & AI Config)
// ----------------------------------------------------------------------------
export type LogLevel = "info" | "warn" | "error";

export interface SystemLog {
  id: string;
  level: LogLevel;
  action: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
  details: string;
}

export type AIProviderType = "gemini" | "openai" | "anthropic" | "ollama" | "edumind-tuned";

export interface AIConfig {
  id?: string;
  provider: AIProviderType;
  modelName: string;
  apiKey?: string;
  apiKeyMasked: string;
  customEndpoint?: string;
  systemPrompt?: string;
  activeModelVersionId?: string | null;
  maxTokens: number;
  temperature: number;
  ocrEngine: "gemini-multimodal" | "google-vision" | "tesseract";
  ocrConfidenceThreshold?: number;
  maxUploadSizeMB?: number;
  serviceStatus: "healthy" | "degraded" | "offline";
  dailyUsageCount: number;
  dailyUsageLimit: number;
  updatedAt: string;
}

export interface AIConputTestResult {
  ok: boolean;
  provider: string;
  modelName: string;
  latencyMs: number;
  sampleReply: string;
}

export interface AiCorpusDocument {
  id: string;
  uploaderId: string;
  uploaderName: string;
  uploaderRole: UserRole;
  title: string;
  description: string;
  subject: string;
  category: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  extractedText: string;
  chunkCount: number;
  status: "pending_review" | "approved" | "rejected" | "indexed";
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  includedInTraining: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiDatasetEntry {
  id: string;
  sourceType: "document" | "tutor_chat" | "ocr_scan" | "quiz" | "manual";
  sourceId?: string | null;
  subject: string;
  prompt: string;
  expectedResponse: string;
  systemPrompt?: string;
  tags: string[];
  qualityScore: number;
  status: "draft" | "labeled" | "validated" | "archived";
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiTrainingJob {
  id: string;
  name: string;
  baseModel: string;
  targetModelName: string;
  datasetCount: number;
  hyperparameters: {
    epochs: number;
    learningRate: number;
    batchSize: number;
    loraRank: number;
  };
  status: "queued" | "preparing_data" | "training" | "evaluating" | "completed" | "failed" | "cancelled";
  progressPercent: number;
  currentEpoch: number;
  totalEpochs: number;
  trainingLoss?: number | null;
  validationLoss?: number | null;
  logs: {
    timestamp: string;
    step: string;
    message: string;
    loss?: number;
    valLoss?: number;
  }[];
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiModelVersion {
  id: string;
  jobId?: string | null;
  versionTag: string;
  modelIdentifier: string;
  baseModel: string;
  datasetSize: number;
  metrics: {
    accuracy: number;
    f1Score: number;
    bleuScore: number;
    perplexity: number;
    avgLatencyMs: number;
    hallucinationRate: number;
  };
  evaluationSummary: string;
  status: "candidate" | "active" | "archived" | "rollback";
  isDeployed: boolean;
  deployedAt?: string | null;
  deployedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
