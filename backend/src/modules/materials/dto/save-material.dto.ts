import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SaveMaterialDto {
  @IsOptional() @IsString() @MaxLength(64) id?: string;
  @IsOptional() @IsString() @MaxLength(64) lessonId?: string;
  @IsOptional() @IsString() @MaxLength(64) courseId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(200) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsIn(['pdf', 'docx', 'slide', 'code', 'zip', 'video']) fileType?: string;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() @MaxLength(32) fileSize?: string;
}
