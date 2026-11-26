import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('materials')
@Index(['courseId', 'lessonId'])
export class MaterialEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) lessonId: string;
  @Column({ type: 'varchar', length: 64 }) courseId: string;
  @Column({ type: 'varchar', length: 200 }) title: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column({ type: 'varchar', length: 16, default: 'pdf' }) fileType: string;
  @Column({ type: 'text' }) fileUrl: string;
  @Column({ type: 'varchar', length: 32, default: '' }) fileSize: string;
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }) uploadedAt: Date;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
