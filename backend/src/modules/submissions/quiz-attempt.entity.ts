import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

export interface AttemptAnswer {
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
  scoreAwarded?: number;
  teacherFeedback?: string;
  isCorrect?: boolean;
  correctOptionId?: string;
  attachmentName?: string;
  attachmentType?: string;
  attachmentSize?: string;
  attachmentDataUrl?: string;
  attachmentExtractedText?: string;
}

@Entity('quiz_attempts')
@Index(['quizId', 'studentId'])
export class QuizAttemptEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) quizId: string;
  @Column({ type: 'varchar', length: 200, default: '' }) quizTitle: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) courseId: string | null;
  @Column({ type: 'varchar', length: 64 }) studentId: string;
  @Column({ type: 'varchar', length: 160, default: '' }) studentName: string;
  @Column({ type: 'varchar', length: 12, default: '' }) studentAvatar: string;
  @Column({ type: 'varchar', length: 16, default: 'in_progress' }) status: string;
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) answers: AttemptAnswer[];
  @Column({ type: 'numeric', precision: 7, scale: 2, default: 0 }) totalScore: string;
  @Column({ type: 'numeric', precision: 7, scale: 2, default: 0 }) maxScore: string;
  @CreateDateColumn({ type: 'timestamptz' }) startedAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) submittedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) gradedAt: Date | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) gradedBy: string | null;
  @Column({ type: 'text', nullable: true }) teacherNotes: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
