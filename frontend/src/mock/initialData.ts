// ============================================================================
// EDUMIND AI - INITIAL STATE (NO MOCK DATA)
// Toàn bộ dữ liệu được đồng bộ trực tiếp từ PostgreSQL Backend qua apiClient.
// Các mảng khởi tạo mặc định đều rỗng để không hiển thị dữ liệu mẫu giả lập.
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

export const initialUsers: User[] = [];
export const initialSubjects: Subject[] = [];
export const initialTopics: Topic[] = [];
export const initialCourses: Course[] = [];
export const initialLessons: Lesson[] = [];
export const initialMaterials: Material[] = [];
export const initialEnrollments: Enrollment[] = [];
export const initialQuizzes: Quiz[] = [];
export const initialQuestions: Question[] = [];
export const initialAttempts: QuizAttempt[] = [];
export const initialProgress: StudentProgress[] = [];
export const initialConversations: Conversation[] = [];
export const initialMessages: ChatMessage[] = [];
export const initialOCRScans: OCRScan[] = [];
export const initialRecommendations: Recommendation[] = [];
export const initialNotifications: Notification[] = [];
export const initialSystemLogs: SystemLog[] = [];

export const initialAIConfig: AIConfig = {
  provider: "gemini",
  modelName: "gemini-3.8-flash",
  apiKeyMasked: "",
  customEndpoint: "",
  systemPrompt:
    "Bạn là EduMind AI Tutor — trợ lý học tập đại học thông minh, giải thích rõ ràng bằng tiếng Việt.",
  activeModelVersionId: null,
  maxTokens: 2048,
  temperature: 0.7,
  ocrEngine: "gemini-multimodal",
  ocrConfidenceThreshold: 0.85,
  maxUploadSizeMB: 10,
  serviceStatus: "healthy",
  dailyUsageCount: 0,
  dailyUsageLimit: 15000,
  updatedAt: new Date().toISOString(),
};
