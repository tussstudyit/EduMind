import { IsString } from 'class-validator';

export class UpdateScanTextDto { @IsString() correctedText: string; }
