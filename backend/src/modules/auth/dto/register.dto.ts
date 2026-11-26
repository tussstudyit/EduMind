import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() @MaxLength(255) email: string;
  @IsString() @MinLength(2) @MaxLength(160) name: string;
  @IsString() @MinLength(8) @MaxLength(128) password: string;
  @IsOptional() @IsIn(['student', 'teacher']) role?: 'student' | 'teacher';
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
  @IsOptional() @IsString() @MaxLength(160) institution?: string;
  @IsOptional() @IsString() @MaxLength(160) department?: string;
}
