import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectEntity } from './subject.entity';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TopicEntity } from '../topics/topic.entity';
import { CourseEntity } from '../courses/course.entity';
import { UserEntity } from '../users/user.entity';

@Module({ imports: [SecurityModule, TypeOrmModule.forFeature([SubjectEntity, TopicEntity, CourseEntity, UserEntity])], controllers: [SubjectsController], providers: [SubjectsService, JwtAuthGuard, RolesGuard] })
export class SubjectsModule {}
