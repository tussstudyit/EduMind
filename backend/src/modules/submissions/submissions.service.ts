import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { NotificationsService } from '../notifications/notifications.service';
import { QuestionEntity } from '../assessments/question.entity';
import { QuizEntity } from '../assessments/quiz.entity';
import { CourseEntity } from '../courses/course.entity';
import { UserEntity } from '../users/user.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { GradeAttemptDto } from './dto/grade-attempt.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { AttemptAnswer, QuizAttemptEntity } from './quiz-attempt.entity';

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(QuizAttemptEntity) private readonly attempts: Repository<QuizAttemptEntity>,
    @InjectRepository(QuizEntity) private readonly quizzes: Repository<QuizEntity>,
    @InjectRepository(QuestionEntity) private readonly questions: Repository<QuestionEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  private async triggerN8nGradingWebhook(payload: Record<string, unknown>) {
    const baseUrl = this.config.get<string>('N8N_BASE_URL', 'http://n8n:5678').replace(/\/$/, '');
    try {
      await fetch(`${baseUrl}/webhook/edumind-grading-notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      this.logger.warn(`n8n grading webhook unreachable: ${err instanceof Error ? err.message : err}`);
    }
  }

  async list(user: UserEntity, quizId?: string, studentId?: string) {
    const qb = this.attempts.createQueryBuilder('attempt');
    if (quizId) qb.andWhere('attempt.quizId = :quizId', { quizId });
    if (user.role === 'student') qb.andWhere('attempt.studentId = :studentId', { studentId: user.id });
    else if (user.role === 'teacher') {
      qb.andWhere('(attempt.courseId IN (SELECT c.id FROM courses c WHERE c."teacherId" = :teacherId) OR attempt."quizId" IN (SELECT q.id FROM quizzes q WHERE q."createdBy" = :teacherId))', { teacherId: user.id });
      if (studentId) qb.andWhere('attempt.studentId = :studentId', { studentId });
    } else if (studentId) qb.andWhere('attempt.studentId = :studentId', { studentId });
    return qb.orderBy('attempt.startedAt', 'DESC').getMany();
  }

  async start(user: UserEntity, quizId: string) {
    const quiz = await this.quizzes.findOneBy({ id: quizId, isPublished: true });
    if (!quiz) throw new NotFoundException('Bài kiểm tra chưa tồn tại hoặc chưa được xuất bản.');
    if (quiz.courseId && !(await this.enrollments.findOneBy({ studentId: user.id, courseId: quiz.courseId, status: 'active' }))) {
      throw new ForbiddenException('Bạn chưa ghi danh khóa học này.');
    }
    const existing = await this.attempts.findOne({ where: { quizId, studentId: user.id, status: 'in_progress' }, order: { startedAt: 'DESC' } });
    if (existing) return existing;
    return this.attempts.save(this.attempts.create({
      id: createId('attempt'), quizId, quizTitle: quiz.title, courseId: quiz.courseId ?? null,
      studentId: user.id, studentName: user.name, studentAvatar: user.avatar,
      status: 'in_progress', answers: [], totalScore: '0', maxScore: String(quiz.maxScore),
    }));
  }

  private async ownedOrTeacher(user: UserEntity, id: string) {
    const attempt = await this.attempts.findOneBy({ id });
    if (!attempt) throw new NotFoundException('Bài làm không tồn tại.');
    if (user.role === 'student' && attempt.studentId !== user.id) throw new ForbiddenException('Đây không phải bài làm của bạn.');
    if (user.role === 'teacher') {
      const quiz = await this.quizzes.findOneBy({ id: attempt.quizId });
      if (quiz?.createdBy === user.id) return attempt;
      const course = attempt.courseId ? await this.courses.findOneBy({ id: attempt.courseId }) : null;
      if (!course || course.teacherId !== user.id) throw new ForbiddenException('Bạn không phụ trách đề kiểm tra này.');
    }
    return attempt;
  }

  private async sanitizeAnswers(quizId: string, answers: SaveDraftDto['answers']): Promise<AttemptAnswer[]> {
    const questions = await this.questions.findBy({ quizId });
    const byId = new Map(questions.map((q) => [q.id, q]));
    return answers.map((answer) => {
      const question = byId.get(answer.questionId);
      if (!question) throw new ForbiddenException('Bài làm chứa câu hỏi không thuộc bài kiểm tra.');
      if (question.type === 'multiple_choice' && answer.selectedOptionId && !question.options.some((o) => o.id === answer.selectedOptionId)) {
        throw new ForbiddenException('Lựa chọn không hợp lệ.');
      }
      return question.type === 'essay'
        ? {
            questionId: question.id,
            essayAnswer: answer.essayAnswer ?? '',
            ...(answer.attachmentName
              ? {
                  attachmentName: answer.attachmentName,
                  attachmentType: answer.attachmentType ?? 'application/octet-stream',
                  attachmentSize: answer.attachmentSize ?? '',
                  attachmentDataUrl: answer.attachmentDataUrl ?? '',
                  attachmentExtractedText: answer.attachmentExtractedText ?? '',
                }
              : {}),
          }
        : { questionId: question.id, selectedOptionId: answer.selectedOptionId };
    });
  }

  async saveDraft(user: UserEntity, id: string, data: SaveDraftDto) {
    const attempt = await this.ownedOrTeacher(user, id);
    if (user.role !== 'student') throw new ForbiddenException('Chỉ học viên được lưu nháp.');
    if (attempt.status !== 'in_progress') throw new ForbiddenException('Bài làm đã nộp nên không thể chỉnh sửa.');
    attempt.answers = await this.sanitizeAnswers(attempt.quizId, data.answers);
    return this.attempts.save(attempt);
  }

  async submit(user: UserEntity, id: string, data: SaveDraftDto) {
    const attempt = await this.ownedOrTeacher(user, id);
    if (user.role !== 'student') throw new ForbiddenException('Chỉ học viên được nộp bài.');
    if (attempt.status !== 'in_progress') throw new ForbiddenException('Bài làm đã được nộp.');
    const answers = await this.sanitizeAnswers(attempt.quizId, data.answers);
    const questions = await this.questions.find({ where: { quizId: attempt.quizId }, order: { order: 'ASC' } });
    const quizRecord = await this.quizzes.findOneBy({ id: attempt.quizId });
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));
    let rawEarnedPoints = 0;
    let totalQuestionPoints = 0;
    for (const question of questions) {
      const qPoints = Number(question.points) || 0;
      totalQuestionPoints += qPoints;
      let answer = answerMap.get(question.id);
      if (!answer) {
        answer = question.type === 'essay'
          ? { questionId: question.id, essayAnswer: '' }
          : { questionId: question.id, selectedOptionId: undefined };
        answers.push(answer);
        answerMap.set(question.id, answer);
      }
      if (question.type === 'multiple_choice') {
        const correctOption = (question.options ?? []).find((option) => option.isCorrect);
        const correct = Boolean(answer.selectedOptionId && correctOption && correctOption.id === answer.selectedOptionId);
        const awarded = correct ? qPoints : 0;
        rawEarnedPoints += awarded;
        answer.scoreAwarded = awarded;
        answer.isCorrect = correct;
        answer.correctOptionId = correctOption?.id;
      }
    }
    const configuredMaxScore = Number(quizRecord?.maxScore) > 0 ? Number(quizRecord?.maxScore) : totalQuestionPoints;
    const hasEssay = questions.some((question) => question.type === 'essay');
    let finalScore = rawEarnedPoints;
    if (!hasEssay && totalQuestionPoints > 0 && configuredMaxScore > 0 && Math.abs(configuredMaxScore - totalQuestionPoints) > 0.01) {
      finalScore = (rawEarnedPoints / totalQuestionPoints) * configuredMaxScore;
    }
    attempt.answers = answers;
    attempt.maxScore = (configuredMaxScore || totalQuestionPoints).toFixed(2);
    attempt.totalScore = finalScore.toFixed(2);
    attempt.status = hasEssay ? 'submitted' : 'graded';
    attempt.submittedAt = new Date();
    if (!hasEssay) {
      attempt.gradedAt = new Date();
      attempt.gradedBy = 'Hệ thống chấm tự động';
    }
    const saved = await this.attempts.save(attempt);
    const course = attempt.courseId ? await this.courses.findOneBy({ id: attempt.courseId }) : null;
    const quiz = course ? quizRecord : (quizRecord ?? await this.quizzes.findOneBy({ id: attempt.quizId }));
    const teacherId = course?.teacherId ?? quiz?.createdBy;
    const teacher = teacherId ? await this.users.findOneBy({ id: teacherId }) : null;
    if (teacherId) {
      await this.notifications.create({
        userId: teacherId,
        title: hasEssay ? 'Học viên đã nộp bài tự luận cần chấm' : 'Học viên đã hoàn thành bài trắc nghiệm',
        message: hasEssay
          ? `${user.name} đã nộp bài "${attempt.quizTitle}" và đang chờ giảng viên chấm điểm.`
          : `${user.name} đã nộp bài "${attempt.quizTitle}" — Hệ thống chấm tự động: ${attempt.totalScore}/${attempt.maxScore}đ.`,
        type: 'info',
      });
    }
    if (!hasEssay) {
      void this.triggerN8nGradingWebhook({
        attemptId: saved.id,
        quizTitle: saved.quizTitle,
        studentName: user.name,
        studentEmail: user.email,
        teacherName: teacher?.name || 'Hệ thống chấm tự động EduMind AI',
        teacherEmail: teacher?.email || 'edumind1905@gmail.com',
        totalScore: saved.totalScore,
        maxScore: saved.maxScore,
        gradingMode: 'Chấm điểm Trắc nghiệm Tự động (Azota Auto-Grade)',
        teacherNotes: 'Hệ thống đã tự động chấm điểm dựa trên đáp án chuẩn của Giảng viên.',
      });
    }
    return saved;
  }

  async grade(user: UserEntity, id: string, data: GradeAttemptDto) {
    const attempt = await this.ownedOrTeacher(user, id);
    if (!['submitted', 'graded'].includes(attempt.status)) {
      throw new ForbiddenException('Chỉ có thể chấm bài đã nộp.');
    }
    const questions = await this.questions.findBy({ quizId: attempt.quizId });
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));
    for (const grade of data.grades) {
      const question = questionMap.get(grade.questionId);
      let answer = answerMap.get(grade.questionId);
      if (!question) continue;
      if (!answer) {
        answer = { questionId: question.id, essayAnswer: '' };
        answerMap.set(question.id, answer);
      }
      if (grade.scoreAwarded > Number(question.points)) {
        throw new ForbiddenException('Điểm câu trả lời vượt quá điểm tối đa.');
      }
      answer.scoreAwarded = grade.scoreAwarded;
      answer.teacherFeedback = grade.teacherFeedback ?? '';
    }
    attempt.answers = [...answerMap.values()];
    const totalQPoints = questions.reduce((sum, q) => sum + Number(q.points || 0), 0);
    if (Number(attempt.maxScore) <= 0 && totalQPoints > 0) {
      attempt.maxScore = totalQPoints.toFixed(2);
    }
    attempt.totalScore = attempt.answers.reduce((sum, answer) => sum + Number(answer.scoreAwarded ?? 0), 0).toFixed(2);
    attempt.teacherNotes = data.teacherNotes ?? '';
    attempt.gradedBy = user.name;
    attempt.gradedAt = new Date();
    attempt.status = 'graded';
    const saved = await this.attempts.save(attempt);
    const student = await this.users.findOneBy({ id: attempt.studentId });
    await this.notifications.create({
      userId: attempt.studentId,
      title: '✅ Bài kiểm tra đã được chấm điểm (n8n)',
      message: `Giảng viên ${user.name} đã chấm bài "${attempt.quizTitle}". Điểm của bạn: ${attempt.totalScore}/${attempt.maxScore}đ.`,
      type: 'success',
    });
    void this.triggerN8nGradingWebhook({
      attemptId: saved.id,
      quizTitle: saved.quizTitle,
      studentName: student?.name || saved.studentName,
      studentEmail: student?.email || 'edumind1905@gmail.com',
      teacherName: user.name,
      teacherEmail: user.email,
      totalScore: saved.totalScore,
      maxScore: saved.maxScore,
      gradingMode: 'Giảng viên chấm bài Tự luận & Trắc nghiệm (qua n8n)',
      teacherNotes: saved.teacherNotes || 'Giảng viên đã hoàn tất chấm điểm bài làm của bạn.',
    });
    return saved;
  }
}
