import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get() list(@CurrentUser() user: UserEntity) { return this.notifications.list(user); }
  @Post() @Roles('admin', 'teacher') create(@Body() body: CreateNotificationDto) { return this.notifications.create(body); }
  @Post('mark-all-read') markAllRead(@CurrentUser() user: UserEntity) { return this.notifications.markAllRead(user); }
  @Patch(':id/read') markRead(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.notifications.markRead(user, id); }
  @Delete(':id') remove(@CurrentUser() user: UserEntity, @Param('id') id: string) { return this.notifications.remove(user, id); }
}
