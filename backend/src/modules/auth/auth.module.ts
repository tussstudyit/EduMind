import { Module } from '@nestjs/common';
import { SecurityModule } from '../../common/security.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminModule } from '../admin/admin.module';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  imports: [SecurityModule, UsersModule, AdminModule],
  controllers: [AuthController],
  providers: [AuthService, AdminBootstrapService, JwtAuthGuard, RolesGuard],
  exports: [AuthService],
})
export class AuthModule {}
