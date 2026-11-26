import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateRecommendationDto {
  @IsString() @MaxLength(64) studentId: string;
  @IsString() @MinLength(1) @MaxLength(200) title: string;
  @IsString() description: string;
  @IsOptional() @IsString() reason?: string;
  @IsIn(['course', 'review', 'exercise', 'tip']) type: string;
  @IsOptional() @IsString() @MaxLength(64) courseId?: string;
}
