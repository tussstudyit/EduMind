import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnrollmentEntity } from './enrollment.entity';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CourseEntity } from '../courses/course.entity';
import { UserEntity } from '../users/user.entity';

@Module({ imports: [SecurityModule, TypeOrmModule.forFeature([EnrollmentEntity, CourseEntity, UserEntity])], controllers: [EnrollmentsController], providers: [EnrollmentsService, JwtAuthGuard, RolesGuard] })
export class EnrollmentsModule {}
