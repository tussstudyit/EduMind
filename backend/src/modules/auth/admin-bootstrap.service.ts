import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminBootstrapService.name);
  constructor(private readonly config: ConfigService, private readonly users: UsersService) {}

  async onApplicationBootstrap() {
    const email = this.config.get<string>('BOOTSTRAP_ADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('BOOTSTRAP_ADMIN_PASSWORD');
    if (!email && !password) return;
    if (!email || !password || password.length < 8) {
      this.logger.warn('Bỏ qua tạo admin ban đầu: cần cấu hình cả BOOTSTRAP_ADMIN_EMAIL và mật khẩu tối thiểu 8 ký tự.');
      return;
    }
    if (await this.users.findByEmail(email)) return;
    const name = this.config.get<string>('BOOTSTRAP_ADMIN_NAME', 'EduMind Administrator');
    await this.users.createUser({ email, name, password, role: 'admin', status: 'active' });
    this.logger.log(`Đã tạo tài khoản admin ban đầu ${email}.`);
  }
}
