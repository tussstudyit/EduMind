import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';

@Module({ imports: [SecurityModule, TypeOrmModule.forFeature([NotificationEntity, UserEntity])], controllers: [NotificationsController], providers: [NotificationsService, JwtAuthGuard, RolesGuard], exports: [NotificationsService] })
export class NotificationsModule {}
