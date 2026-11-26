import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(32) phone?: string;
  @IsOptional() @IsString() @MaxLength(160) institution?: string;
  @IsOptional() @IsString() @MaxLength(160) department?: string;
  @IsOptional() @IsString() bio?: string;
}
