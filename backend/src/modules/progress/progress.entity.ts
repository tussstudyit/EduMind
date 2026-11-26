import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('student_progress')
@Index(['studentId', 'courseId'], { unique: true })
export class ProgressEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64 })
  studentId: string;

  @Column({ type: 'varchar', length: 64 })
  courseId: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  completedLessonIds: string[];

  @Column({ type: 'varchar', length: 64, default: '' })
  lastLessonId: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastStudiedAt: Date;

  @Column({ type: 'integer', default: 0 })
  percentCompleted: number;

  @Column({ type: 'integer', default: 0 })
  totalMinutesStudied: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
