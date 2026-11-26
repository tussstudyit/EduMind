import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecommendationEntity } from './recommendation.entity';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { ProgressEntity } from '../progress/progress.entity';
import { CourseEntity } from '../courses/course.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { QuizEntity } from '../assessments/quiz.entity';
import { QuizAttemptEntity } from '../submissions/quiz-attempt.entity';
import { ConversationEntity } from '../ai-tutor/conversation.entity';
import { OcrScanEntity } from '../ocr/ocr-scan.entity';

@Module({
  imports: [
    SecurityModule,
    TypeOrmModule.forFeature([
      RecommendationEntity,
      UserEntity,
      EnrollmentEntity,
      ProgressEntity,
      CourseEntity,
      LessonEntity,
      QuizEntity,
      QuizAttemptEntity,
      ConversationEntity,
      OcrScanEntity,
    ]),
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, JwtAuthGuard, RolesGuard],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
