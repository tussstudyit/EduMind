import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateEnrollmentDto {
  @IsOptional() @IsString() @MaxLength(200) courseTitle?: string;
  @IsOptional() @IsString() @MaxLength(160) studentName?: string;
  @IsOptional() @IsString() @MaxLength(12) studentAvatar?: string;
  @IsOptional() @IsEmail() @MaxLength(255) studentEmail?: string;
  @IsOptional() @IsIn(['active', 'dropped', 'completed']) status?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) progressPercent?: number;
}
