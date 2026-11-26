import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'edumind:roles';
export type UserRole = 'admin' | 'teacher' | 'student';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
