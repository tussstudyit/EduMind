import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizEntity } from '../assessments/quiz.entity';
import { CourseEntity } from '../courses/course.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { OcrScanEntity } from '../ocr/ocr-scan.entity';
import { QuizAttemptEntity } from '../submissions/quiz-attempt.entity';
import { UserEntity } from '../users/user.entity';
import { ChatMessageEntity } from '../ai-tutor/chat-message.entity';
import { RecommendationEntity } from '../recommendations/recommendation.entity';
import { AiConfigEntity } from './ai-config.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuditService } from './audit.service';
import { SystemLogEntity } from './system-log.entity';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [
    SecurityModule,
    TypeOrmModule.forFeature([
      AiConfigEntity,
      SystemLogEntity,
      UserEntity,
      CourseEntity,
      EnrollmentEntity,
      QuizEntity,
      QuizAttemptEntity,
      OcrScanEntity,
      ChatMessageEntity,
      RecommendationEntity,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, AuditService, JwtAuthGuard, RolesGuard],
  exports: [AuditService],
})
export class AdminModule {}
