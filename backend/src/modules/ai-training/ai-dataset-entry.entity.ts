import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_dataset_entries')
@Index(['status', 'createdAt'])
export class AiDatasetEntryEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 24, default: 'manual' }) sourceType: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) sourceId: string | null;
  @Column({ type: 'varchar', length: 120, default: 'Tổng hợp' }) subject: string;
  @Column({ type: 'text' }) prompt: string;
  @Column({ type: 'text' }) expectedResponse: string;
  @Column({ type: 'text', default: '' }) systemPrompt: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) tags: string[];
  @Column({ type: 'numeric', precision: 4, scale: 2, default: 0.9 }) qualityScore: string;
  @Column({ type: 'varchar', length: 24, default: 'labeled' }) status: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) createdBy: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
