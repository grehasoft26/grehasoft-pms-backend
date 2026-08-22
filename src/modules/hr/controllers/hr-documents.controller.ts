import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HrDocumentsService } from '../services/hr-documents.service';
import { PrismaService } from '../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
  OfferLetterDto,
  AppraisalLetterDto,
  ExperienceCertificateDto,
  SalaryCertificateDto,
  InternshipCertificateDto,
  AppointmentLetterDto,
} from '../dto/hr-documents.dto';
import { EmployeeDocumentCategory } from '@prisma/client';

@ApiTags('HR Documents')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/documents')
export class HrDocumentsController {
  constructor(
    private readonly service: HrDocumentsService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkProfileAccess(user: any, profileId: string) {
    const userRole = String(user.roleName || '').toUpperCase();

    // Admins and Managers with hr.read / hr.manage bypass checks
    if (
      userRole === 'SUPER_ADMIN' ||
      userRole === 'ADMIN' ||
      user.permissions?.includes('hr.read') ||
      user.permissions?.includes('hr.manage')
    ) {
      return;
    }

    // Clients are strictly blocked
    if (userRole === 'CLIENT') {
      throw new ForbiddenException('Access denied to HR Portal resources.');
    }

    // Match with current employee profile
    const profile = await this.prisma.employeeProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || profile.id !== profileId) {
      throw new ForbiddenException(
        'You are not authorized to access another employee profile.',
      );
    }
  }

  @Post('upload/:profileId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @Permissions('hr.manage', 'hr.read') // Allow manager or user themselves
  @ApiOperation({ summary: 'Upload a compliance file for an employee profile' })
  async uploadFile(
    @Param('profileId') profileId: string,
    @UploadedFile() file: any,
    @Body('category') category: EmployeeDocumentCategory,
    @Body('name') name: string,
    @CurrentUser() user: any,
  ) {
    // 1. Enforce IDOR Profile Access checks
    await this.checkProfileAccess(user, profileId);

    if (!file) {
      throw new NotFoundException('No file payload was uploaded.');
    }

    const fileBuffer = file.buffer || Buffer.alloc(0);
    const fileName = file.originalname || 'document.pdf';
    const mimeType = file.mimetype || 'application/pdf';
    const fileSize = file.size || 0;

    const doc = await this.service.uploadDocument(
      profileId,
      fileBuffer,
      fileName,
      mimeType,
      fileSize,
      category,
      name,
      user.id,
    );

    return { message: 'HR document uploaded successfully', data: doc };
  }

  @Get('employee/:profileId')
  @Permissions('hr.read', 'hr.manage')
  @ApiOperation({ summary: 'Get list of documents for an employee profile' })
  async getByEmployee(
    @Param('profileId') profileId: string,
    @CurrentUser() user: any,
  ) {
    // 1. Enforce IDOR checks
    await this.checkProfileAccess(user, profileId);

    const data = await this.service.getDocumentsByProfile(profileId);
    return { message: 'HR Documents retrieved successfully', data };
  }

  @Delete(':id')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Delete and purge an HR document' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    const doc = await this.prisma.employeeDocument.findUnique({
      where: { id },
    });
    if (!doc) {
      throw new NotFoundException('HR Document not found.');
    }

    // 1. Verify access to this specific profile ID
    await this.checkProfileAccess(user, doc.employeeProfileId);

    await this.service.deleteDocument(id, user.id);
    return { message: 'HR Document purged successfully' };
  }

  // ---------------- GENERATION TRIGGERS ----------------

  @Post('generate/offer-letter')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Generate Job Offer Letter PDF' })
  async offerLetter(@Body() dto: OfferLetterDto, @Res() res: Response) {
    const buffer = await this.service.generateOfferLetter(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="offer_letter.pdf"',
    );
    res.send(buffer);
  }

  @Post('generate/appraisal-letter')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Generate Performance Appraisal Letter PDF' })
  async appraisalLetter(@Body() dto: AppraisalLetterDto, @Res() res: Response) {
    const buffer = await this.service.generateAppraisalLetter(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="appraisal_letter.pdf"',
    );
    res.send(buffer);
  }

  @Post('generate/experience-certificate')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Generate Experience Certificate PDF' })
  async experienceCertificate(
    @Body() dto: ExperienceCertificateDto,
    @Res() res: Response,
  ) {
    const buffer = await this.service.generateExperienceCertificate(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="experience_certificate.pdf"',
    );
    res.send(buffer);
  }

  @Post('generate/salary-certificate')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Generate Salary Certificate PDF' })
  async salaryCertificate(
    @Body() dto: SalaryCertificateDto,
    @Res() res: Response,
  ) {
    const buffer = await this.service.generateSalaryCertificate(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="salary_certificate.pdf"',
    );
    res.send(buffer);
  }

  @Post('generate/internship-certificate')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Generate Internship Certificate PDF' })
  async internshipCertificate(
    @Body() dto: InternshipCertificateDto,
    @Res() res: Response,
  ) {
    const buffer = await this.service.generateInternshipCertificate(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="internship_certificate.pdf"',
    );
    res.send(buffer);
  }

  @Post('generate/appointment-letter')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Generate Job Appointment Letter PDF' })
  async appointmentLetter(
    @Body() dto: AppointmentLetterDto,
    @Res() res: Response,
  ) {
    const buffer = await this.service.generateAppointmentLetter(dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="appointment_letter.pdf"',
    );
    res.send(buffer);
  }
}
