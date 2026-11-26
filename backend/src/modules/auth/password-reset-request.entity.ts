import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('password_reset_requests')
@Index(['status', 'requestedAt'])
@Index(['userId', 'requestedAt'])
export class PasswordResetRequestEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64 }) userId: string;
  @Column({ type: 'varchar', length: 255 }) email: string;
  @Column({ type: 'varchar', length: 160 }) name: string;
  @Column({ type: 'varchar', length: 16, default: 'pending' }) status: 'pending' | 'sent' | 'completed';
  @CreateDateColumn({ type: 'timestamptz' }) requestedAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) sentAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) completedAt: Date | null;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}
