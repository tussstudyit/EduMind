import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('password_reset_tokens')
@Index(['userId', 'usedAt'])
export class PasswordResetTokenEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 64, unique: true }) tokenHash: string;
  @Column({ type: 'varchar', length: 64 }) userId: string;
  @Column({ type: 'varchar', length: 64 }) requestId: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) usedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}
