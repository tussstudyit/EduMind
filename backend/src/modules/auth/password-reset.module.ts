import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SecurityModule } from '../../common/security.module';
import { AdminModule } from '../admin/admin.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UserEntity } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetRequestEntity } from './password-reset-request.entity';
import { PasswordResetTokenEntity } from './password-reset-token.entity';
import { PasswordResetService } from './password-reset.service';

@Module({
  imports: [
    SecurityModule,
    UsersModule,
    AdminModule,
    NotificationsModule,
    TypeOrmModule.forFeature([UserEntity, PasswordResetRequestEntity, PasswordResetTokenEntity]),
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService, RolesGuard],
})
export class PasswordResetModule {}
