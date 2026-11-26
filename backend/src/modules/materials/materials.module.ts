import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseEntity } from '../courses/course.entity';
import { EnrollmentEntity } from '../enrollments/enrollment.entity';
import { LessonEntity } from '../lessons/lesson.entity';
import { MaterialEntity } from './material.entity';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';

@Module({ imports: [SecurityModule, TypeOrmModule.forFeature([MaterialEntity, CourseEntity, LessonEntity, EnrollmentEntity, UserEntity])], controllers: [MaterialsController], providers: [MaterialsService, JwtAuthGuard, RolesGuard] })
export class MaterialsModule {}
