import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('conversations')
@Index(['studentId', 'isArchived'])
export class ConversationEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  studentId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  courseId: string | null;

  @Column({ type: 'varchar', length: 200, default: 'Cuộc trò chuyện mới với AI Tutor' })
  title: string;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
