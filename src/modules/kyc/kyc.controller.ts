import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { AuthUser, CurrentUser } from '../../common/current-user.decorator';
import { Roles } from '../../common/roles.decorator';
import { RolesGuard } from '../../common/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewKycDto } from './dto/review-kyc.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { KycService, UploadedFile as KycFile } from './kyc.service';

@UseGuards(JwtAuthGuard)
@Controller('kyc')
export class KycController {
  constructor(private readonly kyc: KycService) {}

  // --- Driver ---

  @Get('status')
  status(@CurrentUser('userId') userId: string) {
    return this.kyc.getStatus(userId);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    return this.kyc.updateProfile(userId, dto);
  }

  @Post('documents')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser('userId') userId: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })],
      }),
    )
    file: KycFile,
  ) {
    const doc = await this.kyc.saveDocument(userId, dto.type, file);
    return { id: doc.id, type: doc.type, originalName: doc.originalName };
  }

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  submit(@CurrentUser('userId') userId: string) {
    return this.kyc.submit(userId);
  }

  // --- Admin ---

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listPending() {
    return this.kyc.listPending();
  }

  @Get('users/:userId/documents')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listUserDocuments(@Param('userId') userId: string) {
    return this.kyc.listDocumentsFor(userId);
  }

  @Post('review/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  review(@Param('userId') userId: string, @Body() dto: ReviewKycDto) {
    return this.kyc.review(userId, dto.approve, dto.reason);
  }

  // Stream a document file to its owner or an admin.
  @Get('documents/:id/file')
  async file(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isAdmin = user.roles.includes(UserRole.ADMIN);
    const { path, mimeType, originalName } = await this.kyc.getDocumentFile(
      id,
      user.userId,
      isAdmin,
    );
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${originalName}"`,
    });
    return new StreamableFile(createReadStream(path));
  }
}
