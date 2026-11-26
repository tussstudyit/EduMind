import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNotificationDto {
  @IsString() @MaxLength(64) userId: string;
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsString() @MinLength(1) message: string;
  @IsOptional() @IsIn(['info', 'success', 'warning', 'alert']) type?: string;
  @IsOptional() @IsString() @MaxLength(2048) link?: string;
}
