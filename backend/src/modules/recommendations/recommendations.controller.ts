import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecommendationsController {
  constructor(private readonly recommendations: RecommendationsService) {}

  @Get()
  list(@CurrentUser() user: UserEntity, @Query('includeDismissed') includeDismissed?: string) {
    return this.recommendations.list(user, includeDismissed === 'true');
  }

  @Post('generate')
  generate(@CurrentUser() user: UserEntity) {
    return this.recommendations.generatePersonalized(user, true);
  }

  @Post()
  @Roles('admin')
  create(@Body() body: CreateRecommendationDto) {
    return this.recommendations.create(body);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.recommendations.markRead(user, id);
  }

  @Patch(':id/dismiss')
  dismiss(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.recommendations.dismiss(user, id);
  }
}
