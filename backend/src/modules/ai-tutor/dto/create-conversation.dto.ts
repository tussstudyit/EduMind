import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString() @MaxLength(64) studentId: string;
  @IsOptional() @IsString() @MaxLength(64) courseId?: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string;
}
