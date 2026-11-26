import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('enrollments')
@Index(['studentId', 'courseId'], { unique: true })
export class EnrollmentEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  courseId: string;

  @Column({ type: 'varchar', length: 200, default: '' })
  courseTitle: string;

  @Column({ type: 'varchar', length: 64 })
  studentId: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  studentName: string;

  @Column({ type: 'varchar', length: 12, default: '' })
  studentAvatar: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  studentEmail: string;

  @CreateDateColumn({ type: 'timestamptz' })
  enrolledAt: Date;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status: string;

  @Column({ type: 'integer', default: 0 })
  progressPercent: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastAccessedAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
