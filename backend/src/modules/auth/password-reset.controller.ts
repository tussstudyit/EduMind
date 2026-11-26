import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { CompletePasswordResetDto } from './dto/complete-password-reset.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { PasswordResetService } from './password-reset.service';

@Controller()
export class PasswordResetController {
  constructor(private readonly passwordResets: PasswordResetService) {}

  @Post('auth/forgot-password')
  requestReset(@Body() body: ForgotPasswordDto) {
    return this.passwordResets.requestReset(body.email);
  }

  @Post('auth/reset-password')
  completeReset(@Body() body: CompletePasswordResetDto) {
    return this.passwordResets.completeReset(body.token, body.password);
  }

  @Get('admin/password-reset-requests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listRequests() {
    return this.passwordResets.listRequests();
  }

  @Post('admin/password-reset-requests/:id/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  sendResetLink(@Param('id') id: string, @CurrentUser() actor: UserEntity) {
    return this.passwordResets.sendResetLink(id, actor);
  }
}
