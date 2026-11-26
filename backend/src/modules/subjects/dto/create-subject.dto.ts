import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSubjectDto {
  @IsOptional() @IsString() @MaxLength(64) id?: string;
  @IsString() @MinLength(2) @MaxLength(32) code: string;
  @IsString() @MinLength(2) @MaxLength(160) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(64) iconName?: string;
  @IsOptional() @IsBoolean() isHidden?: boolean;
}
