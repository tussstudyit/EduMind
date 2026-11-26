import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('topics')
@Index(['subjectId', 'order'])
export class TopicEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) subjectId: string;
  @Column({ type: 'varchar', length: 160 }) name: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column({ type: 'integer', default: 1 }) order: number;
  @Column({ type: 'boolean', default: false }) isHidden: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
