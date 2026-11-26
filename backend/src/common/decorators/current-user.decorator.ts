import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../modules/users/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserEntity => context.switchToHttp().getRequest().user,
);
