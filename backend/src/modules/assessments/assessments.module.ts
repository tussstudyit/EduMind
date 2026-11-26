import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../courses/course.entity';
import { QuizEntity } from './quiz.entity';
import { QuestionEntity } from './question.entity';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';

@Module({ imports: [SecurityModule, TypeOrmModule.forFeature([QuizEntity, QuestionEntity, CourseEntity, EnrollmentEntity, UserEntity])], controllers: [AssessmentsController], providers: [AssessmentsService, JwtAuthGuard, RolesGuard], exports: [AssessmentsService] })
export class AssessmentsModule {}
