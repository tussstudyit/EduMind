import { Body, Controller, Get, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { AdminService } from './admin.service';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('logs')
  logs(@Query('limit') limit?: string) {
    return this.admin.listLogs(Number(limit ?? 100));
  }

  @Get('ai-config')
  config() {
    return this.admin.getAiConfig();
  }

  @Put('ai-config')
  updateConfig(@CurrentUser() user: UserEntity, @Body() body: UpdateAiConfigDto) {
    return this.admin.updateAiConfig(user, body);
  }

  @Post('ai-config/test')
  testConnection(@CurrentUser() user: UserEntity, @Body() body?: { prompt?: string }) {
    return this.admin.testAiConnection(user, body?.prompt);
  }

  @Get('reports/summary')
  reportSummary() {
    return this.admin.reportSummary();
  }
}
