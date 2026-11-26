import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../../common/base-crud.service';
import { createId } from '../../common/create-id';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { SubjectEntity } from './subject.entity';
import { TopicEntity } from '../topics/topic.entity';
import { CourseEntity } from '../courses/course.entity';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class SubjectsService extends BaseCrudService<SubjectEntity> {
  constructor(
    @InjectRepository(SubjectEntity) private readonly subjects: Repository<SubjectEntity>,
    @InjectRepository(TopicEntity) private readonly topics: Repository<TopicEntity>,
    @InjectRepository(CourseEntity) private readonly courses: Repository<CourseEntity>,
  ) {
    super(subjects, 'Môn học');
  }

  async findSubjects(user: UserEntity, includeHidden = false) {
    const records = await this.subjects.createQueryBuilder('subject')
      .addSelect((qb) => qb.select('COUNT(*)').from(TopicEntity, 'topic').where('topic."subjectId" = subject.id'), 'topicCount')
      .addSelect((qb) => qb.select('COUNT(*)').from(CourseEntity, 'course').where('course."subjectId" = subject.id'), 'courseCount')
      .where(user.role === 'admin' && includeHidden ? '1 = 1' : 'subject.isHidden = false')
      .orderBy('subject.name', 'ASC')
      .getMany();
    return Promise.all(records.map(async (subject) => ({
      ...subject,
      topicCount: await this.topics.countBy({ subjectId: subject.id }),
      courseCount: await this.courses.countBy({ subjectId: subject.id }),
    })));
  }

  async getSubject(user: UserEntity, id: string) {
    const subject = await this.findOne(id);
    if (user.role !== 'admin' && subject.isHidden) throw new NotFoundException('Môn học không tồn tại.');
    return { ...subject, topicCount: await this.topics.countBy({ subjectId: id }), courseCount: await this.courses.countBy({ subjectId: id }) };
  }

  createSubject(data: CreateSubjectDto) {
    return this.create({ ...data, id: data.id ?? createId('sub'), iconName: data.iconName ?? 'book' });
  }

  async updateSubject(id: string, data: Partial<SubjectEntity>) {
    if (data.code && await this.subjects.findOneBy({ code: data.code })) {
      const existing = await this.subjects.findOneBy({ code: data.code });
      if (existing?.id !== id) throw new ConflictException('Mã môn học đã tồn tại.');
    }
    return this.update(id, data);
  }

  async toggleHidden(id: string) {
    const subject = await this.findOne(id);
    subject.isHidden = !subject.isHidden;
    return this.subjects.save(subject);
  }

  async removeSubject(id: string) {
    if (await this.courses.countBy({ subjectId: id })) throw new ForbiddenException('Không thể xóa môn học đang được khóa học sử dụng.');
    return this.remove(id);
  }
}
