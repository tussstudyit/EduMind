import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { access, readdir, unlink } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { CourseEntity } from '../courses/course.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { UserEntity } from '../users/user.entity';
import { MaterialEntity } from './material.entity';
import { SaveMaterialDto } from './dto/save-material.dto';
import { COURSE_FILE_DIRECTORY, UploadedCourseFile } from './course-file-storage';

const COURSE_FILE_PREFIX = 'course-file://';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(MaterialEntity) private readonly materials: Repository<MaterialEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
    @InjectRepository(LessonEntity) private readonly lessons: Repository<LessonEntity>,
    @InjectRepository(EnrollmentEntity) private readonly enrollments: Repository<EnrollmentEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async list(user: UserEntity, courseId?: string, lessonId?: string) {
    const qb = this.materials.createQueryBuilder('material');
    if (courseId) qb.andWhere('material.courseId = :courseId', { courseId });
    if (lessonId) qb.andWhere('material.lessonId = :lessonId', { lessonId });
    if (user.role === 'student') {
      if (courseId) {
        qb.innerJoin('courses', 'course', 'course.id = material."courseId" AND course.status = :published', {
          published: 'published',
        });
      } else {
        const enrollments = await this.enrollments.find({ where: { studentId: user.id, status: 'active' } });
        const courseIds = enrollments.map((e) => e.courseId);
        if (!courseIds.length) return [];
        qb.andWhere('material.courseId IN (:...courseIds)', { courseIds });
        qb.innerJoin('courses', 'course', 'course.id = material."courseId" AND course.status = :published', {
          published: 'published',
        });
      }
    } else if (user.role === 'teacher') {
      qb.andWhere('material.courseId IN (SELECT c.id FROM courses c WHERE c."teacherId" = :teacherId)', {
        teacherId: user.id,
      });
    }
    return qb.orderBy('material.uploadedAt', 'DESC').getMany();
  }

  private async ensureTeacherAccess(user: UserEntity, courseId: string, lessonId: string) {
    const course = await this.courses.findOneBy({ id: courseId });
    if (!course) throw new NotFoundException('Khóa học không tồn tại.');
    if (user.role !== 'admin' && !(user.role === 'teacher' && course.teacherId === user.id)) {
      throw new ForbiddenException('Bạn không phụ trách khóa học này.');
    }
    const lesson = await this.lessons.findOneBy({ id: lessonId, courseId });
    if (!lesson) throw new NotFoundException('Bài học không thuộc khóa học đã chọn.');
  }

  async getActiveUser(userId: string) {
    const user = await this.users.findOneBy({ id: userId });
    if (!user || user.status !== 'active') throw new ForbiddenException('Tài khoản không còn quyền xem video.');
    return user;
  }

  async registerUploadedFile(
    user: UserEntity,
    materialId: string,
    file: UploadedCourseFile,
    courseId: string,
    lessonId: string,
  ) {
    if (file.filename.split('.')[0] !== materialId) throw new BadRequestException('Mã tệp không khớp.');
    const existing = await this.materials.findOneBy({ id: materialId });
    const targetCourseId = courseId || existing?.courseId || '';
    const targetLessonId = lessonId || existing?.lessonId || '';
    if (!targetCourseId || !targetLessonId) {
      throw new BadRequestException('Cần chọn khóa học và bài học trước khi tải tệp.');
    }

    if (user.role === 'student') {
      if (!existing) {
        throw new ForbiddenException('Chỉ giảng viên mới được tải lên tệp mới.');
      }
    } else {
      await this.ensureTeacherAccess(user, targetCourseId, targetLessonId);
    }

    const fileUrl = `${COURSE_FILE_PREFIX}${file.filename}`;
    if (existing && existing.fileUrl !== fileUrl) {
      existing.fileUrl = fileUrl;
      await this.materials.save(existing);
      await this.syncLessonPrimaryVideo(existing.lessonId, existing.fileType, fileUrl);
    }
    return { fileUrl };
  }

  async getFile(user: UserEntity, materialId: string) {
    const material = await this.materials.findOneBy({ id: materialId });
    if (!material) throw new NotFoundException('Không tìm thấy tệp của khóa học.');

    const course = await this.courses.findOneBy({ id: material.courseId });
    if (!course) throw new NotFoundException('Khóa học không tồn tại.');
    if (user.role === 'student') {
      const enrollment = await this.enrollments.findOneBy({ studentId: user.id, courseId: course.id, status: 'active' });
      if (course.status !== 'published' || !enrollment) {
        throw new ForbiddenException('Bạn cần ghi danh khóa học đã xuất bản để xem tệp này.');
      }
    } else if (user.role !== 'admin' && !(user.role === 'teacher' && course.teacherId === user.id)) {
      throw new ForbiddenException('Bạn không được xem tệp của khóa học này.');
    }

    if (!material.fileUrl.startsWith(COURSE_FILE_PREFIX)) {
      throw new NotFoundException('Tệp này chưa được lưu trên máy chủ.');
    }
    let storageName = material.fileUrl.slice(COURSE_FILE_PREFIX.length);
    if (!storageName || basename(storageName) !== storageName) {
      throw new NotFoundException('Đường dẫn tệp không hợp lệ.');
    }
    let filePath = join(COURSE_FILE_DIRECTORY, storageName);
    const existsDirectly = await access(filePath).then(() => true).catch(() => false);
    if (!existsDirectly || !storageName.startsWith(`${material.id}.`)) {
      const filesOnDisk = await readdir(COURSE_FILE_DIRECTORY).catch(() => [] as string[]);
      const matched = filesOnDisk.find((f) => f === `${material.id}` || f.startsWith(`${material.id}.`));
      if (!matched) {
        throw new NotFoundException('Tệp chưa được đồng bộ lên máy chủ.');
      }
      storageName = matched;
      filePath = join(COURSE_FILE_DIRECTORY, storageName);
      const nextUrl = `${COURSE_FILE_PREFIX}${storageName}`;
      if (material.fileUrl !== nextUrl) {
        material.fileUrl = nextUrl;
        await this.materials.save(material);
      }
    }
    const ext = extname(storageName) || (material.fileType === 'video' ? '.mp4' : '');
    return {
      path: filePath,
      storageName,
      fileName: material.title.endsWith(ext) ? material.title : `${material.title}${ext}`,
    };
  }

  private async syncLessonPrimaryVideo(lessonId: string, fileType?: string, fileUrl?: string) {
    if (fileType !== 'video' || !fileUrl) return;
    const lesson = await this.lessons.findOneBy({ id: lessonId });
    if (lesson && (!lesson.videoUrl || lesson.videoUrl.startsWith(COURSE_FILE_PREFIX))) {
      lesson.videoUrl = fileUrl;
      await this.lessons.save(lesson);
    }
  }

  async create(user: UserEntity, data: SaveMaterialDto) {
    if (!data.courseId || !data.lessonId || !data.title || !data.fileUrl) {
      throw new NotFoundException('Cần cung cấp khóa học, bài học, tiêu đề và đường dẫn tệp.');
    }
    await this.ensureTeacherAccess(user, data.courseId, data.lessonId);
    const saved = await this.materials.save(
      this.materials.create({
        ...data,
        id: data.id ?? createId('mat'),
        description: data.description ?? '',
        fileType: data.fileType ?? 'pdf',
        fileSize: data.fileSize ?? '',
      }),
    );
    await this.syncLessonPrimaryVideo(saved.lessonId, saved.fileType, saved.fileUrl);
    return saved;
  }

  async update(user: UserEntity, id: string, data: SaveMaterialDto) {
    const item = await this.materials.findOneBy({ id });
    if (!item) throw new NotFoundException('Tài liệu không tồn tại.');
    await this.ensureTeacherAccess(user, data.courseId ?? item.courseId, data.lessonId ?? item.lessonId);
    const oldFileUrl = item.fileUrl;
    if (data.courseId !== undefined) item.courseId = data.courseId;
    if (data.lessonId !== undefined) item.lessonId = data.lessonId;
    if (data.title !== undefined) item.title = data.title;
    if (data.description !== undefined) item.description = data.description;
    if (data.fileType !== undefined) item.fileType = data.fileType;
    if (data.fileUrl !== undefined) item.fileUrl = data.fileUrl;
    if (data.fileSize !== undefined) item.fileSize = data.fileSize;
    const saved = await this.materials.save(item);
    if (oldFileUrl !== saved.fileUrl && oldFileUrl && !saved.fileUrl.startsWith(oldFileUrl)) {
      await this.removeStoredFile(oldFileUrl);
    }
    await this.syncLessonPrimaryVideo(saved.lessonId, saved.fileType, saved.fileUrl);
    return saved;
  }

  async remove(user: UserEntity, id: string) {
    const item = await this.materials.findOneBy({ id });
    if (!item) throw new NotFoundException('Tài liệu không tồn tại.');
    await this.ensureTeacherAccess(user, item.courseId, item.lessonId);
    await this.materials.remove(item);
    await this.removeStoredFile(item.fileUrl);
    return { deleted: true };
  }

  private async removeStoredFile(fileUrl?: string) {
    if (!fileUrl?.startsWith(COURSE_FILE_PREFIX)) return;
    const storageName = fileUrl.slice(COURSE_FILE_PREFIX.length);
    if (!storageName || basename(storageName) !== storageName) return;
    await unlink(join(COURSE_FILE_DIRECTORY, storageName)).catch(() => undefined);
  }
}
