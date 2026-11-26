import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('system_logs')
@Index(['timestamp'])
export class SystemLogEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 }) id: string;
  @Column({ type: 'varchar', length: 8, default: 'info' }) level: string;
  @Column({ type: 'varchar', length: 200 }) action: string;
  @Column({ type: 'varchar', length: 64, nullable: true }) actorId: string | null;
  @Column({ type: 'varchar', length: 160, default: 'System' }) actorName: string;
  @Column({ type: 'varchar', length: 12, default: 'admin' }) actorRole: string;
  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' }) timestamp: Date;
  @Column({ type: 'text', default: '' }) details: string;
}
