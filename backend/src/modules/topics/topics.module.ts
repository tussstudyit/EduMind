import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubjectEntity } from '../subjects/subject.entity';
import { TopicEntity } from './topic.entity';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

@Module({ imports: [SecurityModule, TypeOrmModule.forFeature([TopicEntity, SubjectEntity, UserEntity])], controllers: [TopicsController], providers: [TopicsService, JwtAuthGuard, RolesGuard] })
export class TopicsModule {}
