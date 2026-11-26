import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { AiEngineService, GeneratedQuestionDraft } from '../ai-engine/ai-engine.service';
import { CourseEntity } from '../courses/course.entity';
import { UserEntity } from '../users/user.entity';
import { QuizEntity } from './quiz.entity';
import { QuestionEntity } from './question.entity';
import { SaveQuizDto } from './dto/save-quiz.dto';
import { SaveQuestionDto } from './dto/save-question.dto';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(QuizEntity) private readonly quizzes: Repository<QuizEntity>,
    @InjectRepository(QuestionEntity) private readonly questions: Repository<QuestionEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
    private readonly aiEngine: AiEngineService,
  ) {}

  async generateQuestionsWithAi(
    _user: UserEntity,
    body: {
      topic: string;
      sourceText?: string;
      questionCount?: number;
      difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
      questionType?: 'multiple_choice' | 'essay' | 'mixed';
      courseId?: string;
    },
  ) {
    return this.aiEngine.generateQuizQuestions(body);
  }

  async rewriteQuestionsWithAi(
    _user: UserEntity,
    body: {
      questions?: GeneratedQuestionDraft[];
      rawText?: string;
      mode?: 'improve' | 'add_explanation' | 'harder' | 'unstructured_to_quiz';
      instruction?: string;
    },
  ) {
    return this.aiEngine.rewriteQuizQuestions(body);
  }

  async listQuizzes(user: UserEntity, courseId?: string) {
    const qb = this.quizzes.createQueryBuilder('quiz');
    if (courseId) qb.andWhere('quiz.courseId = :courseId', { courseId });
    if (user.role === 'student') {
      const enrolled = await this.enrollments.find({ where: { studentId: user.id, status: 'active' } });
      const courseIds = enrolled.map((record) => record.courseId);
      qb.andWhere('quiz.isPublished = true');
      if (courseIds.length) qb.andWhere('(quiz.courseId IS NULL OR quiz.courseId IN (:...courseIds))', { courseIds });
      else qb.andWhere('quiz.courseId IS NULL');
    }
    if (user.role === 'teacher') {
      qb.andWhere(
        '(quiz."createdBy" = :teacherId OR quiz.courseId IN (SELECT c.id FROM courses c WHERE c."teacherId" = :teacherId))',
        { teacherId: user.id },
      );
    }
    return qb.orderBy('quiz.createdAt', 'DESC').getMany();
  }

  async getQuiz(id: string) {
    const quiz = await this.quizzes.findOneBy({ id });
    if (!quiz) throw new NotFoundException('Bài kiểm tra không tồn tại.');
    return quiz;
  }

  async getQuizForUser(user: UserEntity, id: string) {
    const quiz = await this.getQuiz(id);
    if (user.role === 'student') {
      const isEnrolled = quiz.courseId
        ? await this.enrollments.findOneBy({ studentId: user.id, courseId: quiz.courseId, status: 'active' })
        : true;
      if (!quiz.isPublished || !isEnrolled) {
        throw new ForbiddenException('Bạn chưa được cấp quyền truy cập bài kiểm tra này.');
      }
    }
    if (user.role === 'teacher') await this.assertQuizEditor(user, quiz);
    return quiz;
  }

  private async assertCourseEditor(user: UserEntity, courseId: string) {
    const course = await this.courses.findOneBy({ id: courseId });
    if (!course) throw new NotFoundException('Khóa học không tồn tại.');
    if (user.role !== 'admin' && !(user.role === 'teacher' && course.teacherId === user.id)) {
      throw new ForbiddenException('Bạn không được phân công khóa học này.');
    }
    return course;
  }

  private async assertQuizEditor(user: UserEntity, quiz: QuizEntity) {
    if (user.role === 'admin') return;
    if (quiz.courseId) {
      await this.assertCourseEditor(user, quiz.courseId);
      return;
    }
    if (quiz.createdBy !== user.id) throw new ForbiddenException('Bạn không được chỉnh sửa đề kiểm tra này.');
  }

  async createQuiz(user: UserEntity, data: SaveQuizDto) {
    if (!data.title?.trim()) throw new NotFoundException('Cần cung cấp tiêu đề đề kiểm tra.');
    const course = data.courseId ? await this.assertCourseEditor(user, data.courseId) : null;
    return this.quizzes.save(
      this.quizzes.create({
        ...data,
        id: data.id ?? createId('quiz'),
        createdBy: user.id,
        courseId: data.courseId ?? null,
        courseTitle: course?.title ?? 'Đề độc lập',
        lessonId: data.lessonId ?? null,
        description: data.description ?? '',
        timeLimitMinutes: data.timeLimitMinutes ?? 0,
        passingScore: String(data.passingScore ?? 0),
        maxScore: String(data.maxScore ?? 0),
        questionCount: 0,
      }),
    );
  }

  async updateQuiz(user: UserEntity, id: string, data: SaveQuizDto) {
    const quiz = await this.getQuiz(id);
    await this.assertQuizEditor(user, quiz);
    const nextCourse = data.courseId ? await this.assertCourseEditor(user, data.courseId) : null;
    if (data.title !== undefined) quiz.title = data.title;
    if (data.description !== undefined) quiz.description = data.description;
    if (data.lessonId !== undefined) quiz.lessonId = data.lessonId ?? null;
    if (data.timeLimitMinutes !== undefined) quiz.timeLimitMinutes = data.timeLimitMinutes;
    if (data.isPublished !== undefined) quiz.isPublished = data.isPublished;
    if (data.courseId !== undefined) {
      quiz.courseId = data.courseId ?? null;
      quiz.courseTitle = nextCourse?.title ?? (data.courseTitle || 'Đề độc lập');
      if (!quiz.courseId) quiz.lessonId = null;
    } else if (data.courseTitle !== undefined) {
      quiz.courseTitle = data.courseTitle;
    }
    if (data.passingScore !== undefined) quiz.passingScore = String(data.passingScore);
    if (data.maxScore !== undefined) quiz.maxScore = String(data.maxScore);
    return this.quizzes.save(quiz);
  }

  async removeQuiz(user: UserEntity, id: string) {
    const quiz = await this.getQuiz(id);
    await this.assertQuizEditor(user, quiz);
    await this.quizzes.remove(quiz);
    return { deleted: true };
  }

  async listQuestions(user: UserEntity, quizId: string, forceStudentView = false) {
    await this.getQuiz(quizId);
    if (user.role === 'student') await this.getQuizForUser(user, quizId);
    if (user.role === 'teacher') {
      const quiz = await this.getQuiz(quizId);
      await this.assertQuizEditor(user, quiz);
    }
    const records = await this.questions.find({ where: { quizId }, order: { order: 'ASC' } });
    if (user.role !== 'student' && !forceStudentView) return records;
    return records.map(({ explanation, options, ...question }) => ({
      ...question,
      explanation: undefined,
      options: (options ?? []).map(({ id, text, attachmentName, attachmentType, attachmentSize, attachmentDataUrl, attachmentExtractedText }) => ({
        id,
        text,
        ...(attachmentName
          ? { attachmentName, attachmentType, attachmentSize, attachmentDataUrl, attachmentExtractedText }
          : {}),
      })),
    }));
  }

  async createQuestion(user: UserEntity, data: SaveQuestionDto) {
    if (!data.quizId || !data.content) throw new NotFoundException('Cần cung cấp bài kiểm tra và nội dung câu hỏi.');
    const quiz = await this.getQuiz(data.quizId);
    await this.assertQuizEditor(user, quiz);
    const question = await this.questions.save(
      this.questions.create({
        ...data,
        id: data.id ?? createId('q'),
        type: data.type ?? 'multiple_choice',
        points: String(data.points ?? 1),
        options: (data.options ?? []).map((o) => ({
          id: o.id ?? createId('opt'),
          text: o.text,
          isCorrect: o.isCorrect ?? false,
          ...(o.attachmentName
            ? {
                attachmentName: o.attachmentName,
                attachmentType: o.attachmentType,
                attachmentSize: o.attachmentSize,
                attachmentDataUrl: o.attachmentDataUrl,
                attachmentExtractedText: o.attachmentExtractedText,
              }
            : {}),
        })),
        explanation: data.explanation ?? null,
        order: data.order ?? (await this.questions.countBy({ quizId: quiz.id })) + 1,
      }),
    );
    await this.refreshQuizTotals(quiz.id);
    return question;
  }

  async updateQuestion(user: UserEntity, id: string, data: SaveQuestionDto) {
    const question = await this.questions.findOneBy({ id });
    if (!question) throw new NotFoundException('Câu hỏi không tồn tại.');
    const quiz = await this.getQuiz(data.quizId ?? question.quizId);
    await this.assertQuizEditor(user, quiz);
    if (data.content !== undefined) question.content = data.content;
    if (data.type !== undefined) question.type = data.type;
    if (data.explanation !== undefined) question.explanation = data.explanation;
    if (data.order !== undefined) question.order = data.order;
    if (data.points !== undefined) question.points = String(data.points);
    if (data.options !== undefined) {
      question.options = data.options.map((o) => ({
        id: o.id ?? createId('opt'),
        text: o.text,
        isCorrect: o.isCorrect ?? false,
        ...(o.attachmentName
          ? {
              attachmentName: o.attachmentName,
              attachmentType: o.attachmentType,
              attachmentSize: o.attachmentSize,
              attachmentDataUrl: o.attachmentDataUrl,
              attachmentExtractedText: o.attachmentExtractedText,
            }
          : {}),
      }));
    }
    question.quizId = quiz.id;
    const saved = await this.questions.save(question);
    await this.refreshQuizTotals(quiz.id);
    return saved;
  }

  async removeQuestion(user: UserEntity, id: string) {
    const question = await this.questions.findOneBy({ id });
    if (!question) throw new NotFoundException('Câu hỏi không tồn tại.');
    const quiz = await this.getQuiz(question.quizId);
    await this.assertQuizEditor(user, quiz);
    await this.questions.remove(question);
    await this.refreshQuizTotals(quiz.id);
    return { deleted: true };
  }

  async refreshQuizTotals(quizId: string) {
    const quiz = await this.getQuiz(quizId);
    const questions = await this.questions.findBy({ quizId });
    quiz.questionCount = questions.length;
    quiz.maxScore = questions.reduce((sum, q) => sum + Number(q.points), 0).toFixed(2);
    await this.quizzes.save(quiz);
  }
}
