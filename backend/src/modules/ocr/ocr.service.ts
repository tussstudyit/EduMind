import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createId } from '../../common/create-id';
import { AiEngineService } from '../ai-engine/ai-engine.service';
import { AiTutorService } from '../ai-tutor/ai-tutor.service';
import { UserEntity } from '../users/user.entity';
import { CreateScanDto } from './dto/create-scan.dto';
import { UpdateScanStatusDto } from './dto/update-scan-status.dto';
import { UpdateScanTextDto } from './dto/update-scan-text.dto';
import { OcrScanEntity } from './ocr-scan.entity';

@Injectable()
export class OcrService {
  constructor(
    @InjectRepository(OcrScanEntity) private readonly scans: Repository<OcrScanEntity>,
    private readonly aiTutor: AiTutorService,
    private readonly aiEngine: AiEngineService,
  ) {}

  list(user: UserEntity) {
    return this.scans.find({
      where: { studentId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  async create(user: UserEntity, data: CreateScanDto) {
    const ocrResult = await this.aiEngine.performOcr({
      imageUrl: data.imageUrl,
      fileName: data.fileName,
      hintText: data.recognizedText,
    });

    const scan = this.scans.create({
      id: createId('ocr'),
      studentId: user.id,
      fileName: data.fileName,
      imageUrl: data.imageUrl,
      recognizedText: ocrResult.recognizedText,
      correctedText: ocrResult.correctedText,
      status: 'completed',
      sentToAI: false,
      notes: data.notes ? `${data.notes} · ${ocrResult.notes}` : ocrResult.notes,
    });

    return this.scans.save(scan);
  }

  async reprocess(user: UserEntity, id: string) {
    const scan = await this.own(user, id);
    const ocrResult = await this.aiEngine.performOcr({
      imageUrl: scan.imageUrl,
      fileName: scan.fileName,
    });
    scan.recognizedText = ocrResult.recognizedText;
    scan.correctedText = ocrResult.correctedText;
    scan.status = 'completed';
    scan.notes = ocrResult.notes;
    return this.scans.save(scan);
  }

  private async own(user: UserEntity, id: string) {
    const scan = await this.scans.findOneBy({ id });
    if (!scan) throw new NotFoundException('Bản quét không tồn tại.');
    if (user.role !== 'admin' && scan.studentId !== user.id) {
      throw new ForbiddenException('Bạn không có quyền truy cập bản quét này.');
    }
    return scan;
  }

  async updateText(user: UserEntity, id: string, data: UpdateScanTextDto) {
    const scan = await this.own(user, id);
    scan.correctedText = data.correctedText;
    return this.scans.save(scan);
  }

  async updateStatus(id: string, data: UpdateScanStatusDto) {
    const scan = await this.scans.findOneBy({ id });
    if (!scan) throw new NotFoundException('Bản quét không tồn tại.');
    scan.status = data.status;
    if (data.recognizedText !== undefined) {
      scan.recognizedText = data.recognizedText;
      if (!scan.correctedText) scan.correctedText = data.recognizedText;
    }
    if (data.notes !== undefined) scan.notes = data.notes;
    return this.scans.save(scan);
  }

  async sendToAi(user: UserEntity, id: string) {
    const scan = await this.own(user, id);
    const promptText = scan.correctedText.trim() || scan.recognizedText.trim();
    if (!promptText) {
      throw new ForbiddenException('Bản quét chưa có nội dung văn bản để gửi.');
    }
    const conversation = await this.aiTutor.createConversation({
      studentId: user.id,
      title: `Bài tập từ OCR: ${scan.fileName}`,
    });
    await this.aiTutor.sendMessage(
      conversation.id,
      `Hãy giải chi tiết và phân tích từng bước nội dung được trích xuất từ tài liệu OCR [${scan.fileName}] sau đây:\n\n${promptText}`,
    );
    scan.sentToAI = true;
    await this.scans.save(scan);
    return { conversation, scan };
  }

  async remove(user: UserEntity, id: string) {
    const scan = await this.own(user, id);
    await this.scans.remove(scan);
    return { deleted: true };
  }
}
