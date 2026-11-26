import { IsBoolean, IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateLessonDto {
  @IsOptional() @IsString() @MaxLength(64) id?: string;
  @IsString() @MaxLength(64) courseId: string;
  @IsString() @MinLength(2) @MaxLength(200) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) order?: number;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() contentMarkdown?: string;
  @IsOptional() @IsBoolean() isPublished?: boolean;
  @IsOptional() @IsIn(['published', 'draft', 'hidden']) status?: string;
}
