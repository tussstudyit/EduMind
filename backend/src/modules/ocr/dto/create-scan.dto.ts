import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateScanDto {
  @IsString() @MinLength(1) @MaxLength(255) fileName: string;
  @IsString() @MinLength(1) imageUrl: string;
  @IsOptional() @IsString() recognizedText?: string;
  @IsOptional() @IsString() notes?: string;
}
