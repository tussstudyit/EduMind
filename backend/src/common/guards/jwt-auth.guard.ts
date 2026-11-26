import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { UserEntity } from '../../modules/users/user.entity';
import { OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';

type AuthenticatedRequest = Request & { user?: UserEntity };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const isOptional = this.reflector.getAllAndOverride<boolean>(OPTIONAL_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      if (isOptional) {
        request.user = {
          id: 'guest',
          email: '',
          name: 'Chưa đăng nhập',
          avatar: '?',
          role: 'student',
          status: 'active',
        } as UserEntity;
        return true;
      }
      throw new UnauthorizedException('Cần đăng nhập để thực hiện thao tác này.');
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        ignoreExpiration: true,
      });
      if (!payload.sub) throw new Error('Token thiếu subject.');
      const user = await this.users.findOneBy({ id: payload.sub });
      if (!user || user.status !== 'active') throw new Error('Tài khoản không hoạt động.');
      request.user = user;
      return true;
    } catch {
      if (isOptional) {
        request.user = {
          id: 'guest',
          email: '',
          name: 'Chưa đăng nhập',
          avatar: '?',
          role: 'student',
          status: 'active',
        } as UserEntity;
        return true;
      }
      throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
    }
  }
}
