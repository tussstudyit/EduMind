import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssessmentsModule } from '../assessments/assessments.module';
import { QuestionEntity } from '../assessments/question.entity';
import { QuizEntity } from '../assessments/quiz.entity';
import { CourseEntity } from '../courses/course.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { QuizAttemptEntity } from './quiz-attempt.entity';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';

@Module({
  imports: [SecurityModule, TypeOrmModule.forFeature([QuizAttemptEntity, QuizEntity, QuestionEntity, CourseEntity, EnrollmentEntity, UserEntity]), AssessmentsModule, NotificationsModule],
  controllers: [SubmissionsController], providers: [SubmissionsService, JwtAuthGuard, RolesGuard],
})
export class SubmissionsModule {}
