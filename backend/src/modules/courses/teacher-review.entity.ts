import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('teacher_reviews')
export class TeacherReviewEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) teacherId: string;
  @Column({ type: 'varchar', length: 160, default: '' }) teacherName: string;
  @Column({ type: 'varchar', length: 64 }) courseId: string;
  @Column({ type: 'varchar', length: 200, default: '' }) courseTitle: string;
  @Column({ type: 'varchar', length: 64 }) studentId: string;
  @Column({ type: 'varchar', length: 160, default: '' }) studentName: string;
  @Column({ type: 'varchar', length: 16, default: 'SV' }) studentAvatar: string;
  @Column({ type: 'integer', default: 5 }) rating: number;
  @Column({ type: 'text', default: '' }) comment: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
