import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString() @MinLength(1) @MaxLength(12000) content: string;
}
