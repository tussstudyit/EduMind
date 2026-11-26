import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CompleteLessonDto } from './dto/complete-lesson.dto';
import { ProgressService } from './progress.service';
import { UserEntity } from '../users/user.entity';

@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get()
  getProgress(
    @CurrentUser() user: UserEntity,
    @Query('studentId') studentId?: string,
    @Query('courseId') courseId?: string,
  ) {
    if (!courseId) {
      return this.progress.listProgress(user, studentId);
    }
    return this.progress.getProgress(user, studentId, courseId);
  }

  @Post('access-lesson')
  @Roles('student')
  accessLesson(@CurrentUser() user: UserEntity, @Body() data: CompleteLessonDto) {
    return this.progress.accessLesson(user, data);
  }

  @Post('complete-lesson')
  @Roles('student')
  completeLesson(@CurrentUser() user: UserEntity, @Body() data: CompleteLessonDto) {
    return this.progress.completeLesson(user, data);
  }

  @Post('remind-n8n')
  @Roles('admin', 'teacher')
  sendProgressReminderN8n(
    @CurrentUser() user: UserEntity,
    @Body() body: { studentId: string; courseId: string; customMessage?: string },
  ) {
    return this.progress.sendProgressReminderViaN8n(user, body);
  }
}
