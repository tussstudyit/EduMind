import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from '../courses/course.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { UserEntity } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { ProgressEntity } from './progress.entity';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(ProgressEntity) private readonly progress: Repository<ProgressEntity>,
    @InjectRepository(LessonEntity) private readonly lessons: Repository<LessonEntity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async listProgress(user: UserEntity, studentId?: string) {
    const qb = this.progress.createQueryBuilder('prog');
    if (user.role === 'student') {
      qb.andWhere('prog.studentId = :ownId', { ownId: user.id });
    } else if (studentId) {
      qb.andWhere('prog.studentId = :studentId', { studentId });
    }
    if (user.role === 'teacher') {
      qb.andWhere('prog.courseId IN (SELECT c.id FROM courses c WHERE c."teacherId" = :teacherId)', {
        teacherId: user.id,
      });
    }
    return qb.orderBy('prog.lastStudiedAt', 'DESC').getMany();
  }

  async getProgress(user: UserEntity, studentId: string | undefined, courseId: string) {
    const targetStudentId = user.role === 'student' ? user.id : studentId;
    if (!targetStudentId) throw new NotFoundException('Cần truyền mã học viên.');
    if (user.role === 'teacher') {
      const course = await this.courses.findOneBy({ id: courseId });
      if (!course || course.teacherId !== user.id) throw new ForbiddenException('Bạn không phụ trách khóa học này.');
    }
    const existing = await this.progress.findOneBy({ studentId: targetStudentId, courseId });
    if (existing) return existing;
    return {
      id: `prog-${targetStudentId}-${courseId}`,
      studentId: targetStudentId,
      courseId,
      completedLessonIds: [],
      lastLessonId: '',
      lastStudiedAt: new Date(),
      percentCompleted: 0,
      totalMinutesStudied: 0,
    };
  }

  async accessLesson(user: UserEntity, data: CompleteLessonDto) {
    const studentId = user.id;
    const enrollment = await this.enrollments.findOneBy({ studentId, courseId: data.courseId, status: 'active' });
    if (!enrollment) throw new ForbiddenException('Bạn chưa ghi danh khóa học này.');
    const lesson = await this.lessons.findOneBy({ id: data.lessonId, courseId: data.courseId });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học thuộc khóa học này.');

    const now = new Date();
    let progress = await this.progress.findOneBy({ studentId, courseId: data.courseId });
    if (!progress) {
      progress = this.progress.create({
        studentId,
        courseId: data.courseId,
        completedLessonIds: [],
        lastLessonId: lesson.id,
        lastStudiedAt: now,
        percentCompleted: 0,
        totalMinutesStudied: 0,
      });
    } else {
      progress.lastLessonId = lesson.id;
      progress.lastStudiedAt = now;
    }
    await this.progress.save(progress);
    await this.enrollments.update({ studentId, courseId: data.courseId }, { lastAccessedAt: now });
    return progress;
  }

  async completeLesson(user: UserEntity, data: CompleteLessonDto) {
    const studentId = user.id;
    const enrollment = await this.enrollments.findOneBy({ studentId, courseId: data.courseId, status: 'active' });
    if (!enrollment) throw new ForbiddenException('Bạn chưa ghi danh khóa học này.');
    const lesson = await this.lessons.findOneBy({ id: data.lessonId, courseId: data.courseId });
    if (!lesson) throw new NotFoundException('Không tìm thấy bài học thuộc khóa học này.');
    const allLessons = await this.lessons.findBy({ courseId: data.courseId });
    const now = new Date();
    let progress = await this.progress.findOneBy({ studentId, courseId: data.courseId });
    const isNewCompletion = !progress?.completedLessonIds.includes(lesson.id);
    if (!progress) {
      progress = this.progress.create({
        studentId,
        courseId: data.courseId,
        completedLessonIds: [lesson.id],
        lastLessonId: lesson.id,
        lastStudiedAt: now,
        percentCompleted: Math.round((1 / Math.max(allLessons.length, 1)) * 100),
        totalMinutesStudied: lesson.durationMinutes,
      });
    } else {
      if (isNewCompletion) progress.completedLessonIds = [...progress.completedLessonIds, lesson.id];
      progress.lastLessonId = lesson.id;
      progress.lastStudiedAt = now;
      const validSet = new Set(progress.completedLessonIds.filter((id) => allLessons.some((l) => l.id === id)));
      progress.percentCompleted = Math.min(100, Math.round((validSet.size / Math.max(allLessons.length, 1)) * 100));
      if (isNewCompletion) progress.totalMinutesStudied += lesson.durationMinutes;
    }
    await this.progress.save(progress);
    await this.enrollments.update(
      { studentId, courseId: data.courseId },
      { progressPercent: progress.percentCompleted, lastAccessedAt: now },
    );
    return progress;
  }

  async sendProgressReminderViaN8n(
    teacher: UserEntity,
    body: { studentId: string; courseId: string; customMessage?: string },
  ) {
    const course = await this.courses.findOneBy({ id: body.courseId });
    if (!course) throw new NotFoundException('Không tìm thấy khóa học.');
    if (teacher.role === 'teacher' && course.teacherId !== teacher.id) {
      throw new ForbiddenException('Bạn không phụ trách khóa học này.');
    }
    const student = await this.users.findOneBy({ id: body.studentId });
    if (!student) throw new NotFoundException('Không tìm thấy sinh viên.');

    const allLessons = await this.lessons.findBy({ courseId: course.id });
    const prog = await this.progress.findOneBy({ studentId: student.id, courseId: course.id });
    const attendedLessons = prog?.completedLessonIds?.length ?? 0;
    const totalLessons = allLessons.length;
    const percentCompleted = prog?.percentCompleted ?? 0;

    const customMessage =
      body.customMessage?.trim() ||
      `Em đã tham gia ${attendedLessons}/${totalLessons} buổi học (${percentCompleted}%). Hãy vào Phòng học trực tuyến xem đầy đủ video bài giảng và làm bài kiểm tra của khóa "${course.title}" nhé!`;

    const baseUrl = this.config.get<string>('N8N_BASE_URL', 'http://n8n:5678').replace(/\/$/, '');
    let n8nSent = false;
    try {
      const res = await fetch(`${baseUrl}/webhook/edumind-progress-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          teacherName: teacher.name,
          teacherEmail: teacher.email,
          studentId: student.id,
          studentName: student.name,
          studentEmail: student.email,
          courseId: course.id,
          courseTitle: course.title,
          attendedLessons,
          totalLessons,
          percentCompleted,
          customMessage,
        }),
        signal: AbortSignal.timeout(10000),
      });
      n8nSent = res.ok;
    } catch (err) {
      this.logger.warn(`n8n progress reminder error: ${err instanceof Error ? err.message : err}`);
    }

    await this.notifications.create({
      userId: student.id,
      title: `📧 Nhắc nhở tiến độ học tập từ GV ${teacher.name} (${teacher.email})`,
      message: customMessage,
      type: 'warning',
    });

    return {
      sent: true,
      n8nSent,
      teacherEmail: teacher.email,
      studentEmail: student.email,
      studentName: student.name,
      attendedLessons,
      totalLessons,
      percentCompleted,
    };
  }
}
