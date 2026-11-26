import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../../common/base-crud.service';
import { createId } from '../../common/create-id';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseEntity } from './course.entity';
import { CourseReportEntity } from './course-report.entity';
import { TeacherReviewEntity } from './teacher-review.entity';
import { UserEntity } from '../users/user.entity';
import { SubjectEntity } from '../subjects/subject.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { MaterialEntity } from '../materials/material.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { ProgressEntity } from '../progress/progress.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CoursesService extends BaseCrudService<CourseEntity> {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
    @InjectRepository(CourseReportEntity) private readonly reports: Repository<CourseReportEntity>,
    @InjectRepository(TeacherReviewEntity) private readonly reviews: Repository<TeacherReviewEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
    @InjectRepository(SubjectEntity) private readonly subjects: Repository<SubjectEntity>,
    @InjectRepository(LessonEntity) private readonly lessons: Repository<LessonEntity>,
    @InjectRepository(MaterialEntity) private readonly materials: Repository<MaterialEntity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
    @InjectRepository(ProgressEntity) private readonly progress: Repository<ProgressEntity>,
    private readonly notifications: NotificationsService,
  ) {
    super(courses, 'Khóa học');
  }

  private async triggerN8nWebhook(path: string, payload: Record<string, unknown>): Promise<boolean> {
    const baseUrl = this.config.get<string>('N8N_BASE_URL', 'http://n8n:5678').replace(/\/$/, '');
    try {
      const res = await fetch(`${baseUrl}/webhook/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      return res.ok;
    } catch (err) {
      this.logger.warn(`n8n webhook /webhook/${path} unreachable or timed out: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }

  private async resolveSubject(subjectId?: string, subjectName?: string): Promise<{ subjectId: string; subjectName: string }> {
    const cleanName = (subjectName || '').trim();
    const cleanId = (subjectId || '').trim();

    if (cleanId) {
      const byId = await this.subjects.findOneBy({ id: cleanId });
      if (byId) {
        return { subjectId: byId.id, subjectName: cleanName || byId.name };
      }
    }

    if (cleanName) {
      const byName = await this.subjects
        .createQueryBuilder('subject')
        .where('LOWER(subject.name) = LOWER(:name) OR LOWER(subject.code) = LOWER(:name)', { name: cleanName })
        .getOne();
      if (byName) {
        return { subjectId: byName.id, subjectName: byName.name };
      }

      const baseCode = cleanName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '')
        .slice(0, 6) || 'SUB';
      const code = `${baseCode}${Math.floor(100 + Math.random() * 900)}`;
      const created = await this.subjects.save(
        this.subjects.create({
          id: createId('sub'),
          code,
          name: cleanName,
          description: `Môn học ${cleanName}`,
          iconName: 'book',
          isHidden: false,
        }),
      );
      return { subjectId: created.id, subjectName: created.name };
    }

    return { subjectId: cleanId || 'subject-general', subjectName: cleanName || 'Chưa phân môn' };
  }

  async findCourses(user: UserEntity, filters: { subjectId?: string; status?: string }) {
    const query = this.courses.createQueryBuilder('course');
    if (filters.subjectId) query.andWhere('course.subjectId = :subjectId', filters);
    if (user.role === 'student') {
      query.andWhere('course.status = :published', { published: 'published' });
      query.andWhere(
        'NOT EXISTS (SELECT 1 FROM subjects s WHERE s.id = course."subjectId" AND s."isHidden" = true)',
      );
    }
    if (user.role === 'teacher') query.andWhere('course.teacherId = :teacherId', { teacherId: user.id });
    if (filters.status && user.role !== 'student') query.andWhere('course.status = :status', filters);
    const list = await query.orderBy('course.createdAt', 'DESC').getMany();

    const allReviews = await this.reviews.find();
    const allReports = await this.reports.find({ where: { status: 'pending' } });

    return Promise.all(
      list.map(async (course) => {
        const teacherRevs = allReviews.filter((r) => r.teacherId === course.teacherId || r.courseId === course.id);
        const avgRating =
          teacherRevs.length > 0
            ? Number((teacherRevs.reduce((sum, r) => sum + Number(r.rating), 0) / teacherRevs.length).toFixed(1))
            : 5.0;
        const pendingReportCount = allReports.filter((rep) => rep.courseId === course.id).length;

        return {
          ...course,
          lessonCount: await this.lessons.countBy({ courseId: course.id }),
          enrolledCount: await this.enrollments.countBy({ courseId: course.id, status: 'active' }),
          averageRating: avgRating,
          reviewCount: teacherRevs.length,
          pendingReportCount,
        };
      }),
    );
  }

  async getCourse(user: UserEntity, id: string) {
    const course = await this.findOne(id);
    if (user.role === 'student' && course.status !== 'published') throw new NotFoundException('Khóa học không tồn tại.');
    if (user.role === 'teacher' && course.teacherId !== user.id) throw new ForbiddenException('Bạn không phụ trách khóa học này.');
    const teacherRevs = await this.reviews.find({ where: [{ courseId: course.id }, { teacherId: course.teacherId }] });
    const avgRating =
      teacherRevs.length > 0
        ? Number((teacherRevs.reduce((sum, r) => sum + Number(r.rating), 0) / teacherRevs.length).toFixed(1))
        : 5.0;
    return {
      ...course,
      lessonCount: await this.lessons.countBy({ courseId: course.id }),
      enrolledCount: await this.enrollments.countBy({ courseId: course.id, status: 'active' }),
      averageRating: avgRating,
      reviewCount: teacherRevs.length,
    };
  }

  async createCourse(user: UserEntity, data: CreateCourseDto) {
    if (user.role === 'teacher') {
      data = { ...data, teacherId: user.id, teacherName: user.name };
    } else if (!data.teacherId) {
      data = { ...data, teacherId: user.id, teacherName: user.name };
    }
    const resolvedSubject = await this.resolveSubject(data.subjectId, data.subjectName);
    const badgeDefault =
      data.badgeMark?.trim() ||
      resolvedSubject.subjectName
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 3) ||
      'EDU';

    return this.create({
      ...data,
      id: data.id ?? createId('course'),
      subjectId: resolvedSubject.subjectId,
      subjectName: resolvedSubject.subjectName,
      level: data.level ?? 'beginner',
      status: data.status ?? 'draft',
      tone: data.tone ?? 'lavender',
      badgeMark: badgeDefault,
      durationHours: data.durationHours ?? 24,
      lessonCount: data.lessonCount ?? 0,
      enrolledCount: 0,
    });
  }

  async updateCourse(user: UserEntity, id: string, data: Partial<CourseEntity>) {
    const course = await this.findOne(id);
    if (user.role !== 'admin' && !(user.role === 'teacher' && course.teacherId === user.id)) {
      throw new ForbiddenException('Bạn không được phân công khóa học này.');
    }
    if (user.role === 'teacher') {
      delete data.teacherId;
      delete data.teacherName;
    }
    if (data.subjectName || data.subjectId) {
      const resolved = await this.resolveSubject(data.subjectId ?? course.subjectId, data.subjectName ?? course.subjectName);
      data.subjectId = resolved.subjectId;
      data.subjectName = resolved.subjectName;
    }
    const updated = await this.update(id, data);
    if (data.title && data.title !== course.title) {
      await this.enrollments.update({ courseId: id }, { courseTitle: data.title });
    }
    return updated;
  }

  async deleteCourse(user: UserEntity, id: string) {
    const course = await this.findOne(id);
    if (user.role !== 'admin' && !(user.role === 'teacher' && course.teacherId === user.id)) {
      throw new ForbiddenException('Bạn không được phân công khóa học này.');
    }
    await this.materials.delete({ courseId: id });
    await this.lessons.delete({ courseId: id });
    await this.enrollments.delete({ courseId: id });
    await this.progress.delete({ courseId: id });
    await this.reports.delete({ courseId: id });
    await this.reviews.delete({ courseId: id });
    return this.remove(id);
  }

  // --------------------------------------------------------------------------
  // COURSE VIOLATION REPORTS (SV <-> n8n <-> ADMIN)
  // --------------------------------------------------------------------------
  async listReports(user: UserEntity, courseId?: string) {
    const qb = this.reports.createQueryBuilder('rep');
    if (courseId) qb.andWhere('rep.courseId = :courseId', { courseId });
    if (user.role === 'student') {
      qb.andWhere('rep.reporterId = :reporterId', { reporterId: user.id });
    } else if (user.role === 'teacher') {
      qb.andWhere('rep.teacherId = :teacherId', { teacherId: user.id });
    }
    return qb.orderBy('rep.createdAt', 'DESC').getMany();
  }

  async submitReport(user: UserEntity, courseId: string, body: { reason: string; details?: string }) {
    const course = await this.findOne(courseId);
    if (!body.reason?.trim()) throw new BadRequestException('Vui lòng chọn hoặc nhập lý do báo cáo vi phạm.');

    const admins = await this.users.findBy({ role: 'admin', status: 'active' });
    const adminEmail = admins[0]?.email || 'edumind1905@gmail.com';

    const n8nSynced = await this.triggerN8nWebhook('edumind-course-report', {
      eventType: 'student_reported_violation',
      courseId: course.id,
      courseTitle: course.title,
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      reporterId: user.id,
      reporterName: user.name,
      reporterEmail: user.email,
      reason: body.reason.trim(),
      details: body.details?.trim() || '',
      courseStatus: course.status,
      notifyEmail: adminEmail,
    });

    const report = await this.reports.save(
      this.reports.create({
        id: createId('rep'),
        courseId: course.id,
        courseTitle: course.title,
        teacherId: course.teacherId,
        teacherName: course.teacherName,
        reporterId: user.id,
        reporterName: user.name,
        reporterEmail: user.email,
        reason: body.reason.trim(),
        details: body.details?.trim() || '',
        status: 'pending',
        adminActionNote: '',
        n8nSynced,
        resolvedAt: null,
      }),
    );

    await Promise.all(
      admins.map((admin) =>
        this.notifications.create({
          userId: admin.id,
          title: '🚨 Báo cáo vi phạm khóa học (n8n)',
          message: `Sinh viên ${user.name} đã báo cáo khóa học "${course.title}": ${report.reason}.`,
          type: 'warning',
          link: 'admin_courses',
        }),
      ),
    );

    return report;
  }

  async moderateReport(
    admin: UserEntity,
    reportId: string,
    body: {
      action: 'temporarily_locked' | 'permanently_locked' | 'unlock' | 'dismissed';
      adminActionNote?: string;
    },
  ) {
    const report = await this.reports.findOneBy({ id: reportId });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo vi phạm.');
    const course = await this.courses.findOneBy({ id: report.courseId });

    let nextCourseStatus = course?.status || 'published';
    if (body.action === 'temporarily_locked') nextCourseStatus = 'hidden';
    else if (body.action === 'permanently_locked') nextCourseStatus = 'archived';
    else if (body.action === 'unlock') nextCourseStatus = 'published';

    if (course && course.status !== nextCourseStatus) {
      course.status = nextCourseStatus;
      await this.courses.save(course);
    }

    report.status = body.action === 'unlock' ? 'dismissed' : body.action;
    report.adminActionNote =
      body.adminActionNote?.trim() ||
      (body.action === 'temporarily_locked'
        ? 'Admin đã tạm khóa khóa học để kiểm tra nội dung.'
        : body.action === 'permanently_locked'
        ? 'Admin đã khóa vĩnh viễn khóa học do vi phạm quy định.'
        : body.action === 'unlock'
        ? 'Admin đã mở khóa lại khóa học.'
        : 'Admin đã xác minh khóa học không vi phạm.');
    report.resolvedAt = new Date();

    const n8nSynced = await this.triggerN8nWebhook('edumind-course-report', {
      eventType: `admin_${body.action}`,
      reportId: report.id,
      courseId: report.courseId,
      courseTitle: report.courseTitle,
      courseStatus: nextCourseStatus,
      reason: `${report.reason} — Quyết định của Admin: ${report.adminActionNote}`,
      notifyEmail: report.reporterEmail || 'edumind1905@gmail.com',
    });
    report.n8nSynced = n8nSynced;
    const saved = await this.reports.save(report);

    // Gửi thông báo cho Sinh viên báo cáo và Giảng viên phụ trách
    await this.notifications.create({
      userId: report.reporterId,
      title: 'Phản hồi báo cáo khóa học từ Admin (n8n)',
      message: `Báo cáo khóa học "${report.courseTitle}" đã được xử lý: ${report.adminActionNote}`,
      type: 'info',
    });

    if (report.teacherId) {
      await this.notifications.create({
        userId: report.teacherId,
        title:
          body.action === 'temporarily_locked'
            ? '⚠️ Khóa học của bạn đã bị Tạm khóa'
            : body.action === 'permanently_locked'
            ? '🔒 Khóa học của bạn đã bị Khóa'
            : 'ℹ️ Cập nhật trạng thái kiểm duyệt khóa học',
        message: `Khóa học "${report.courseTitle}": ${report.adminActionNote} (Bởi ${admin.name}).`,
        type: body.action.includes('locked') ? 'warning' : 'info',
      });
    }

    return { report: saved, courseStatus: nextCourseStatus };
  }

  // --------------------------------------------------------------------------
  // TEACHER STAR REVIEWS & n8n AGGREGATION (SV -> n8n -> GV PROFILE)
  // --------------------------------------------------------------------------
  async listReviews(teacherId?: string, courseId?: string) {
    const qb = this.reviews.createQueryBuilder('rev');
    if (teacherId) qb.andWhere('rev.teacherId = :teacherId', { teacherId });
    if (courseId) qb.andWhere('rev.courseId = :courseId', { courseId });
    const list = await qb.orderBy('rev.createdAt', 'DESC').getMany();

    const total = list.length;
    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    for (const r of list) {
      const s = Math.min(5, Math.max(1, Number(r.rating) || 5));
      starCounts[s] = (starCounts[s] || 0) + 1;
      sum += s;
    }
    const averageRating = total > 0 ? Number((sum / total).toFixed(2)) : 5.0;
    const badge =
      averageRating >= 4.7
        ? '🌟 Giảng viên Xuất sắc (Top Rated)'
        : averageRating >= 4.0
        ? '⭐ Giảng viên Đánh giá Tốt'
        : averageRating >= 3.0
        ? '👍 Giảng viên Đạt chuẩn'
        : '📋 Cần cải thiện chất lượng';

    return {
      reviews: list,
      summary: {
        averageRating,
        totalReviews: total,
        starCounts,
        badge,
        n8nAggregated: true,
      },
    };
  }

  async submitReview(
    user: UserEntity,
    body: { courseId?: string; teacherId?: string; rating: number; comment: string },
  ) {
    const rating = Math.min(5, Math.max(1, Math.round(Number(body.rating) || 5)));
    let course: CourseEntity | null = null;
    if (body.courseId) {
      course = await this.courses.findOneBy({ id: body.courseId });
    }
    const targetTeacherId = body.teacherId || course?.teacherId;
    if (!targetTeacherId) {
      throw new BadRequestException('Cần chọn giảng viên hoặc khóa học để gửi đánh giá.');
    }
    const teacher = await this.users.findOneBy({ id: targetTeacherId });

    let existing = await this.reviews.findOneBy({
      studentId: user.id,
      teacherId: targetTeacherId,
      courseId: course?.id || 'general',
    });

    if (existing) {
      existing.rating = rating;
      existing.comment = (body.comment || '').trim();
      existing = await this.reviews.save(existing);
    } else {
      existing = await this.reviews.save(
        this.reviews.create({
          id: createId('rev'),
          teacherId: targetTeacherId,
          teacherName: teacher?.name || course?.teacherName || 'Giảng viên',
          courseId: course?.id || 'general',
          courseTitle: course?.title || 'Đánh giá Giảng viên',
          studentId: user.id,
          studentName: user.name,
          studentAvatar: user.avatar || 'SV',
          rating,
          comment: (body.comment || '').trim(),
        }),
      );
    }

    const aggregated = await this.listReviews(targetTeacherId);

    // Gọi luồng n8n edumind-teacher-rating để tổng hợp trung bình sao lớn
    await this.triggerN8nWebhook('edumind-teacher-rating', {
      teacherId: targetTeacherId,
      teacherName: existing.teacherName,
      studentName: user.name,
      newRating: rating,
      comment: existing.comment,
      averageRating: aggregated.summary.averageRating,
      totalReviews: aggregated.summary.totalReviews,
      starCounts: aggregated.summary.starCounts,
      badge: aggregated.summary.badge,
    });

    await this.notifications.create({
      userId: targetTeacherId,
      title: `⭐ Đánh giá mới (${rating} sao) từ ${user.name}`,
      message: `${user.name} đã đánh giá ${rating}/5⭐: "${existing.comment || 'Không có lời nhắn'}". Điểm trung bình sao lớn hiện tại (n8n): ${aggregated.summary.averageRating}/5.0⭐.`,
      type: 'success',
    });

    return {
      review: existing,
      summary: aggregated.summary,
    };
  }
}
