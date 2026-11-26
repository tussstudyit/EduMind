import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('lessons')
@Index(['courseId', 'order'])
export class LessonEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  courseId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'integer', default: 1 })
  order: number;

  @Column({ type: 'integer', default: 30 })
  durationMinutes: number;

  @Column({ type: 'text', nullable: true })
  videoUrl: string | null;

  @Column({ type: 'text', default: '' })
  contentMarkdown: string;

  @Column({ type: 'boolean', default: true })
  isPublished: boolean;

  @Column({ type: 'varchar', length: 16, default: 'published' })
  status: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
