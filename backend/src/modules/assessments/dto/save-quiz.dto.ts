import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SaveQuizDto {
  @IsOptional() @IsString() @MaxLength(64) id?: string;
  @IsOptional() @IsString() @MaxLength(64) courseId?: string | null;
  @IsOptional() @IsString() @MaxLength(200) courseTitle?: string;
  @IsOptional() @IsString() @MaxLength(64) lessonId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) timeLimitMinutes?: number;
  @IsOptional() @IsNumber() @Min(0) passingScore?: number;
  @IsOptional() @IsNumber() @Min(0) maxScore?: number;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}
