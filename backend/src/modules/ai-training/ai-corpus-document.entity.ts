import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_corpus_documents')
@Index(['status', 'createdAt'])
export class AiCorpusDocumentEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) uploaderId: string;
  @Column({ type: 'varchar', length: 160, default: '' }) uploaderName: string;
  @Column({ type: 'varchar', length: 16, default: 'student' }) uploaderRole: string;
  @Column({ type: 'varchar', length: 200 }) title: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column({ type: 'varchar', length: 120, default: '' }) subject: string;
  @Column({ type: 'varchar', length: 120, default: 'Ghi chú học tập' }) category: string;
  @Column({ type: 'varchar', length: 255, default: '' }) fileName: string;
  @Column({ type: 'varchar', length: 120, default: 'application/octet-stream' }) mimeType: string;
  @Column({ type: 'integer', default: 0 }) fileSize: number;
  @Column({ type: 'text', default: '' }) extractedText: string;
  @Column({ type: 'integer', default: 0 }) chunkCount: number;
  @Column({ type: 'varchar', length: 24, default: 'pending_review' }) status: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) reviewedBy: string | null;
  @Column({ type: 'text', nullable: true }) reviewNotes: string | null;
  @Column({ type: 'boolean', default: false }) includedInTraining: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
