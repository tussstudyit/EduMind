import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('chat_messages')
@Index(['conversationId', 'createdAt'])
export class ChatMessageEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 64 })
  conversationId: string;

  @Column({ type: 'varchar', length: 12 })
  sender: 'user' | 'assistant';

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  suggestions: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
