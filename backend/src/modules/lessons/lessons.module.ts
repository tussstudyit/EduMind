import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonEntity } from './lesson.entity';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CourseEntity } from '../courses/course.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { UserEntity } from '../users/user.entity';

@Module({ imports: [SecurityModule, TypeOrmModule.forFeature([LessonEntity, CourseEntity, EnrollmentEntity, UserEntity])], controllers: [LessonsController], providers: [LessonsService, JwtAuthGuard, RolesGuard] })
export class LessonsModule {}
