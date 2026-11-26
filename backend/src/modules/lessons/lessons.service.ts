import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../../common/base-crud.service';
import { createId } from '../../common/create-id';
import { CourseEntity } from '../courses/course.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { UserEntity } from '../users/user.entity';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { LessonEntity } from './lesson.entity';

@Injectable()
export class LessonsService extends BaseCrudService<LessonEntity> {
  constructor(
    @InjectRepository(LessonEntity) private readonly lessons: Repository<LessonEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
  ) {
    super(lessons, 'Bài học');
  }

  findLessons(user: UserEntity, courseId?: string) {
    const query = this.lessons.createQueryBuilder('lesson');
    if (courseId) query.andWhere('lesson.courseId = :courseId', { courseId });
    if (user.role === 'teacher') {
      query.andWhere('lesson.courseId IN (SELECT c.id FROM courses c WHERE c."teacherId" = :teacherId)', { teacherId: user.id });
    }
    if (user.role === 'student') {
      query.innerJoin('courses', 'course', 'course.id = lesson."courseId" AND course.status = :published', {
        published: 'published',
      });
      query.andWhere('(lesson.status = :published OR (lesson.status IS NULL AND lesson."isPublished" = true))', {
        published: 'published',
      });
    }
    return query.orderBy('lesson.order', 'ASC').getMany();
  }

  private async assertCourseEditor(user: UserEntity, courseId: string) {
    const course = await this.courses.findOneBy({ id: courseId });
    if (!course) throw new NotFoundException('Khóa học không tồn tại.');
    if (user.role !== 'admin' && !(user.role === 'teacher' && course.teacherId === user.id)) {
      throw new ForbiddenException('Bạn không phụ trách khóa học này.');
    }
    return course;
  }

  async getLesson(user: UserEntity, id: string) {
    const lesson = await this.findOne(id);
    if (user.role === 'teacher') await this.assertCourseEditor(user, lesson.courseId);
    if (user.role === 'student') {
      const course = await this.courses.findOneBy({ id: lesson.courseId, status: 'published' });
      if (!course) throw new NotFoundException('Bài học không tồn tại.');
    }
    return lesson;
  }

  async createLesson(user: UserEntity, data: CreateLessonDto) {
    const course = await this.assertCourseEditor(user, data.courseId);
    const resolvedStatus = data.status ?? (data.isPublished === false ? 'draft' : 'published');
    const lesson = await this.create({
      ...data,
      id: data.id ?? createId('les'),
      description: data.description ?? '',
      order: data.order ?? (await this.lessons.countBy({ courseId: data.courseId })) + 1,
      durationMinutes: data.durationMinutes ?? 30,
      videoUrl: data.videoUrl ?? null,
      contentMarkdown: data.contentMarkdown ?? '',
      status: resolvedStatus,
      isPublished: resolvedStatus === 'published',
    });
    course.lessonCount = await this.lessons.countBy({ courseId: data.courseId });
    await this.courses.save(course);
    return lesson;
  }

  async updateLesson(user: UserEntity, id: string, data: Partial<LessonEntity>) {
    const lesson = await this.findOne(id);
    await this.assertCourseEditor(user, data.courseId ?? lesson.courseId);
    if (data.status !== undefined) {
      data.isPublished = data.status === 'published';
    } else if (data.isPublished !== undefined) {
      data.status = data.isPublished ? 'published' : 'draft';
    }
    return this.update(id, data);
  }

  async deleteLesson(user: UserEntity, id: string) {
    const lesson = await this.findOne(id);
    const courseId = lesson.courseId;
    await this.assertCourseEditor(user, courseId);
    const result = await this.remove(id);
    const course = await this.courses.findOneBy({ id: courseId });
    if (course) {
      course.lessonCount = await this.lessons.countBy({ courseId });
      await this.courses.save(course);
    }
    return result;
  }

  async reorder(user: UserEntity, courseId: string, lessonId: string, direction: 'up' | 'down') {
    await this.assertCourseEditor(user, courseId);
    const items = await this.lessons.find({ where: { courseId }, order: { order: 'ASC' } });
    const index = items.findIndex((item) => item.id === lessonId);
    if (index < 0) throw new NotFoundException('Bài học không thuộc khóa học này.');
    const otherIndex = index + (direction === 'up' ? -1 : 1);
    if (otherIndex < 0 || otherIndex >= items.length) throw new BadRequestException('Bài học đã ở đầu hoặc cuối danh sách.');
    [items[index].order, items[otherIndex].order] = [items[otherIndex].order, items[index].order];
    await this.lessons.save([items[index], items[otherIndex]]);
    return this.lessons.find({ where: { courseId }, order: { order: 'ASC' } });
  }
}
