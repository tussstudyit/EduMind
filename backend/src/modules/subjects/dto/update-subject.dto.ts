import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(32) code?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() @MaxLength(64) iconName?: string;
  @IsOptional() @IsBoolean() isHidden?: boolean;
}
