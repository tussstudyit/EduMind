import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteLessonDto {
  @IsOptional() @IsString() @MaxLength(64) studentId?: string;
  @IsString() @MaxLength(64) courseId: string;
  @IsString() @MaxLength(64) lessonId: string;
}
