import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserEntity } from '../users/user.entity';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() data: RegisterDto) {
    return this.auth.register(data);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() data: LoginDto) {
    return this.auth.login(data.email, data.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: UserEntity) {
    return this.auth.getProfile(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser() user: UserEntity, @Body() data: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, data);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(@CurrentUser() user: UserEntity, @Body() data: ChangePasswordDto) {
    return this.auth.changePassword(user.id, data.currentPassword, data.newPassword);
  }
}
