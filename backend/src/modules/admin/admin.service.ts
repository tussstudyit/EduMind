import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConfigEntity } from './ai-config.entity';
import { AuditService } from './audit.service';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';
import { SystemLogEntity } from './system-log.entity';
import { UserEntity } from '../users/user.entity';
import { CourseEntity } from '../courses/course.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { QuizEntity } from '../assessments/quiz.entity';
import { QuizAttemptEntity } from '../submissions/quiz-attempt.entity';
import { OcrScanEntity } from '../ocr/ocr-scan.entity';
import { ChatMessageEntity } from '../ai-tutor/chat-message.entity';
import { RecommendationEntity } from '../recommendations/recommendation.entity';
import { AiEngineService } from '../ai-engine/ai-engine.service';

function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  return `${trimmed.slice(0, 6)}••••••••••••••••••••${trimmed.slice(-4)}`;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly envConfig: ConfigService,
    private readonly aiEngine: AiEngineService,
    @InjectRepository(AiConfigEntity) private readonly config: Repository<AiConfigEntity>,
    @InjectRepository(SystemLogEntity) private readonly logs: Repository<SystemLogEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
    @InjectRepository(QuizEntity) private readonly quizzes: Repository<QuizEntity>,
    @InjectRepository(QuizAttemptEntity) private readonly attempts: Repository<QuizAttemptEntity>,
    @InjectRepository(OcrScanEntity) private readonly ocrScans: Repository<OcrScanEntity>,
    @InjectRepository(ChatMessageEntity) private readonly chatMessages: Repository<ChatMessageEntity>,
    @InjectRepository(RecommendationEntity) private readonly recommendations: Repository<RecommendationEntity>,
    private readonly audit: AuditService,
  ) {}

  listLogs(limit = 100) {
    return this.logs.find({
      order: { timestamp: 'DESC' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }

  private serializeAiConfig(config: AiConfigEntity) {
    const envKey =
      this.envConfig.get<string>('GEMINI_API_KEY') ||
      this.envConfig.get<string>('GOOGLE_API_KEY') ||
      this.envConfig.get<string>('OPENAI_API_KEY') ||
      this.envConfig.get<string>('ANTHROPIC_API_KEY') ||
      '';

    const effectiveMasked =
      config.apiKeyMasked?.trim() ||
      (config.apiKey ? maskKey(config.apiKey) : '') ||
      (envKey ? maskKey(envKey) : 'AIEngine-RAG-Local (Có thể nhập API Key đám mây tại đây)');

    const normalizedModel =
      !config.modelName ||
      config.modelName.startsWith('gemini-1.5') ||
      config.modelName.startsWith('gemini-2.0')
        ? 'gemini-3.8-flash'
        : config.modelName;

    return {
      id: config.id,
      provider: config.provider || 'gemini',
      modelName: normalizedModel,
      apiKeyMasked: effectiveMasked,
      customEndpoint: config.customEndpoint || '',
      systemPrompt: config.systemPrompt || '',
      activeModelVersionId: config.activeModelVersionId || null,
      maxTokens: Number(config.maxTokens) || 2048,
      temperature: Number(config.temperature ?? 0.7),
      ocrEngine: config.ocrEngine || 'gemini-multimodal',
      ocrConfidenceThreshold: Number(config.ocrConfidenceThreshold ?? 0.85),
      maxUploadSizeMB: Number(config.maxUploadSizeMB ?? 10),
      serviceStatus: config.serviceStatus === 'offline' ? 'healthy' : config.serviceStatus || 'healthy',
      dailyUsageCount: Number(config.dailyUsageCount) || 0,
      dailyUsageLimit: Number(config.dailyUsageLimit) || 15000,
      updatedAt: config.updatedAt,
    };
  }

  async getAiConfig() {
    const config = await this.aiEngine.getActiveConfig();
    return this.serializeAiConfig(config);
  }

  async updateAiConfig(user: UserEntity, data: UpdateAiConfigDto) {
    const config = await this.aiEngine.getActiveConfig();

    if (data.provider !== undefined) config.provider = data.provider;
    if (data.modelName !== undefined) config.modelName = data.modelName.trim();
    if (data.customEndpoint !== undefined) config.customEndpoint = data.customEndpoint.trim() || null;
    if (data.systemPrompt !== undefined) config.systemPrompt = data.systemPrompt;
    if (data.activeModelVersionId !== undefined) config.activeModelVersionId = data.activeModelVersionId;
    if (data.maxTokens !== undefined) config.maxTokens = data.maxTokens;
    if (data.temperature !== undefined) config.temperature = String(data.temperature);
    if (data.ocrEngine !== undefined) config.ocrEngine = data.ocrEngine;
    if (data.ocrConfidenceThreshold !== undefined) {
      config.ocrConfidenceThreshold = String(data.ocrConfidenceThreshold);
    }
    if (data.maxUploadSizeMB !== undefined) config.maxUploadSizeMB = data.maxUploadSizeMB;
    if (data.serviceStatus !== undefined) config.serviceStatus = data.serviceStatus;
    else config.serviceStatus = 'healthy';
    if (data.dailyUsageLimit !== undefined) config.dailyUsageLimit = data.dailyUsageLimit;

    if (data.apiKey !== undefined && data.apiKey.trim() !== '' && !data.apiKey.includes('•')) {
      config.apiKey = data.apiKey.trim();
      config.apiKeyMasked = maskKey(data.apiKey.trim());
    } else if (data.apiKeyMasked !== undefined && data.apiKeyMasked.trim() !== '') {
      config.apiKeyMasked = data.apiKeyMasked.trim();
    }

    const saved = await this.config.save(config);
    await this.audit.write(
      'AI_CONFIG_UPDATED',
      `Admin cập nhật cấu hình AI: Provider=${saved.provider}, Model=${saved.modelName}, OCR=${saved.ocrEngine}, Threshold=${Math.round(Number(saved.ocrConfidenceThreshold ?? 0.85) * 100)}%.`,
      user,
    );
    return this.serializeAiConfig(saved);
  }

  async testAiConnection(user: UserEntity, prompt?: string) {
    const start = Date.now();
    const reply = await this.aiEngine.generateTutorReply({
      studentId: user.id,
      conversationTitle: 'Kiểm tra kết nối AI Admin',
      history: [],
      userMessage: prompt?.trim() || 'Chào EduMind AI, hãy xác nhận trạng thái hoạt động của mô hình hiện tại trong 2 câu ngắn gọn.',
    });
    const latencyMs = Date.now() - start;
    await this.audit.write(
      'AI_CONNECTION_TESTED',
      `Kiểm tra kết nối AI thành công (${reply.providerUsed} / ${reply.modelUsed}) trong ${latencyMs}ms.`,
      user,
    );
    return {
      ok: true,
      provider: reply.providerUsed,
      modelName: reply.modelUsed,
      latencyMs,
      sampleReply: reply.content,
    };
  }

  async reportSummary() {
    const [
      users,
      teachers,
      students,
      courses,
      publishedCourses,
      enrollments,
      quizzes,
      allAttempts,
      scans,
      aiMessagesCount,
      recommendationsCount,
    ] = await Promise.all([
      this.users.count(),
      this.users.countBy({ role: 'teacher' }),
      this.users.countBy({ role: 'student' }),
      this.courses.count(),
      this.courses.countBy({ status: 'published' }),
      this.enrollments.countBy({ status: 'active' }),
      this.quizzes.count(),
      this.attempts.find(),
      this.ocrScans.count(),
      this.chatMessages.countBy({ sender: 'assistant' }),
      this.recommendations.count(),
    ]);

    const submittedAttempts = allAttempts.filter((a) => a.status === 'submitted' || a.status === 'graded');
    const dayLabels = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const now = new Date();
    const weeklyExamActivity: { day: string; attempts: number; rate: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() - i);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth();
      const d = targetDate.getDate();

      const dayAttempts = allAttempts.filter((a) => {
        const dt = new Date(a.submittedAt ?? a.startedAt ?? a.createdAt);
        return dt.getFullYear() === y && dt.getMonth() === m && dt.getDate() === d;
      });
      const passedOnDay = dayAttempts.filter((a) => {
        const max = Math.max(Number(a.maxScore) || 10, 1);
        return Number(a.totalScore) / max >= 0.5;
      }).length;
      const rate = dayAttempts.length > 0 ? Math.round((passedOnDay / dayAttempts.length) * 100) : 0;

      weeklyExamActivity.push({
        day: dayLabels[targetDate.getDay()],
        attempts: dayAttempts.length,
        rate,
      });
    }

    const passedTotal = submittedAttempts.filter((a) => {
      const max = Math.max(Number(a.maxScore) || 10, 1);
      return Number(a.totalScore) / max >= 0.5;
    }).length;
    const passRatePercent =
      submittedAttempts.length > 0 ? Number(((passedTotal / submittedAttempts.length) * 100).toFixed(1)) : 0;

    return {
      users,
      teachers,
      students,
      courses,
      publishedCourses,
      activeEnrollments: enrollments,
      quizzes,
      attempts: allAttempts.length,
      submittedAttempts: submittedAttempts.length,
      ocrScans: scans,
      aiTutorReplies: aiMessagesCount,
      recommendationsCount,
      passRatePercent,
      weeklyExamActivity,
    };
  }
}
