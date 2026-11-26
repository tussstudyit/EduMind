import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { SubjectEntity } from '../subjects/subject.entity';
import { TopicEntity } from './topic.entity';
import { SaveTopicDto } from './dto/save-topic.dto';
import { UserEntity } from '../users/user.entity';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(TopicEntity) private readonly topics: Repository<TopicEntity>,
    @InjectRepository(SubjectEntity) private readonly subjects: Repository<SubjectEntity>,
  ) {}

  async findAll(user: UserEntity, subjectId?: string, includeHidden = false) {
    const qb = this.topics.createQueryBuilder('topic');
    if (subjectId) qb.andWhere('topic.subjectId = :subjectId', { subjectId });
    if (user.role !== 'admin' || !includeHidden) qb.andWhere('topic.isHidden = false');
    return qb.orderBy('topic.order', 'ASC').addOrderBy('topic.createdAt', 'ASC').getMany();
  }

  async findOne(id: string, user?: UserEntity) {
    const item = await this.topics.findOneBy({ id });
    if (!item) throw new NotFoundException('Chủ đề không tồn tại.');
    if (user?.role === 'student' && item.isHidden) throw new NotFoundException('Chủ đề không tồn tại.');
    return item;
  }

  async create(data: SaveTopicDto) {
    if (!data.subjectId || !data.name) throw new BadRequestException('Cần cung cấp môn học và tên chủ đề.');
    if (!(await this.subjects.findOneBy({ id: data.subjectId }))) throw new NotFoundException('Môn học không tồn tại.');
    return this.topics.save(this.topics.create({ ...data, id: data.id ?? createId('top'), description: data.description ?? '' }));
  }

  async update(id: string, data: SaveTopicDto) {
    const topic = await this.findOne(id);
    if (data.subjectId && !(await this.subjects.findOneBy({ id: data.subjectId }))) throw new NotFoundException('Môn học không tồn tại.');
    Object.assign(topic, data);
    return this.topics.save(topic);
  }

  async toggleHidden(id: string) {
    const topic = await this.findOne(id);
    topic.isHidden = !topic.isHidden;
    return this.topics.save(topic);
  }

  async remove(id: string) {
    const topic = await this.findOne(id);
    await this.topics.remove(topic);
    return { deleted: true };
  }
}
