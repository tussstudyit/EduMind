import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuditService } from '../admin/audit.service';

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService, private readonly jwt: JwtService, private readonly audit: AuditService) {}

  async register(data: RegisterDto) {
    const user = await this.users.createRegisteredUser({
      ...data,
      passwordHash: await hash(data.password, 12),
    });
    await this.audit.write('auth.register', 'Người dùng đăng ký tài khoản.', user);
    return this.issueToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.users.findCredentialsByEmail(email);
    const valid = user?.passwordHash ? await compare(password, user.passwordHash) : false;
    if (!user || !valid || user.status !== 'active') {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }
    await this.audit.write('auth.login', 'Đăng nhập thành công.', user);
    return this.issueToken(user);
  }

  async getProfile(userId: string) {
    return this.users.findOne(userId);
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    return this.users.update(userId, data);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findCredentialsById(userId);
    if (!user?.passwordHash || !(await compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Mật khẩu hiện tại không chính xác.');
    }
    await this.users.setPassword(userId, await hash(newPassword, 12));
    await this.audit.write('auth.password_changed', 'Người dùng đổi mật khẩu.', await this.users.findOne(userId));
    return { changed: true };
  }

  private async issueToken(user: { id: string; email: string; role: string }) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    const { id, email, name, role, status, avatar, phone, institution, department, bio, createdAt, updatedAt } = user as any;
    return {
      accessToken,
      tokenType: 'Bearer',
      user: { id, email, name, role, status, avatar, phone, institution, department, bio, createdAt, updatedAt },
    };
  }
}
