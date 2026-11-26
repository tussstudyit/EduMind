import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../../common/base-crud.service';
import { createId } from '../../common/create-id';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentEntity } from './enrollment.entity';
import { UserEntity } from '../users/user.entity';
import { CourseEntity } from '../courses/course.entity';

@Injectable()
export class EnrollmentsService extends BaseCrudService<EnrollmentEntity> {
  constructor(
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
  ) {
    super(enrollments, 'Ghi danh');
  }

  findEnrollments(user: UserEntity, studentId?: string, courseId?: string) {
    const query = this.enrollments.createQueryBuilder('enrollment');
    if (user.role === 'student') query.andWhere('enrollment.studentId = :ownStudentId', { ownStudentId: user.id });
    else if (studentId) query.andWhere('enrollment.studentId = :studentId', { studentId });
    if (user.role === 'teacher') query.andWhere('enrollment.courseId IN (SELECT c.id FROM courses c WHERE c."teacherId" = :teacherId)', { teacherId: user.id });
    if (courseId) query.andWhere('enrollment.courseId = :courseId', { courseId });
    return query.orderBy('enrollment.enrolledAt', 'DESC').getMany();
  }

  async createEnrollment(user: UserEntity, data: CreateEnrollmentDto) {
    const course = await this.courses.findOneBy({ id: data.courseId });
    if (!course || (user.role === 'student' && course.status !== 'published')) throw new NotFoundException('Khóa học chưa tồn tại hoặc chưa mở đăng ký.');
    if (user.role === 'teacher' && course.teacherId !== user.id) throw new ForbiddenException('Bạn không phụ trách khóa học này.');
    const studentId = user.role === 'student' ? user.id : data.studentId;
    if (!studentId) throw new NotFoundException('Cần cung cấp học viên.');
    const existing = await this.enrollments.findOneBy({ studentId, courseId: course.id });
    if (existing) {
      if (existing.status === 'active') return existing;
      existing.status = 'active';
      existing.enrolledAt = new Date();
      course.enrolledCount += 1;
      await this.courses.save(course);
      return this.enrollments.save(existing);
    }
    const student = user.role === 'student' ? user : null;
    const enrollment = await this.create({
      id: createId('enr'), courseId: course.id, courseTitle: course.title, studentId,
      studentName: student?.name ?? data.studentName ?? '', studentAvatar: student?.avatar ?? data.studentAvatar ?? '',
      studentEmail: student?.email ?? data.studentEmail ?? '', status: 'active', progressPercent: 0, lastAccessedAt: new Date(),
    });
    course.enrolledCount += 1;
    await this.courses.save(course);
    return enrollment;
  }

  async getEnrollment(user: UserEntity, id: string) {
    const enrollment = await this.findOne(id);
    if (user.role === 'student' && enrollment.studentId !== user.id) throw new ForbiddenException('Không phải ghi danh của bạn.');
    if (user.role === 'teacher') {
      const course = await this.courses.findOneBy({ id: enrollment.courseId });
      if (!course || course.teacherId !== user.id) throw new ForbiddenException('Bạn không phụ trách khóa học này.');
    }
    return enrollment;
  }

  async drop(user: UserEntity, courseId: string) {
    const enrollment = await this.enrollments.findOneBy({ studentId: user.id, courseId });
    if (!enrollment) throw new NotFoundException('Bạn chưa ghi danh khóa học này.');
    if (enrollment.status !== 'active') return enrollment;
    enrollment.status = 'dropped';
    const course = await this.courses.findOneBy({ id: courseId });
    if (course) { course.enrolledCount = Math.max(0, course.enrolledCount - 1); await this.courses.save(course); }
    return this.enrollments.save(enrollment);
  }

  async updateEnrollment(user: UserEntity, id: string, data: Partial<EnrollmentEntity>) {
    const enrollment = await this.getEnrollment(user, id);
    if (user.role === 'student') throw new ForbiddenException('Không thể sửa trạng thái ghi danh trực tiếp.');
    const wasActive = enrollment.status === 'active';
    Object.assign(enrollment, data);
    const isActive = enrollment.status === 'active';
    if (wasActive !== isActive) {
      const course = await this.courses.findOneBy({ id: enrollment.courseId });
      if (course) {
        course.enrolledCount = Math.max(0, course.enrolledCount + (isActive ? 1 : -1));
        await this.courses.save(course);
      }
    }
    return this.enrollments.save(enrollment);
  }

  async removeEnrollment(id: string) {
    const enrollment = await this.findOne(id);
    if (enrollment.status === 'active') {
      const course = await this.courses.findOneBy({ id: enrollment.courseId });
      if (course) { course.enrolledCount = Math.max(0, course.enrolledCount - 1); await this.courses.save(course); }
    }
    return this.remove(id);
  }
}
