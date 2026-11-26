import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AiTutorService } from './ai-tutor.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('ai/conversations')
export class AiTutorController {
  constructor(private readonly aiTutor: AiTutorService) {}

  @Get('runtime-status')
  getRuntimeStatus() {
    return this.aiTutor.getRuntimeStatus();
  }

  @Get()
  findConversations(@Query('studentId') studentId: string, @Query('archived') archived?: string) {
    return this.aiTutor.findConversations(studentId, archived === 'true');
  }

  @Post()
  createConversation(@Body() data: CreateConversationDto) {
    return this.aiTutor.createConversation(data);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string) {
    return this.aiTutor.getMessages(id);
  }

  @Post(':id/messages')
  sendMessage(@Param('id') id: string, @Body() data: SendMessageDto) {
    return this.aiTutor.sendMessage(id, data.content);
  }

  @Patch(':id/rename')
  renameConversation(@Param('id') id: string, @Body() data: RenameConversationDto) {
    return this.aiTutor.renameConversation(id, data.title);
  }

  @Patch(':id/toggle-archive')
  toggleArchiveConversation(@Param('id') id: string) {
    return this.aiTutor.toggleArchiveConversation(id);
  }

  @Delete(':id')
  deleteConversation(@Param('id') id: string) {
    return this.aiTutor.deleteConversation(id);
  }
}
