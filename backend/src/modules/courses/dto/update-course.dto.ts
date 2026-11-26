import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional() @IsString() @MaxLength(64) subjectId?: string;
  @IsOptional() @IsString() @MaxLength(160) subjectName?: string;
  @IsOptional() @IsString() @MaxLength(64) teacherId?: string;
  @IsOptional() @IsString() @MaxLength(160) teacherName?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() thumbnail?: string;
  @IsOptional() @IsIn(['beginner', 'intermediate', 'advanced']) level?: string;
  @IsOptional() @IsIn(['draft', 'published', 'archived', 'hidden']) status?: string;
  @IsOptional() @IsIn(['lavender', 'mint', 'sky', 'amber']) tone?: string;
  @IsOptional() @IsString() @MaxLength(24) badgeMark?: string;
  @IsOptional() @IsInt() @Min(0) durationHours?: number;
  @IsOptional() @IsInt() @Min(0) lessonCount?: number;
}
