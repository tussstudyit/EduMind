import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentsService } from './enrollments.service';
import { UserEntity } from '../users/user.entity';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}
  @Get() findAll(@CurrentUser() user: UserEntity, @Query('studentId') studentId?: string, @Query('courseId') courseId?: string) {
    return this.enrollments.findEnrollments(user, studentId, courseId);
  }
  @Get(':id') findOne(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.enrollments.getEnrollment(user, id); }
  @Post() @Roles('student', 'teacher', 'admin') create(@CurrentUser() user: UserEntity, @Body() data: CreateEnrollmentDto) { return this.enrollments.createEnrollment(user, data); }
  @Post('courses/:courseId/drop') @Roles('student') drop(@CurrentUser() user: UserEntity, @Param('courseId') courseId: string) { return this.enrollments.drop(user, courseId); }
  @Patch(':id') @Roles('teacher', 'admin') update(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() data: UpdateEnrollmentDto) { return this.enrollments.updateEnrollment(user, id, data); }
  @Delete(':id') @Roles('admin') remove(@Param('id') id: string) { return this.enrollments.removeEnrollment(id); }
}
