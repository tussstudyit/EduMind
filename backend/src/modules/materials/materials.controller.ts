import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Head,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { diskStorage } from 'multer';
import { createReadStream, mkdir } from 'node:fs';
import { stat, unlink } from 'node:fs/promises';
import { extname } from 'node:path';
import { Request, Response } from 'express';
import { UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OptionalAuth } from '../../common/decorators/optional-auth.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { SaveMaterialDto } from './dto/save-material.dto';
import { MaterialsService } from './materials.service';
import { COURSE_FILE_DIRECTORY, UploadedCourseFile } from './course-file-storage';

interface MediaPlaybackClaims {
  sub: string;
  materialId: string;
  scope: 'course-video';
  exp: number;
}

function createMediaToken(claims: MediaPlaybackClaims): string {
  const secret = process.env.JWT_SECRET || 'edumind-local-development-secret-change-me-2026';
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function readMediaToken(token: string): MediaPlaybackClaims {
  const [payload, encodedSignature, extra] = token.split('.');
  if (!payload || !encodedSignature || extra) throw new UnauthorizedException('Liên kết video không hợp lệ.');
  const secret = process.env.JWT_SECRET || 'edumind-local-development-secret-change-me-2026';
  const expected = createHmac('sha256', secret).update(payload).digest();
  const supplied = Buffer.from(encodedSignature, 'base64url');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    throw new UnauthorizedException('Liên kết video không hợp lệ.');
  }
  let claims: MediaPlaybackClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as MediaPlaybackClaims;
  } catch {
    throw new UnauthorizedException('Liên kết video không hợp lệ.');
  }
  if (claims.scope !== 'course-video' || claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException('Liên kết video đã hết hạn. Hãy mở lại video từ khóa học.');
  }
  return claims;
}

const allowedExtensions = new Set([
  '.mp4', '.mov', '.m4v', '.webm', '.ogv', '.mp3', '.m4a', '.wav', '.aac', '.ogg',
  '.pdf', '.ppt', '.pptx', '.key',
  '.doc', '.docx', '.rtf', '.zip', '.rar', '.7z', '.py', '.js', '.ts', '.tsx',
  '.cpp', '.c', '.java', '.html', '.css',
]);

const mimeToExtension: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'video/ogg': '.ogv',
  'video/x-m4v': '.m4v',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/aac': '.aac',
  'application/pdf': '.pdf',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.py',
};

function resolveSafeExtension(originalname: string, mimetype?: string): string {
  const rawExt = extname(originalname || '').toLowerCase();
  if (rawExt && allowedExtensions.has(rawExt)) return rawExt;
  const fromMime = mimetype ? mimeToExtension[mimetype.toLowerCase()] : undefined;
  if (fromMime && allowedExtensions.has(fromMime)) return fromMime;
  if (mimetype?.toLowerCase().startsWith('video/')) return '.mp4';
  return rawExt;
}

@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialsController {
  constructor(private readonly materials: MaterialsService) {}

  @Post('upload/:materialId')
  @Roles('admin', 'teacher', 'student')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (_request, _file, callback) => {
        mkdir(COURSE_FILE_DIRECTORY, { recursive: true }, (error) => callback(error, COURSE_FILE_DIRECTORY));
      },
      filename: (request, file, callback) => {
        const materialId = request.params.materialId;
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(materialId)) {
          callback(new BadRequestException('Mã tệp không hợp lệ.'), '');
          return;
        }
        const resolvedExt = resolveSafeExtension(file.originalname, file.mimetype) || '.mp4';
        callback(null, `${materialId}${resolvedExt}`);
      },
    }),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_request, file, callback) => {
      const resolvedExt = resolveSafeExtension(file.originalname, file.mimetype);
      if (!resolvedExt || !allowedExtensions.has(resolvedExt)) {
        callback(new BadRequestException('Định dạng tệp chưa được hỗ trợ.'), false);
        return;
      }
      callback(null, true);
    },
  }))
  async uploadFile(
    @CurrentUser() user: UserEntity,
    @Param('materialId') materialId: string,
    @UploadedFile() file: UploadedCourseFile | undefined,
    @Body('courseId') courseId: string,
    @Body('lessonId') lessonId: string,
  ) {
    try {
      if (!file) throw new BadRequestException('Chưa nhận được tệp tải lên.');
      return await this.materials.registerUploadedFile(user, materialId, file, courseId, lessonId);
    } catch (error) {
      if (file?.path) await unlink(file.path).catch(() => undefined);
      throw error;
    }
  }

  @Post(':id/playback-url')
  async createPlaybackUrl(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    await this.materials.getFile(user, id);
    const expiresAt = Math.floor(Date.now() / 1000) + 8 * 60 * 60;
    const token = createMediaToken({ sub: user.id, materialId: id, scope: 'course-video', exp: expiresAt });
    return {
      streamUrl: `/api/materials/${encodeURIComponent(id)}/stream?token=${encodeURIComponent(token)}`,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
    };
  }

  @Get(':id/stream')
  @OptionalAuth()
  async streamVideo(
    @Param('id') id: string,
    @Query('token') token: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const claims = readMediaToken(token || '');
    if (claims.materialId !== id) throw new UnauthorizedException('Liên kết video không khớp với tệp.');
    const user = await this.materials.getActiveUser(claims.sub);
    const file = await this.materials.getFile(user, id);
    const fileStat = await stat(file.path);
    const fileSize = fileStat.size;
    const ext = extname(file.storageName).toLowerCase() || '.mp4';
    const mimeMap: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.m4v': 'video/mp4',
      '.webm': 'video/webm',
      '.ogv': 'video/ogg',
      '.mov': 'video/quicktime',
    };
    const contentType = mimeMap[ext] || 'video/mp4';

    response.setHeader('Accept-Ranges', 'bytes');
    response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    response.setHeader('Cache-Control', 'private, max-age=3600');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    const range = request.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (Number.isNaN(start) || Number.isNaN(end) || start >= fileSize || end >= fileSize || start > end) {
        response.status(416).setHeader('Content-Range', `bytes */${fileSize}`).end();
        return;
      }
      const chunkSize = end - start + 1;
      response.status(206);
      response.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      response.setHeader('Content-Length', String(chunkSize));
      response.setHeader('Content-Type', contentType);
      createReadStream(file.path, { start, end }).pipe(response);
      return;
    }

    response.status(200);
    response.setHeader('Content-Length', String(fileSize));
    response.setHeader('Content-Type', contentType);
    createReadStream(file.path).pipe(response);
  }

  @Head(':id/file')
  @OptionalAuth()
  async headFile(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const file = await this.materials.getFile(user, id);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.type(extname(file.storageName) || 'application/octet-stream').status(200).end();
  }

  @Get(':id/file')
  @OptionalAuth()
  async getFile(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const file = await this.materials.getFile(user, id);
    response.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.type(extname(file.storageName) || 'application/octet-stream').sendFile(file.path);
  }

  @Get()
  @OptionalAuth()
  list(@CurrentUser() user: UserEntity, @Query('courseId') courseId?: string, @Query('lessonId') lessonId?: string) {
    return this.materials.list(user, courseId, lessonId);
  }

  @Post()
  @Roles('admin', 'teacher')
  create(@CurrentUser() user: UserEntity, @Body() body: SaveMaterialDto) {
    return this.materials.create(user, body);
  }

  @Patch(':id')
  @Roles('admin', 'teacher')
  update(@CurrentUser() user: UserEntity, @Param('id') id: string, @Body() body: SaveMaterialDto) {
    return this.materials.update(user, id, body);
  }

  @Delete(':id')
  @Roles('admin', 'teacher')
  remove(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.materials.remove(user, id);
  }
}
