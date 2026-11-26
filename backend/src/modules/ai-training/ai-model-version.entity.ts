import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface AiModelEvaluationMetrics {
  accuracy: number;
  f1Score: number;
  bleuScore: number;
  perplexity: number;
  avgLatencyMs: number;
  hallucinationRate: number;
}

@Entity('ai_model_versions')
@Index(['isDeployed', 'createdAt'])
export class AiModelVersionEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) jobId: string | null;
  @Column({ type: 'varchar', length: 64 }) versionTag: string;
  @Column({ type: 'varchar', length: 160 }) modelIdentifier: string;
  @Column({ type: 'varchar', length: 120, default: 'gemini-3.8-flash' }) baseModel: string;
  @Column({ type: 'integer', default: 0 }) datasetSize: number;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) metrics: AiModelEvaluationMetrics;
  @Column({ type: 'text', default: '' }) evaluationSummary: string;
  @Column({ type: 'varchar', length: 24, default: 'candidate' }) status: string;
  @Column({ type: 'boolean', default: false }) isDeployed: boolean;
  @Column({ type: 'timestamptz', nullable: true }) deployedAt: Date | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) deployedBy: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
