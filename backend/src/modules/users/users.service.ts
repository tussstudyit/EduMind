import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { BaseCrudService } from '../../common/base-crud.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './user.entity';
import { hash } from 'bcryptjs';
import { AuditService } from '../admin/audit.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService extends BaseCrudService<UserEntity> {
  constructor(@InjectRepository(UserEntity) repository: Repository<UserEntity>, private readonly audit: AuditService) {
    super(repository, 'Người dùng');
  }

  async createUser(data: CreateUserDto) {
    const existing = await this.repository.findOneBy({ email: data.email.trim().toLowerCase() });
    if (existing) throw new ConflictException('Email này đã được sử dụng.');
    const { password, ...profile } = data;
    const user = await this.create({
      ...profile,
      id: data.id ?? createId('usr'),
      email: data.email.trim().toLowerCase(),
      role: data.role ?? 'student',
      status: data.status ?? 'active',
      avatar: data.avatar ?? '',
      phone: data.phone ?? '',
      institution: data.institution ?? '',
      department: data.department ?? '',
      bio: data.bio ?? '',
      passwordHash: await hash(password, 12),
    });
    user.passwordHash = null;
    return user;
  }

  findByEmail(email: string) {
    return this.repository.findOneBy({ email: email.trim().toLowerCase() });
  }

  findTeachers() {
    return this.repository.find({
      where: { role: 'teacher', status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }

  findCredentialsByEmail(email: string) {
    return this.repository.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email: email.trim() })
      .getOne();
  }

  findCredentialsById(id: string) {
    return this.repository.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }

  async createRegisteredUser(data: { email: string; name: string; passwordHash: string; role?: 'student' | 'teacher'; phone?: string; institution?: string; department?: string }) {
    const email = data.email.trim().toLowerCase();
    if (await this.repository.findOneBy({ email })) throw new ConflictException('Email này đã được sử dụng.');
    return this.repository.save(this.repository.create({
      id: createId('usr'), email, name: data.name.trim(), passwordHash: data.passwordHash,
      role: data.role ?? 'student', status: 'active', avatar: data.name.trim().split(/\s+/).at(-1)?.slice(0, 2).toUpperCase() ?? '',
      phone: data.phone ?? '', institution: data.institution ?? '', department: data.department ?? '', bio: '',
    }));
  }

  async setPassword(id: string, passwordHash: string) {
    const user = await this.findOne(id);
    await this.repository.update({ id }, { passwordHash });
    return user;
  }

  async updateUser(actor: UserEntity, id: string, data: UpdateUserDto) {
    if (data.email) {
      const existing = await this.repository.findOneBy({ email: data.email.trim().toLowerCase() });
      if (existing && existing.id !== id) throw new ConflictException('Email này đã được sử dụng.');
      data.email = data.email.trim().toLowerCase();
    }
    const updated = await this.update(id, data);
    await this.audit.write('user.updated', `Cập nhật tài khoản ${updated.email}.`, actor);
    return updated;
  }

  async removeUser(actor: UserEntity, id: string) {
    const target = await this.findOne(id);
    if (actor.id === id) throw new ConflictException('Admin không thể tự xóa tài khoản đang đăng nhập.');
    const result = await this.remove(id);
    await this.audit.write('user.deleted', `Xóa tài khoản ${target.email}.`, actor, 'warn');
    return result;
  }

  async resetUserPassword(actor: UserEntity, id: string, password: string) {
    await this.findOne(id);
    await this.repository.update({ id }, { passwordHash: await hash(password, 12) });
    await this.audit.write('user.password_reset', `Admin đặt lại mật khẩu cho tài khoản ${id}.`, actor, 'warn');
    return { reset: true };
  }
}
