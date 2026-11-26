import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

class AnswerGradeDto {
  @IsString() @MaxLength(64) questionId: string;
  @IsNumber() @Min(0) scoreAwarded: number;
  @IsOptional() @IsString() teacherFeedback?: string;
}

export class GradeAttemptDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => AnswerGradeDto) grades: AnswerGradeDto[];
  @IsOptional() @IsString() teacherNotes?: string;
}
