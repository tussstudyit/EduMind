import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateScanStatusDto {
  @IsIn(['processing', 'completed', 'failed']) status: string;
  @IsOptional() @IsString() recognizedText?: string;
  @IsOptional() @IsString() notes?: string;
}
