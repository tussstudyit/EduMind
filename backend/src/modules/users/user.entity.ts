import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'varchar', length: 12, default: 'student' })
  role: string;

  @Column({ type: 'varchar', length: 12, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 12, default: '' })
  avatar: string;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  @Column({ type: 'varchar', length: 32, default: '' })
  phone: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  institution: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  department: string;

  @Column({ type: 'text', default: '' })
  bio: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
