import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConfigEntity } from '../admin/ai-config.entity';
import { CourseEntity } from '../courses/course.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { MaterialEntity } from '../materials/material.entity';
import { AiCorpusDocumentEntity } from '../ai-training/ai-corpus-document.entity';
import { AiDatasetEntryEntity } from '../ai-training/ai-dataset-entry.entity';
import { AiModelVersionEntity } from '../ai-training/ai-model-version.entity';
import { SubjectEntity } from '../subjects/subject.entity';
import { UserEntity } from '../users/user.entity';
import { TeacherReviewEntity } from '../courses/teacher-review.entity';
import { AiEngineService } from './ai-engine.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiConfigEntity,
      CourseEntity,
      LessonEntity,
      MaterialEntity,
      SubjectEntity,
      UserEntity,
      TeacherReviewEntity,
      AiCorpusDocumentEntity,
      AiDatasetEntryEntity,
      AiModelVersionEntity,
    ]),
  ],
  providers: [AiEngineService],
  exports: [AiEngineService],
})
export class AiEngineModule {}
