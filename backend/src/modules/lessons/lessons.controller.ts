import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonsService } from './lessons.service';
import { UserEntity } from '../users/user.entity';

@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}
  @Get() @OptionalAuth() findAll(@CurrentUser() user: UserEntity, @Query('courseId') courseId?: string) { return this.lessons.findLessons(user, courseId); }
  @Get(':id') @OptionalAuth() findOne(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.lessons.getLesson(user, id); }
  @Post() @Roles('admin', 'teacher') create(@CurrentUser() user: UserEntity, @Body() data: CreateLessonDto) { return this.lessons.createLesson(user, data); }
  @Patch('courses/:courseId/reorder') @Roles('admin', 'teacher') reorder(@CurrentUser() user: UserEntity, @Param('courseId') courseId: string, @Body() body: { lessonId: string; direction: 'up' | 'down' }) { return this.lessons.reorder(user, courseId, body.lessonId, body.direction); }
  @Patch(':id') @Roles('admin', 'teacher') update(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() data: UpdateLessonDto) { return this.lessons.updateLesson(user, id, data); }
  @Delete(':id') @Roles('admin', 'teacher') remove(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.lessons.deleteLesson(user, id); }
}
