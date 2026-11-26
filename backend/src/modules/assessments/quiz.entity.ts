import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('quizzes')
@Index(['courseId', 'createdAt'])
@Index(['createdBy', 'createdAt'])
export class QuizEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) courseId: string | null;
  @Column({ type: 'varchar', length: 64, nullable: true }) createdBy: string | null;
  @Column({ type: 'varchar', length: 200, default: '' }) courseTitle: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) lessonId: string | null;
  @Column({ type: 'varchar', length: 200 }) title: string;
  @Column({ type: 'text', default: '' }) description: string;
  @Column({ type: 'integer', default: 0 }) timeLimitMinutes: number;
  @Column({ type: 'numeric', precision: 7, scale: 2, default: 0 }) passingScore: string;
  @Column({ type: 'numeric', precision: 7, scale: 2, default: 0 }) maxScore: string;
  @Column({ type: 'boolean', default: false }) isPublished: boolean;
  @Column({ type: 'integer', default: 0 }) questionCount: number;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
