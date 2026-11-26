import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('recommendations')
@Index(['studentId', 'isDismissed', 'createdAt'])
export class RecommendationEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) studentId: string;
  @Column({ type: 'varchar', length: 200 }) title: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column({ type: 'text', nullable: true }) reason: string | null;
  @Column({ type: 'varchar', length: 16, default: 'tip' }) type: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) courseId: string | null;
  @Column({ type: 'boolean', default: false }) isRead: boolean;
  @Column({ type: 'boolean', default: false }) isDismissed: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
