import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from './course.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { SubjectEntity } from '../subjects/subject.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { MaterialEntity } from '../materials/material.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { ProgressEntity } from '../progress/progress.entity';
import { CourseReportEntity } from './course-report.entity';
import { TeacherReviewEntity } from './teacher-review.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    SecurityModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      CourseEntity,
      CourseReportEntity,
      TeacherReviewEntity,
      UserEntity,
      SubjectEntity,
      LessonEntity,
      MaterialEntity,
      EnrollmentEntity,
      ProgressEntity,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService, JwtAuthGuard, RolesGuard],
})
export class CoursesModule {}
