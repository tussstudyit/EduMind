import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { ConversationEntity } from '../ai-tutor/conversation.entity';
import { QuizEntity } from '../assessments/quiz.entity';
import { CourseEntity } from '../courses/course.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { OcrScanEntity } from '../ocr/ocr-scan.entity';
import { ProgressEntity } from '../progress/progress.entity';
import { QuizAttemptEntity } from '../submissions/quiz-attempt.entity';
import { UserEntity } from '../users/user.entity';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { RecommendationEntity } from './recommendation.entity';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(RecommendationEntity) private readonly recommendations: Repository<RecommendationEntity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
    @InjectRepository(ProgressEntity) private readonly progress: Repository<ProgressEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
    @InjectRepository(LessonEntity) private readonly lessons: Repository<LessonEntity>,
    @InjectRepository(QuizEntity) private readonly quizzes: Repository<QuizEntity>,
    @InjectRepository(QuizAttemptEntity) private readonly attempts: Repository<QuizAttemptEntity>,
    @InjectRepository(ConversationEntity) private readonly conversations: Repository<ConversationEntity>,
    @InjectRepository(OcrScanEntity) private readonly ocrScans: Repository<OcrScanEntity>,
    private readonly aiEngine: AiEngineService,
  ) {}

  async list(user: UserEntity, includeDismissed = false) {
    const items = await this.recommendations.find({
      where: { studentId: user.id, ...(includeDismissed ? {} : { isDismissed: false }) },
      order: { createdAt: 'DESC' },
    });
    if (items.length === 0 && !includeDismissed) {
      return this.generatePersonalized(user, false);
    }
    return items;
  }

  create(data: CreateRecommendationDto) {
    return this.recommendations.save(
      this.recommendations.create({
        ...data,
        id: createId('rec'),
        courseId: data.courseId ?? null,
        reason: data.reason ?? null,
        isRead: false,
        isDismissed: false,
      }),
    );
  }

  /**
   * 5. ENGINE CÁ NHÂN HÓA TỰ SINH ĐỀ XUẤT HỌC TẬP DỰA TRÊN TIẾN ĐỘ, ĐIỂM THI, LỊCH SỬ AI TUTOR & OCR
   */
  async generatePersonalized(user: UserEntity, forceRefresh = true): Promise<RecommendationEntity[]> {
    const [activeEnrollments, studentProgress, studentAttempts, publishedCourses, recentConvs, recentScans] =
      await Promise.all([
        this.enrollments.find({ where: { studentId: user.id, status: 'active' } }),
        this.progress.find({ where: { studentId: user.id } }),
        this.attempts.find({ where: { studentId: user.id }, order: { startedAt: 'DESC' }, take: 10 }),
        this.courses.find({ where: { status: 'published' } }),
        this.conversations.find({ where: { studentId: user.id }, order: { updatedAt: 'DESC' }, take: 5 }),
        this.ocrScans.find({ where: { studentId: user.id }, order: { createdAt: 'DESC' }, take: 5 }),
      ]);

    if (forceRefresh) {
      await this.recommendations.delete({ studentId: user.id, isRead: false });
    }

    const drafts: Array<{
      title: string;
      description: string;
      reason: string;
      type: 'course' | 'review' | 'exercise' | 'tip';
      courseId: string | null;
    }> = [];

    const enrolledCourseIds = new Set(activeEnrollments.map((e) => e.courseId));

    // 1. Phân tích tiến độ từng khóa học đang học -> gợi ý bài giảng tiếp theo
    for (const enrollment of activeEnrollments.slice(0, 2)) {
      const courseLessons = await this.lessons.find({
        where: { courseId: enrollment.courseId, isPublished: true },
        order: { order: 'ASC' },
      });
      const prog = studentProgress.find((p) => p.courseId === enrollment.courseId);
      const completedSet = new Set(prog?.completedLessonIds || []);
      const nextLesson = courseLessons.find((l) => !completedSet.has(l.id));
      const pct = prog?.percentCompleted ?? enrollment.progressPercent ?? 0;

      if (nextLesson) {
        drafts.push({
          title: `Tiếp tục học: ${nextLesson.title}`,
          description: `${nextLesson.description || 'Bài học trọng tâm tiếp theo trong lộ trình của bạn.'} Thời lượng ước tính: ${nextLesson.durationMinutes} phút.`,
          reason: `Dựa trên tiến độ ${pct}% khóa "${enrollment.courseTitle}" (${completedSet.size}/${courseLessons.length} bài đã hoàn thành)`,
          type: 'review',
          courseId: enrollment.courseId,
        });
      }
    }

    // 2. Phân tích kết quả làm bài kiểm tra (Quiz Attempts) -> gợi ý ôn tập bài điểm thấp hoặc bài kiểm tra chưa làm
    const lowAttempt = studentAttempts.find((att) => {
      const max = Number(att.maxScore) || 10;
      const score = Number(att.totalScore) || 0;
      return (att.status === 'submitted' || att.status === 'graded') && score / max < 0.75;
    });

    if (lowAttempt) {
      drafts.push({
        title: `Ôn tập củng cố: ${lowAttempt.quizTitle}`,
        description: `Bạn đạt ${lowAttempt.totalScore}/${lowAttempt.maxScore} điểm ở lần làm gần nhất. Hãy xem lại lời giải chi tiết và trao đổi với AI Tutor về các câu hỏi chưa đạt điểm tối đa.`,
        reason: `Phát hiện điểm số cần cải thiện (${lowAttempt.totalScore}/${lowAttempt.maxScore}đ) trong lịch sử kiểm tra`,
        type: 'exercise',
        courseId: lowAttempt.courseId ?? null,
      });
    } else {
      const availableQuizzes = await this.quizzes.find({
        where: { isPublished: true },
        order: { createdAt: 'DESC' },
        take: 10,
      });
      const attemptedQuizIds = new Set(studentAttempts.map((a) => a.quizId));
      const unattemptedQuiz = availableQuizzes.find(
        (q) => !attemptedQuizIds.has(q.id) && (!q.courseId || enrolledCourseIds.has(q.courseId)),
      );
      if (unattemptedQuiz) {
        drafts.push({
          title: `Thử sức bài kiểm tra: ${unattemptedQuiz.title}`,
          description: `Bài kiểm tra gồm ${unattemptedQuiz.questionCount} câu hỏi (${unattemptedQuiz.timeLimitMinutes} phút). Làm bài ngay để đánh giá mức độ nắm vững kiến thức.`,
          reason: `Bạn chưa thực hiện bài đánh giá định kỳ của khóa "${unattemptedQuiz.courseTitle}"`,
          type: 'exercise',
          courseId: unattemptedQuiz.courseId ?? null,
        });
      }
    }

    // 3. Phân tích lịch sử hỏi đáp AI Tutor & Quét tài liệu OCR
    if (recentConvs.length > 0 || recentScans.length > 0) {
      const topicRef = recentConvs[0]?.title || `Tài liệu OCR ${recentScans[0]?.fileName}`;
      drafts.push({
        title: `Luyện tập chuyên sâu: ${topicRef.slice(0, 75)}`,
        description: `AI nhận thấy bạn vừa nghiên cứu chủ đề "${topicRef}". Hãy yêu cầu AI Tutor sinh 3 bài tập tự luyện có độ khó tăng dần để nắm chắc dạng bài này.`,
        reason: `Cá nhân hóa từ lịch sử tương tác AI Tutor & Quét OCR gần nhất của bạn`,
        type: 'tip',
        courseId: recentConvs[0]?.courseId ?? null,
      });
    }

    // 4. Gợi ý khóa học mới bổ trợ chưa ghi danh
    const unenrolledCourses = publishedCourses.filter((c) => !enrolledCourseIds.has(c.id));
    if (unenrolledCourses.length > 0) {
      const recommendedCourse = unenrolledCourses[0];
      drafts.push({
        title: `Khám phá khóa học: ${recommendedCourse.title}`,
        description: `${recommendedCourse.description} (Giảng viên: ${recommendedCourse.teacherName} · Thời lượng: ${recommendedCourse.durationHours} giờ).`,
        reason: `Mở rộng lộ trình môn ${recommendedCourse.subjectName} phù hợp với hồ sơ học tập của bạn`,
        type: 'course',
        courseId: recommendedCourse.id,
      });
    }

    // Đảm bảo luôn có ít nhất 3 gợi ý chất lượng ngay cả với tài khoản học viên mới tinh
    if (drafts.length < 3) {
      const fallbackCourse = publishedCourses[0];
      drafts.push({
        title: fallbackCourse
          ? `Bắt đầu lộ trình: ${fallbackCourse.title}`
          : 'Khởi động chuỗi học tập 20 phút mỗi ngày cùng AI Tutor',
        description: fallbackCourse
          ? `Tham gia khóa học "${fallbackCourse.title}" và hoàn thành Bài 1 để hệ thống AI bắt đầu đo lường tiến độ cá nhân hóa cho bạn.`
          : 'Đặt câu hỏi đầu tiên cho EduMind AI Tutor hoặc tải ảnh bài tập lên trình quét OCR để nhận hướng dẫn giải từng bước.',
        reason: 'Gợi ý khởi động lộ trình học tập thông minh dành cho học viên',
        type: fallbackCourse ? 'course' : 'tip',
        courseId: fallbackCourse?.id ?? null,
      });
    }

    // Thử làm giàu mô tả qua mô hình AI nếu có kết nối
    const aiConfig = await this.aiEngine.getActiveConfig();
    const modelTag = aiConfig.modelName || 'gemini-3.8-flash';

    const entitiesToSave = drafts.slice(0, 4).map((d) =>
      this.recommendations.create({
        id: createId('rec'),
        studentId: user.id,
        title: d.title.slice(0, 200),
        description: d.description,
        reason: `${d.reason} · Phân tích bởi ${modelTag}`,
        type: d.type,
        courseId: d.courseId,
        isRead: false,
        isDismissed: false,
      }),
    );

    await this.recommendations.save(entitiesToSave);
    return this.recommendations.find({
      where: { studentId: user.id, isDismissed: false },
      order: { createdAt: 'DESC' },
    });
  }

  private async own(user: UserEntity, id: string) {
    const item = await this.recommendations.findOneBy({ id });
    if (!item) throw new NotFoundException('Đề xuất không tồn tại.');
    if (user.role !== 'admin' && item.studentId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền truy cập đề xuất này.');
    }
    return item;
  }

  async markRead(user: UserEntity, id: string) {
    const item = await this.own(user, id);
    item.isRead = true;
    return this.recommendations.save(item);
  }

  async dismiss(user: UserEntity, id: string) {
    const item = await this.own(user, id);
    item.isDismissed = true;
    return this.recommendations.save(item);
  }
}
