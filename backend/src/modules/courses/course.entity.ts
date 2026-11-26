import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('courses')
export class CourseEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64, default: '' })
  subjectId: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  subjectName: string;

  @Column({ type: 'varchar', length: 64, default: '' })
  teacherId: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  teacherName: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'text', default: '' })
  thumbnail: string;

  @Column({ type: 'varchar', length: 20, default: 'beginner' })
  level: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 20, default: 'lavender' })
  tone: string;

  @Column({ type: 'varchar', length: 24, default: '' })
  badgeMark: string;

  @Column({ type: 'integer', default: 0 })
  durationHours: number;

  @Column({ type: 'integer', default: 0 })
  lessonCount: number;

  @Column({ type: 'integer', default: 0 })
  enrolledCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
