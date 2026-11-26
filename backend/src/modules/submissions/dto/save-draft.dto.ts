import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';

class AnswerDto {
  @IsString() @MaxLength(64) questionId: string;
  @IsOptional() @IsString() @MaxLength(64) selectedOptionId?: string;
  @IsOptional() @IsString() essayAnswer?: string;
  @IsOptional() @IsString() @MaxLength(255) attachmentName?: string;
  @IsOptional() @IsString() @MaxLength(120) attachmentType?: string;
  @IsOptional() @IsString() @MaxLength(64) attachmentSize?: string;
  @IsOptional() @IsString() attachmentDataUrl?: string;
  @IsOptional() @IsString() attachmentExtractedText?: string;
}

export class SaveDraftDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => AnswerDto) answers: AnswerDto[];
}
