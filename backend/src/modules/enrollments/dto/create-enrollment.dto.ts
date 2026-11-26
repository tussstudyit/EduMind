import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';

export class CreateEnrollmentDto {
  @IsOptional() @IsString() @MaxLength(64) id?: string;
  @IsString() @MaxLength(64) courseId: string;
  @IsOptional() @IsString() @MaxLength(200) courseTitle?: string;
  @IsOptional() @IsString() @MaxLength(64) studentId?: string;
  @IsOptional() @IsString() @MaxLength(160) studentName?: string;
  @IsOptional() @IsString() @MaxLength(12) studentAvatar?: string;
  @ValidateIf((_object, value) => value !== undefined && value !== null && value !== '')
  @IsEmail()
  @MaxLength(255)
  studentEmail?: string;
  @IsOptional() @IsIn(['active', 'dropped', 'completed']) status?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100) progressPercent?: number;
}
