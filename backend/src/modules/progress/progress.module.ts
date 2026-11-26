import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { ProgressEntity } from './progress.entity';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CourseEntity } from '../courses/course.entity';
import { UserEntity } from '../users/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    SecurityModule,
    NotificationsModule,
    TypeOrmModule.forFeature([ProgressEntity, LessonEntity, EnrollmentEntity, CourseEntity, UserEntity]),
  ],
  controllers: [ProgressController],
  providers: [ProgressService, JwtAuthGuard, RolesGuard],
})
export class ProgressModule {}
