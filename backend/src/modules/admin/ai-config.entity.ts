import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_config')
export class AiConfigEntity {
  @PrimaryColumn({ type: 'varchar', length: 32, default: 'default' }) id: string;
  @Column({ type: 'varchar', length: 32, default: 'gemini' }) provider: string;
  @Column({ type: 'varchar', length: 120, default: 'gemini-3.8-flash' }) modelName: string;
  @Column({ type: 'varchar', length: 255, default: '' }) apiKeyMasked: string;
  @Column({ type: 'text', nullable: true, select: false }) apiKey: string | null;
  @Column({ type: 'varchar', length: 255, nullable: true }) customEndpoint: string | null;
  @Column({ type: 'text', default: '' }) systemPrompt: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) activeModelVersionId: string | null;
  @Column({ type: 'integer', default: 2048 }) maxTokens: number;
  @Column({ type: 'numeric', precision: 4, scale: 3, default: 0.7 }) temperature: string;
  @Column({ type: 'varchar', length: 32, default: 'gemini-multimodal' }) ocrEngine: string;
  @Column({ type: 'numeric', precision: 4, scale: 3, nullable: true, default: 0.85 }) ocrConfidenceThreshold: string | null;
  @Column({ type: 'integer', nullable: true, default: 10 }) maxUploadSizeMB: number | null;
  @Column({ type: 'varchar', length: 16, default: 'healthy' }) serviceStatus: string;
  @Column({ type: 'integer', default: 0 }) dailyUsageCount: number;
  @Column({ type: 'integer', default: 15000 }) dailyUsageLimit: number;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
