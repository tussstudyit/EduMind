import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ocr_scans')
@Index(['studentId', 'createdAt'])
export class OcrScanEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) studentId: string;
  @Column({ type: 'varchar', length: 255 }) fileName: string;
  @Column({ type: 'text' }) imageUrl: string;
  @Column({ type: 'text', default: '' }) recognizedText: string;
  @Column({ type: 'text', default: '' }) correctedText: string;
  @Column({ type: 'varchar', length: 16, default: 'processing' }) status: string;
  @Column({ type: 'boolean', default: false }) sentToAI: boolean;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
