import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface AiTrainingHyperparameters {
  epochs: number;
  learningRate: number;
  batchSize: number;
  loraRank: number;
  warmupRatio?: number;
}

export interface AiTrainingLogEntry {
  timestamp: string;
  step: string;
  message: string;
  loss?: number;
  valLoss?: number;
}

@Entity('ai_training_jobs')
@Index(['createdAt'])
export class AiTrainingJobEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 200 }) name: string;
  @Column({ type: 'varchar', length: 120, default: 'gemini-3.8-flash' }) baseModel: string;
  @Column({ type: 'varchar', length: 160 }) targetModelName: string;
  @Column({ type: 'integer', default: 0 }) datasetCount: number;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) hyperparameters: AiTrainingHyperparameters;
  @Column({ type: 'varchar', length: 24, default: 'queued' }) status: string;
  @Column({ type: 'integer', default: 0 }) progressPercent: number;
  @Column({ type: 'integer', default: 0 }) currentEpoch: number;
  @Column({ type: 'integer', default: 3 }) totalEpochs: number;
  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: true }) trainingLoss: string | null;
  @Column({ type: 'numeric', precision: 6, scale: 4, nullable: true }) validationLoss: string | null;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) logs: AiTrainingLogEntry[];
  @Column({ type: 'timestamptz', nullable: true }) startedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) createdBy: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
