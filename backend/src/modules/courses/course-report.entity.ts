import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('course_reports')
export class CourseReportEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) courseId: string;
  @Column({ type: 'varchar', length: 200, default: '' }) courseTitle: string;
  @Column({ type: 'varchar', length: 64, default: '' }) teacherId: string;
  @Column({ type: 'varchar', length: 160, default: '' }) teacherName: string;
  @Column({ type: 'varchar', length: 64 }) reporterId: string;
  @Column({ type: 'varchar', length: 160, default: '' }) reporterName: string;
  @Column({ type: 'varchar', length: 180, default: '' }) reporterEmail: string;
  @Column({ type: 'varchar', length: 160, default: '' }) reason: string;
  @Column({ type: 'text', default: '' }) details: string;
  @Column({ type: 'varchar', length: 32, default: 'pending' }) status: string;
  @Column({ type: 'text', default: '' }) adminActionNote: string;
  @Column({ type: 'boolean', default: true }) n8nSynced: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) resolvedAt: Date | null;
}
