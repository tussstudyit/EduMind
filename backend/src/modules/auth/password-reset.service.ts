import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { MoreThan, Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { AuditService } from '../admin/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserEntity } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { PasswordResetRequestEntity } from './password-reset-request.entity';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { hash } from 'bcryptjs';

const GENERIC_REQUEST_MESSAGE = 'Nếu email có tài khoản EduMind đang hoạt động, yêu cầu sẽ được chuyển đến quản trị viên để xử lý.';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PasswordResetRequestEntity) private readonly requests: Repository<PasswordResetRequestEntity>,
    @InjectRepository(PasswordResetTokenEntity) private readonly tokens: Repository<PasswordResetTokenEntity>,
    @InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async requestReset(emailInput: string) {
    const email = emailInput.trim().toLowerCase();
    const user = await this.users.findByEmail(email);
    if (!user || user.status !== 'active') return { message: GENERIC_REQUEST_MESSAGE };

    const recentCutoff = new Date(Date.now() - 15 * 60 * 1000);
    const recent = await this.requests.findOne({ where: { userId: user.id, requestedAt: MoreThan(recentCutoff) } });
    if (recent) return { message: GENERIC_REQUEST_MESSAGE };

    const request = await this.requests.save(this.requests.create({
      id: createId('prq'), userId: user.id, email: user.email, name: user.name,
      status: 'pending', sentAt: null, completedAt: null,
    }));
    const admins = await this.usersRepository.findBy({ role: 'admin', status: 'active' });
    await Promise.all(admins.map((admin) => this.notifications.create({
      userId: admin.id,
      title: 'Yêu cầu khôi phục mật khẩu',
      message: `${user.name} (${user.email}) đã gửi yêu cầu đặt lại mật khẩu.`,
      type: 'warning',
      link: 'admin_users',
    })));
    await this.audit.write('auth.password_reset_requested', `Tạo yêu cầu khôi phục mật khẩu ${request.id}.`);
    return { message: GENERIC_REQUEST_MESSAGE };
  }

  listRequests() {
    return this.requests.find({ order: { requestedAt: 'DESC' }, take: 100 });
  }

  async sendResetLink(requestId: string, actor: UserEntity) {
    const request = await this.requests.findOneBy({ id: requestId });
    if (!request) throw new NotFoundException('Không tìm thấy yêu cầu khôi phục mật khẩu.');
    if (request.status === 'completed') throw new BadRequestException('Yêu cầu này đã được hoàn tất.');

    const webhookUrl = this.config.get<string>('N8N_PASSWORD_RESET_WEBHOOK_URL')?.trim();
    const webhookSecret = this.config.get<string>('N8N_WEBHOOK_SECRET')?.trim();
    if (!webhookUrl || !webhookSecret) {
      throw new ServiceUnavailableException('Chưa cấu hình webhook và khóa bảo mật của n8n.');
    }

    const user = await this.users.findOne(request.userId);
    if (user.status !== 'active') throw new BadRequestException('Tài khoản này không còn hoạt động.');

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 30 * 60 * 1000);
    const resetToken = await this.tokens.save(this.tokens.create({
      id: createId('prt'), tokenHash, userId: user.id, requestId: request.id, expiresAt: expiry, usedAt: null,
    }));
    const frontendOrigin = this.config.get<string>('FRONTEND_ORIGIN', 'http://localhost:3000').replace(/\/$/, '');
    const resetLink = `${frontendOrigin}/reset-password?token=${encodeURIComponent(rawToken)}`;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-EduMind-Webhook-Secret': webhookSecret },
        body: JSON.stringify({ email: user.email, name: user.name, resetLink, expiresInMinutes: 30, requestId: request.id }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`n8n returned HTTP ${response.status}`);
    } catch (error) {
      resetToken.usedAt = new Date();
      await this.tokens.save(resetToken);
      this.logger.error(`n8n failed to deliver password reset for request ${request.id}.`, error instanceof Error ? error.stack : undefined);
      throw new ServiceUnavailableException('n8n chưa gửi được email. Hãy kiểm tra workflow và thông tin SMTP rồi thử lại.');
    }

    await this.tokens.createQueryBuilder()
      .update(PasswordResetTokenEntity)
      .set({ usedAt: new Date() })
      .where('"userId" = :userId', { userId: user.id })
      .andWhere('"usedAt" IS NULL')
      .andWhere('"id" <> :currentId', { currentId: resetToken.id })
      .execute();
    request.status = 'sent';
    request.sentAt = new Date();
    await this.requests.save(request);
    await this.audit.write('auth.password_reset_email_sent', `Admin gửi email khôi phục cho yêu cầu ${request.id}.`, actor);
    return { sent: true, requestId: request.id };
  }

  async completeReset(token: string, password: string) {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const passwordHash = await hash(password, 12);
    const user = await this.tokens.manager.transaction(async (manager) => {
      const tokenRepository = manager.getRepository(PasswordResetTokenEntity);
      const record = await tokenRepository.createQueryBuilder('token')
        .setLock('pessimistic_write')
        .where('token.tokenHash = :tokenHash', { tokenHash })
        .getOne();
      if (!record || record.usedAt !== null || record.expiresAt.getTime() <= Date.now()) {
        throw new BadRequestException('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      }

      const userRepository = manager.getRepository(UserEntity);
      const resetUser = await userRepository.findOneBy({ id: record.userId });
      if (!resetUser || resetUser.status !== 'active') {
        throw new BadRequestException('Tài khoản này không còn hoạt động.');
      }

      await userRepository.update(resetUser.id, { passwordHash });
      record.usedAt = new Date();
      await tokenRepository.save(record);
      await tokenRepository.createQueryBuilder()
        .update(PasswordResetTokenEntity)
        .set({ usedAt: new Date() })
        .where('"userId" = :userId', { userId: resetUser.id })
        .andWhere('"usedAt" IS NULL')
        .execute();
      await manager.getRepository(PasswordResetRequestEntity).update(
        { id: record.requestId },
        { status: 'completed', completedAt: new Date() },
      );
      return resetUser;
    });
    await this.audit.write('auth.password_reset_completed', 'Người dùng hoàn tất đặt lại mật khẩu.', user);
    return { changed: true };
  }
}
