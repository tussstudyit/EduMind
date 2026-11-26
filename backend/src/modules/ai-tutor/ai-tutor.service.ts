import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { ChatMessageEntity } from './chat-message.entity';
import { ConversationEntity } from './conversation.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Injectable()
export class AiTutorService {
  constructor(
    @InjectRepository(ConversationEntity) private readonly conversations: Repository<ConversationEntity>,
    @InjectRepository(ChatMessageEntity) private readonly messages: Repository<ChatMessageEntity>,
    private readonly aiEngine: AiEngineService,
  ) {}

  async getRuntimeStatus() {
    const config = await this.aiEngine.getActiveConfig();
    return {
      provider: config.provider || 'gemini',
      modelName: config.modelName || 'gemini-3.8-flash',
      ocrEngine: config.ocrEngine || 'gemini-multimodal',
      serviceStatus: config.serviceStatus || 'healthy',
      dailyUsageCount: config.dailyUsageCount || 0,
      dailyUsageLimit: config.dailyUsageLimit || 15000,
      updatedAt: config.updatedAt,
    };
  }

  findConversations(studentId: string, archived = false) {
    return this.conversations.find({
      where: { studentId, isArchived: archived },
      order: { updatedAt: 'DESC' },
    });
  }

  async getConversation(id: string) {
    const conversation = await this.conversations.findOneBy({ id });
    if (!conversation) throw new NotFoundException('Không tìm thấy cuộc trò chuyện.');
    return conversation;
  }

  async createConversation(data: CreateConversationDto) {
    const conversation = await this.conversations.save(
      this.conversations.create({
        id: createId('conv'),
        studentId: data.studentId,
        courseId: data.courseId ?? null,
        title: data.title?.trim() || 'Cuộc trò chuyện mới với AI Tutor',
        isArchived: false,
      }),
    );

    const welcome = await this.aiEngine.generateWelcomeMessage(conversation.courseId);

    await this.messages.save(
      this.messages.create({
        id: createId('msg'),
        conversationId: conversation.id,
        sender: 'assistant',
        content: welcome.content,
        suggestions: welcome.suggestions,
      }),
    );

    return conversation;
  }

  async renameConversation(id: string, title: string) {
    const conversation = await this.getConversation(id);
    conversation.title = title.trim();
    return this.conversations.save(conversation);
  }

  async toggleArchiveConversation(id: string) {
    const conversation = await this.getConversation(id);
    conversation.isArchived = !conversation.isArchived;
    return this.conversations.save(conversation);
  }

  async deleteConversation(id: string) {
    await this.getConversation(id);
    await this.messages.delete({ conversationId: id });
    await this.conversations.delete({ id });
    return { deleted: true };
  }

  async getMessages(conversationId: string) {
    await this.getConversation(conversationId);
    return this.messages.find({ where: { conversationId }, order: { createdAt: 'ASC' } });
  }

  async sendMessage(conversationId: string, content: string) {
    const conversation = await this.getConversation(conversationId);
    if (conversation.isArchived) {
      throw new NotFoundException('Hãy khôi phục cuộc trò chuyện trước khi gửi tin nhắn.');
    }

    const previousMessages = await this.messages.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    const trimmedContent = content.trim();
    const userMsg = await this.messages.save(
      this.messages.create({
        id: createId('msg'),
        conversationId,
        sender: 'user',
        content: trimmedContent,
        suggestions: null,
      }),
    );

    const aiReply = await this.aiEngine.generateTutorReply({
      studentId: conversation.studentId,
      courseId: conversation.courseId,
      conversationTitle: conversation.title,
      history: previousMessages.map((m) => ({ sender: m.sender, content: m.content })),
      userMessage: trimmedContent,
    });

    const assistantMsg = await this.messages.save(
      this.messages.create({
        id: createId('msg'),
        conversationId,
        sender: 'assistant',
        content: aiReply.content,
        suggestions: aiReply.suggestions,
      }),
    );

    conversation.updatedAt = new Date();
    if (
      conversation.title === 'Cuộc trò chuyện mới với AI Tutor' ||
      conversation.title === 'Hỏi đáp bài học'
    ) {
      conversation.title = trimmedContent.slice(0, 64) || conversation.title;
    }
    await this.conversations.save(conversation);

    return {
      userMsg,
      assistantMsg,
      modelUsed: aiReply.modelUsed,
      providerUsed: aiReply.providerUsed,
    };
  }
}
