import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { GradeAttemptDto } from './dto/grade-attempt.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { SubmissionsService } from './submissions.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}
  @Get('attempts') list(@CurrentUser() user: UserEntity, @Query('quizId') quizId?: string, @Query('studentId') studentId?: string) { return this.submissions.list(user, quizId, studentId); }
  @Post('quizzes/:quizId/start') @Roles('student') start(@CurrentUser() user: UserEntity, @Param('quizId') quizId: string) { return this.submissions.start(user, quizId); }
  @Patch('attempts/:id/draft') @Roles('student') saveDraft(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() body: SaveDraftDto) { return this.submissions.saveDraft(user, id, body); }
  @Post('attempts/:id/submit') @Roles('student') submit(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() body: SaveDraftDto) { return this.submissions.submit(user, id, body); }
  @Post('attempts/:id/grade') @Roles('admin', 'teacher') grade(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() body: GradeAttemptDto) { return this.submissions.grade(user, id, body); }
}
