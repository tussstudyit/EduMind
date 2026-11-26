import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTutorController } from './ai-tutor.controller';
import { AiTutorService } from './ai-tutor.service';
import { ChatMessageEntity } from './chat-message.entity';
import { ConversationEntity } from './conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConversationEntity, ChatMessageEntity])],
  controllers: [AiTutorController],
  providers: [AiTutorService],
  exports: [AiTutorService],
})
export class AiTutorModule {}
