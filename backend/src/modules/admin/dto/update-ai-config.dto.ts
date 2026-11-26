import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class UpdateAiConfigDto {
  @IsOptional()
  @IsIn(['gemini', 'openai', 'anthropic', 'ollama', 'edumind-tuned'])
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  modelName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  apiKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  apiKeyMasked?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customEndpoint?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  activeModelVersionId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65536)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsIn(['gemini-multimodal', 'google-vision', 'tesseract'])
  ocrEngine?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  ocrConfidenceThreshold?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUploadSizeMB?: number;

  @IsOptional()
  @IsIn(['healthy', 'degraded', 'offline'])
  serviceStatus?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  dailyUsageLimit?: number;
}
