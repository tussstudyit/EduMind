import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { CreateScanDto } from './dto/create-scan.dto';
import { UpdateScanStatusDto } from './dto/update-scan-status.dto';
import { UpdateScanTextDto } from './dto/update-scan-text.dto';
import { OcrService } from './ocr.service';

@Controller('ocr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OcrController {
  constructor(private readonly ocr: OcrService) {}

  @Get('scans')
  list(@CurrentUser() user: UserEntity) {
    return this.ocr.list(user);
  }

  @Post('upload')
  @Roles('student', 'teacher', 'admin')
  create(@CurrentUser() user: UserEntity, @Body() body: CreateScanDto) {
    return this.ocr.create(user, body);
  }

  @Post('scans/:id/reprocess')
  @Roles('student', 'teacher', 'admin')
  reprocess(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.ocr.reprocess(user, id);
  }

  @Patch('scans/:id/status')
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() body: UpdateScanStatusDto) {
    return this.ocr.updateStatus(id, body);
  }

  @Patch('scans/:id/text')
  @Roles('student', 'teacher', 'admin')
  updateText(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() body: UpdateScanTextDto) {
    return this.ocr.updateText(user, id, body);
  }

  @Post('scans/:id/send-to-ai')
  @Roles('student', 'teacher', 'admin')
  sendToAi(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.ocr.sendToAi(user, id);
  }

  @Delete('scans/:id')
  @Roles('student', 'teacher', 'admin')
  remove(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.ocr.remove(user, id);
  }
}
