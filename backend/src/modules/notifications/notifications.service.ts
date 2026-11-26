import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { UserEntity } from '../users/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationEntity } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity) private readonly notifications: Repository<NotificationEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}
  list(user: UserEntity) { return this.notifications.find({ where: { userId: user.id }, order: { createdAt: 'DESC' } }); }
  async create(data: CreateNotificationDto) {
    if (!(await this.users.findOneBy({ id: data.userId }))) throw new NotFoundException('Người nhận thông báo không tồn tại.');
    return this.notifications.save(this.notifications.create({ ...data, id: createId('ntf'), type: data.type ?? 'info', isRead: false, link: data.link ?? null }));
  }
  private async own(user: UserEntity, id: string) {
    const item = await this.notifications.findOneBy({ id });
    if (!item) throw new NotFoundException('Thông báo không tồn tại.');
    if (user.role !== 'admin' && item.userId !== user.id) throw new ForbiddenException('Bạn không có quyền truy cập thông báo này.');
    return item;
  }
  async markRead(user: UserEntity, id: string) { const item = await this.own(user, id); item.isRead = true; return this.notifications.save(item); }
  async markAllRead(user: UserEntity) { await this.notifications.update({ userId: user.id, isRead: false }, { isRead: true }); return { updated: true }; }
  async remove(user: UserEntity, id: string) { const item = await this.own(user, id); await this.notifications.remove(item); return { deleted: true }; }
}
