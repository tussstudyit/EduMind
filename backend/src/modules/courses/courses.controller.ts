import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesService } from './courses.service';
import { UserEntity } from '../users/user.entity';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  @OptionalAuth()
  findAll(@CurrentUser() user: UserEntity, @Query('subjectId') subjectId?: string, @Query('status') status?: string) {
    return this.courses.findCourses(user, { subjectId, status });
  }

  @Get('reports/list')
  listReports(@CurrentUser() user: UserEntity, @Query('courseId') courseId?: string) {
    return this.courses.listReports(user, courseId);
  }

  @Post(':id/report')
  submitReport(
    @CurrentUser() user: UserEntity,
    @Param('id') courseId: string,
    @Body() body: { reason: string; details?: string },
  ) {
    return this.courses.submitReport(user, courseId, body);
  }

  @Patch('reports/:reportId/moderate')
  @Roles('admin')
  moderateReport(
    @CurrentUser() user: UserEntity,
    @Param('reportId') reportId: string,
    @Body()
    body: {
      action: 'temporarily_locked' | 'permanently_locked' | 'unlock' | 'dismissed';
      adminActionNote?: string;
    },
  ) {
    return this.courses.moderateReport(user, reportId, body);
  }

  @Get('reviews/list')
  @OptionalAuth()
  listReviews(@Query('teacherId') teacherId?: string, @Query('courseId') courseId?: string) {
    return this.courses.listReviews(teacherId, courseId);
  }

  @Post('reviews/submit')
  submitReview(
    @CurrentUser() user: UserEntity,
    @Body() body: { courseId?: string; teacherId?: string; rating: number; comment: string },
  ) {
    return this.courses.submitReview(user, body);
  }

  @Get(':id')
  @OptionalAuth()
  findOne(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.courses.getCourse(user, id);
  }

  @Post()
  @Roles('admin', 'teacher')
  create(@CurrentUser() user: UserEntity, @Body() data: CreateCourseDto) {
    return this.courses.createCourse(user, data);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  update(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() data: UpdateCourseDto) {
    return this.courses.updateCourse(user, id, data);
  }

  @Delete(':id')
  @Roles('admin', 'teacher')
  remove(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.courses.deleteCourse(user, id);
  }
}
