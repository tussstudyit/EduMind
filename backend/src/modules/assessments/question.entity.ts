import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: string;
  attachmentDataUrl?: string;
  attachmentExtractedText?: string;
}

@Entity('questions')
@Index(['quizId', 'order'])
export class QuestionEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) quizId: string;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'varchar', length: 24, default: 'multiple_choice' }) type: string;
  @Column({ type: 'numeric', precision: 7, scale: 2, default: 1 }) points: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) options: QuestionOption[];
  @Column({ type: 'text', nullable: true }) explanation: string | null;
  @Column({ type: 'integer', default: 1 }) order: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
