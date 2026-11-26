import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('notifications')
@Index(['userId', 'createdAt'])
export class NotificationEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) userId: string;
  @Column({ type: 'varchar', length: 200 }) title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'varchar', length: 16, default: 'info' }) type: string;
  @Column({ type: 'boolean', default: false }) isRead: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @Column({ type: 'text', nullable: true }) link: string | null;
}
