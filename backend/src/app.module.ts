import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'node:path';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { HealthModule } from './modules/health/health.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { ProgressModule } from './modules/progress/progress.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { UsersModule } from './modules/users/users.module';
import { AiTutorModule } from './modules/ai-tutor/ai-tutor.module';
import { AuthModule } from './modules/auth/auth.module';
import { SecurityModule } from './common/security.module';
import { TopicsModule } from './modules/topics/topics.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { AdminModule } from './modules/admin/admin.module';
import { PasswordResetModule } from './modules/auth/password-reset.module';
import { AiEngineModule } from './modules/ai-engine/ai-engine.module';
import { AiTrainingModule } from './modules/ai-training/ai-training.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USERNAME', 'edumind'),
        password: config.get<string>('DB_PASSWORD', 'edumind_dev_password'),
        database: config.get<string>('DB_DATABASE', 'edumind'),
        ssl: config.get<string>('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: false,
        migrations: [join(__dirname, 'database/migrations/*{.js,.ts}')],
        migrationsRun: true,
        retryAttempts: 20,
        retryDelay: 3000,
      }),
    }),
    SecurityModule,
    AuthModule,
    PasswordResetModule,
    HealthModule,
    UsersModule,
    SubjectsModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    AiTutorModule,
    TopicsModule,
    MaterialsModule,
    NotificationsModule,
    AssessmentsModule,
    SubmissionsModule,
    OcrModule,
    RecommendationsModule,
    AdminModule,
    AiEngineModule,
    AiTrainingModule,
  ],
})
export class AppModule {}
