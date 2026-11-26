import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsService } from './subjects.service';
import { UserEntity } from '../users/user.entity';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}
  @Get() @OptionalAuth() findAll(@CurrentUser() user: UserEntity, @Query('includeHidden') includeHidden?: string) { return this.subjects.findSubjects(user, includeHidden === 'true'); }
  @Get(':id') @OptionalAuth() findOne(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.subjects.getSubject(user, id); }
  @Post() @Roles('admin') create(@Body() data: CreateSubjectDto) { return this.subjects.createSubject(data); }
  @Patch(':id') @Roles('admin') update(@Param('id') id: string, @Body() data: UpdateSubjectDto) { return this.subjects.updateSubject(id, data); }
  @Patch(':id/toggle-hide') @Roles('admin') toggleHide(@Param('id') id: string) { return this.subjects.toggleHidden(id); }
  @Delete(':id') @Roles('admin') remove(@Param('id') id: string) { return this.subjects.removeSubject(id); }
}
