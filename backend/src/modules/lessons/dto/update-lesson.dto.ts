import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateLessonDto {
  @IsOptional() @IsString() @MaxLength(64) courseId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) order?: number;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() contentMarkdown?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
