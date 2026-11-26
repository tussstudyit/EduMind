import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminModule } from '../admin/admin.module';
import { AiConfigEntity } from '../admin/ai-config.entity';
import { QuestionEntity } from '../assessments/question.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { UserEntity } from '../users/user.entity';
import { AiCorpusDocumentEntity } from './ai-corpus-document.entity';
import { AiDatasetEntryEntity } from './ai-dataset-entry.entity';
import { AiModelVersionEntity } from './ai-model-version.entity';
import { AiTrainingJobEntity } from './ai-training-job.entity';
import { AiTrainingController } from './ai-training.controller';
import { AiTrainingService } from './ai-training.service';

@Module({
  imports: [
    SecurityModule,
    AdminModule,
    TypeOrmModule.forFeature([
      AiCorpusDocumentEntity,
      AiDatasetEntryEntity,
      AiTrainingJobEntity,
      AiModelVersionEntity,
      AiConfigEntity,
      LessonEntity,
      QuestionEntity,
      UserEntity,
    ]),
  ],
  controllers: [AiTrainingController],
  providers: [AiTrainingService, JwtAuthGuard, RolesGuard],
  exports: [AiTrainingService],
})
export class AiTrainingModule {}
