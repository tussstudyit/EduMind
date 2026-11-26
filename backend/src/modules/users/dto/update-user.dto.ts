import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIn(['admin', 'teacher', 'student'])
  role?: string;

  @IsOptional()
  @IsIn(['active', 'locked'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  institution?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  department?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}
