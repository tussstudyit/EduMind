import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UserEntity } from './user.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('directory/teachers')
  @OptionalAuth()
  findTeachers() {
    return this.users.findTeachers();
  }

  @Get()
  @Roles('admin')
  findAll() {
    return this.users.findAll();
  }

  @Get(':id')
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() data: CreateUserDto) {
    return this.users.createUser(data);
  }

  @Patch(':id')
  @Roles('admin')
  update(@CurrentUser() actor: UserEntity, @Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.users.updateUser(actor, id, data);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentUser() actor: UserEntity, @Param('id') id: string) {
    return this.users.removeUser(actor, id);
  }

  @Post(':id/reset-password')
  @Roles('admin')
  resetPassword(@CurrentUser() actor: UserEntity, @Param('id') id: string, @Body() data: ResetPasswordDto) {
    return this.users.resetUserPassword(actor, id, data.password);
  }
}
