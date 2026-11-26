import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

class QuestionOptionDto {
  @IsOptional() @IsString() @MaxLength(64) id?: string;
  @IsString() @MinLength(1) @MaxLength(2000) text: string;
  @IsOptional() @IsBoolean() isCorrect?: boolean;
  @IsOptional() @IsString() @MaxLength(255) attachmentName?: string;
  @IsOptional() @IsString() @MaxLength(120) attachmentType?: string;
  @IsOptional() @IsString() @MaxLength(64) attachmentSize?: string;
  @IsOptional() @IsString() attachmentDataUrl?: string;
  @IsOptional() @IsString() attachmentExtractedText?: string;
}

export class SaveQuestionDto {
  @IsOptional() @IsString() @MaxLength(64) id?: string;
  @IsOptional() @IsString() @MaxLength(64) quizId?: string;
  @IsOptional() @IsString() @MinLength(1) content?: string;
  @IsOptional() @IsIn(['multiple_choice', 'essay']) type?: string;
  @IsOptional() @IsNumber() @Min(0) points?: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => QuestionOptionDto) options?: QuestionOptionDto[];
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsInt() @Min(1) order?: number;
}
