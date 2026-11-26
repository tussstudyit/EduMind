import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { UserEntity } from '../users/user.entity';
import { SystemLogEntity } from './system-log.entity';

@Injectable()
export class AuditService {
  constructor(@InjectRepository(SystemLogEntity) private readonly logs: Repository<SystemLogEntity>) {}
  async write(action: string, details: string, actor?: UserEntity, level = 'info') {
    await this.logs.save(this.logs.create({
      id: createId('log'), action: action.slice(0, 200), details,
      actorId: actor?.id ?? null, actorName: actor?.name ?? 'System', actorRole: actor?.role ?? 'admin', level,
    }));
  }
}
