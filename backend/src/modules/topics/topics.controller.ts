import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SaveTopicDto } from './dto/save-topic.dto';
import { TopicsService } from './topics.service';
import { UserEntity } from '../users/user.entity';

@Controller('topics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TopicsController {
  constructor(private readonly topics: TopicsService) {}
  @Get() @OptionalAuth() findAll(@CurrentUser() user: UserEntity, @Query('subjectId') subjectId?: string, @Query('includeHidden') includeHidden?: string) {
    return this.topics.findAll(user, subjectId, includeHidden === 'true');
  }
  @Get(':id') @OptionalAuth() findOne(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.topics.findOne(id, user); }
  @Post() @Roles('admin') create(@Body() body: SaveTopicDto) { return this.topics.create(body); }
  @Patch(':id') @Roles('admin') update(@Param('id') id: string, @Body() body: SaveTopicDto) { return this.topics.update(id, body); }
  @Patch(':id/toggle-hide') @Roles('admin') toggleHide(@Param('id') id: string) { return this.topics.toggleHidden(id); }
  @Delete(':id') @Roles('admin') remove(@Param('id') id: string) { return this.topics.remove(id); }
}
