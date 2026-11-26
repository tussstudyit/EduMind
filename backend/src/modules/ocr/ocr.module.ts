import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTutorModule } from '../ai-tutor/ai-tutor.module';
import { OcrScanEntity } from './ocr-scan.entity';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { SecurityModule } from '../../common/security.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';

@Module({ imports: [SecurityModule, TypeOrmModule.forFeature([OcrScanEntity, UserEntity]), AiTutorModule], controllers: [OcrController], providers: [OcrService, JwtAuthGuard, RolesGuard] })
export class OcrModule {}
