import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { STORAGE_PROVIDER_TOKEN } from '../../../shared/storage/storage.interface';
import type { IStorageProvider } from '../../../shared/storage/storage.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import PDFDocument from 'pdfkit';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  OfferLetterDto,
  AppraisalLetterDto,
  ExperienceCertificateDto,
  SalaryCertificateDto,
  InternshipCertificateDto,
  AppointmentLetterDto,
} from '../dto/hr-documents.dto';
import { EmployeeDocumentCategory } from '@prisma/client';

@Injectable()
export class HrDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storageProvider: IStorageProvider,
  ) {}

  // ---------------- HELPER METHODS ----------------
  private formatMoney(val: any): string {
    try {
      const num = Number(val);
      return num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      return String(val);
    }
  }

  private getRoleResponsibility(role: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('software') || r.includes('developer')) {
      return 'The employee was responsible for developing, testing, debugging, and maintaining web applications. They worked with modern technologies and contributed to various stages of the software development lifecycle.';
    } else if (r.includes('seo')) {
      return 'The employee was responsible for handling Search Engine Optimization (SEO) activities including keyword research, on-page SEO, off-page SEO, link building, and performance tracking.';
    } else if (r.includes('wordpress')) {
      return 'The employee was responsible for WordPress website development including theme customization, plugin integration, website maintenance, and website performance optimization.';
    } else if (r.includes('digital marketing')) {
      return 'The employee was responsible for digital marketing activities including social media management, content marketing, SEO, and online marketing campaigns.';
    } else {
      return 'The employee handled assigned responsibilities sincerely and professionally and completed all tasks on time.';
    }
  }

  private getInternshipContent(role: string): string {
    const r = (role || '').toLowerCase();
    if (r.includes('software')) {
      return 'During the internship period, the intern was involved in software development tasks including coding, debugging, testing, and assisting in project development activities.';
    } else if (r.includes('seo')) {
      return 'During the internship period, the intern worked on SEO activities including keyword research, on-page SEO, off-page SEO, and link building.';
    } else if (r.includes('wordpress')) {
      return 'During the internship period, the intern worked on WordPress development including theme customization, plugin setup, website updates, and optimization.';
    } else if (r.includes('digital marketing')) {
      return 'During the internship period, the intern worked on digital marketing activities including social media management, content creation, and online marketing support.';
    } else {
      return 'During the internship period, the intern demonstrated sincerity, dedication, and professionalism in assigned tasks.';
    }
  }

  private async buildBasePdf(
    title: string,
    bodyBuilder: (doc: any, yStart: number) => number,
    issueDate?: string,
    hrName?: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 70,
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Absolute paths for logo/watermark/seal inside src/assets
        const assetsDir = path.join(__dirname, '..', '..', '..', 'assets');
        const headerPath = path.join(assetsDir, 'invoice_header.png');
        const watermarkPath = path.join(assetsDir, 'grehasoftwatermark.png');
        const sealPath = path.join(assetsDir, 'seal.png');

        // Draw invoice_header.png (0, 0, width 595, height 90)
        if (fs.existsSync(headerPath)) {
          doc.image(headerPath, 0, 0, { width: 595, height: 90 });
        }

        // Draw watermark (opacity 0.06, centered)
        if (fs.existsSync(watermarkPath)) {
          doc.save();
          doc.opacity(0.06);
          const wWidth = 420;
          const wHeight = 440;
          doc.image(watermarkPath, (595 - wWidth) / 2, (842 - wHeight) / 2, {
            width: wWidth,
            height: wHeight,
          });
          doc.restore();
        }

        // Document Title
        doc.fillColor('#05044A').fontSize(18).font('Helvetica-Bold');
        doc.text(title.toUpperCase(), 70, 150, { align: 'center', width: 455 });

        // Content body
        bodyBuilder(doc, 210);

        // Signature section
        const SIGN_X = 70;
        const SIGN_Y = 570;

        doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold');
        doc.text(hrName || 'Authorized Signatory', SIGN_X, SIGN_Y);
        doc
          .font('Helvetica')
          .fontSize(11)
          .text('HR Manager', SIGN_X, SIGN_Y + 16);
        doc.text('GREHASOFT, Infopark, Kochi', SIGN_X, SIGN_Y + 32);

        doc.text('Place: Kochi', SIGN_X, SIGN_Y + 64);
        doc.text(
          `Date: ${issueDate || new Date().toISOString().split('T')[0]}`,
          SIGN_X,
          SIGN_Y + 80,
        );

        // Seal if exists
        if (fs.existsSync(sealPath)) {
          doc.image(sealPath, 250, SIGN_Y - 15, { width: 130, height: 110 });
        }

        // Footer line
        doc.strokeColor('#1AB728').lineWidth(2);
        doc.moveTo(50, 772).lineTo(545, 772).stroke();

        // Footer text
        doc.fillColor('#05044A').fontSize(9).font('Helvetica');
        doc.text('Grehasoft | Infopark, Kochi | www.grehasoft.com', 50, 788, {
          align: 'center',
          width: 495,
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  // ---------------- FILE UPLOAD & CRUD OPERATIONS ----------------
  async uploadDocument(
    employeeProfileId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number,
    category: EmployeeDocumentCategory,
    customName: string,
    operatorUserId: string,
  ) {
    // 1. Validate employee exists
    const employee = await this.prisma.employeeProfile.findUnique({
      where: { id: employeeProfileId },
    });
    if (!employee) {
      throw new NotFoundException('Target Employee Profile not found');
    }

    // 2. Validate file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (fileSize > MAX_SIZE) {
      throw new BadRequestException(
        'File size exceeds the maximum limit of 10MB',
      );
    }

    // 3. Validate file extension and mime type
    const sanitizedName = fileName
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .replace(/\.\.+/g, '.');
    const ext = sanitizedName.split('.').pop()?.toLowerCase();
    const allowedExtensions = [
      'pdf',
      'png',
      'jpg',
      'jpeg',
      'docx',
      'doc',
      'xlsx',
      'xls',
      'txt',
      'csv',
    ];
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        'Forbidden file extension or dangerous script block.',
      );
    }

    const dangerousMimeTypes = [
      'application/x-msdownload',
      'application/x-sh',
      'application/javascript',
      'text/javascript',
    ];
    if (dangerousMimeTypes.includes(mimeType)) {
      throw new BadRequestException('Forbidden mime-type identified.');
    }

    // 4. Upload file using LocalStorageProvider
    const fileKey = await this.storageProvider.uploadFile(
      fileBuffer,
      sanitizedName,
      mimeType,
      `employees/${employeeProfileId}`,
    );

    // 5. Store record in database
    const doc = await this.prisma.employeeDocument.create({
      data: {
        employeeProfileId,
        category,
        name: customName || sanitizedName,
        documentPath: fileKey,
      },
    });

    this.logger.log(
      `Uploaded document ID ${doc.id} for employee ${employeeProfileId}`,
      'HrDocumentsService',
    );
    return doc;
  }

  async getDocumentsByProfile(employeeProfileId: string) {
    const employee = await this.prisma.employeeProfile.findUnique({
      where: { id: employeeProfileId },
    });
    if (!employee) {
      throw new NotFoundException('Employee Profile not found');
    }
    return this.prisma.employeeDocument.findMany({
      where: { employeeProfileId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async deleteDocument(id: string, operatorUserId: string) {
    const doc = await this.prisma.employeeDocument.findUnique({
      where: { id },
    });
    if (!doc) {
      throw new NotFoundException('HR document not found');
    }

    // Purge physical file
    try {
      await this.storageProvider.deleteFile(doc.documentPath);
    } catch (err) {
      this.logger.error(
        `Failed to delete physical file: ${doc.documentPath}`,
        err.stack,
        'HrDocumentsService',
      );
    }

    // Delete database record
    await this.prisma.employeeDocument.delete({
      where: { id },
    });

    this.logger.log(
      `Purged HR Document ${id} by user ${operatorUserId}`,
      'HrDocumentsService',
    );
    return { success: true };
  }

  // ---------------- PDF GENERATORS ----------------
  async generateOfferLetter(dto: OfferLetterDto): Promise<Buffer> {
    let name = dto.employeeName || 'Candidate';
    let addr = dto.address || '';
    let joining = dto.joiningDate;

    if (dto.employeeId) {
      const emp = await this.prisma.user.findUnique({
        where: { id: dto.employeeId },
      });
      if (emp) {
        name = `${emp.firstName} ${emp.lastName}`;
        addr = emp.address || '';
        joining = emp.joiningDate
          ? emp.joiningDate.toISOString().split('T')[0]
          : joining;
      }
    }

    const title = 'Job Offer Letter';
    const issueDate = new Date().toISOString().split('T')[0];

    const pdfBuffer = await this.buildBasePdf(
      title,
      (doc, y) => {
        doc.fillColor('#1f2937').fontSize(11).font('Helvetica');
        doc.text(`Date: ${issueDate}`, 70, y);
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').text(`To, ${name}`);
        if (addr) {
          doc.font('Helvetica').text(`Address: ${addr}`);
        }
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').text('Subject: Offer of Employment');
        doc.moveDown(1.5);

        doc.font('Helvetica').text(`Dear ${name},`, { lineGap: 3 });
        doc.moveDown(1);
        doc.text(
          `We are pleased to offer you the position of ${dto.position} in the ${dto.department} department at GREHASOFT.`,
          { lineGap: 3 },
        );
        doc.moveDown(0.8);
        doc.text(
          `Your joining date will be ${joining} and your monthly salary will be INR ${this.formatMoney(dto.salaryMonthly)}.`,
          { lineGap: 3 },
        );
        doc.moveDown(0.8);
        doc.text(
          `We look forward to working with you and wish you a successful career with GREHASOFT.`,
          { lineGap: 3 },
        );

        return doc.y;
      },
      issueDate,
      'Authorized Signatory',
    );

    return pdfBuffer;
  }

  async generateAppraisalLetter(dto: AppraisalLetterDto): Promise<Buffer> {
    const emp = await this.prisma.user.findUnique({
      where: { id: dto.employeeId },
    });
    if (!emp) {
      throw new NotFoundException('Employee not found');
    }

    const name = `${emp.firstName} ${emp.lastName}`;
    const oldSalary = Number(emp.salaryMonthly || 0);
    let newSalary = Number(dto.newMonthlySalary || 0);
    let increasePct = Number(dto.increasePercentage || 0);

    if (dto.newMonthlySalary) {
      increasePct =
        oldSalary > 0 ? ((newSalary - oldSalary) / oldSalary) * 100 : 0;
    } else if (dto.increasePercentage) {
      newSalary = oldSalary * (1 + increasePct / 100);
    }

    const title = 'Annual Appraisal Letter';
    const effective =
      dto.effectiveDate || new Date().toISOString().split('T')[0];
    const issueDate = new Date().toISOString().split('T')[0];

    const pdfBuffer = await this.buildBasePdf(
      title,
      (doc, y) => {
        doc.fillColor('#1f2937').fontSize(11).font('Helvetica');
        doc.text(`Date: ${issueDate}`, 70, y);
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').text(`Dear ${name},`);
        doc.moveDown(1.5);

        doc
          .font('Helvetica')
          .text(
            `We are pleased to inform you that your annual performance appraisal has been completed effective from ${effective}.`,
            { lineGap: 3 },
          );
        doc.moveDown(0.8);
        doc.text(
          `Your previous monthly salary was INR ${this.formatMoney(oldSalary)} and your revised monthly salary is INR ${this.formatMoney(newSalary)} (representing an increase of ${increasePct.toFixed(2)}%).`,
          { lineGap: 3 },
        );
        doc.moveDown(0.8);
        doc.text(
          `We appreciate your contributions to the organization and wish you continued success in your role.`,
          { lineGap: 3 },
        );

        return doc.y;
      },
      issueDate,
      'Authorized Signatory',
    );

    return pdfBuffer;
  }

  async generateExperienceCertificate(
    dto: ExperienceCertificateDto,
  ): Promise<Buffer> {
    const emp = await this.prisma.user.findUnique({
      where: { id: dto.employeeId },
    });
    if (!emp) {
      throw new NotFoundException('Employee not found');
    }

    const name = `${emp.firstName} ${emp.lastName}`;
    const roleContent = this.getRoleResponsibility(dto.role);
    const title = 'Experience Certificate';
    const issueDate = new Date().toISOString().split('T')[0];

    const pdfBuffer = await this.buildBasePdf(
      title,
      (doc, y) => {
        doc.fillColor('#1f2937').fontSize(12).font('Helvetica');
        doc.moveDown(3);

        doc.text(
          `This is to certify that ${name} was employed with GREHASOFT as a ${dto.role} from ${dto.startDate} to ${dto.endDate}.`,
          { lineGap: 5 },
        );
        doc.moveDown(1);
        doc.text(roleContent, { lineGap: 5 });
        doc.moveDown(1);
        doc.text(
          `During the period of employment, the employee showed sincerity, dedication, and professionalism in completing the assigned tasks and responsibilities.`,
          { lineGap: 5 },
        );
        doc.moveDown(1);
        doc.text(
          `We wish them every success in their future career and professional endeavors.`,
          { lineGap: 5 },
        );

        return doc.y;
      },
      issueDate,
      'Authorized Signatory',
    );

    return pdfBuffer;
  }

  async generateSalaryCertificate(dto: SalaryCertificateDto): Promise<Buffer> {
    const emp = await this.prisma.user.findUnique({
      where: { id: dto.employeeId },
      include: { employeeProfile: true },
    });
    if (!emp) {
      throw new NotFoundException('Employee not found');
    }

    const name = `${emp.firstName} ${emp.lastName}`;
    const designation = emp.designationId ? 'Employee' : 'Employee'; // Default fallback
    const salary = Number(emp.salaryMonthly || 0);
    const joining = emp.joiningDate
      ? emp.joiningDate.toISOString().split('T')[0]
      : '';
    const title = 'Salary Certificate';

    const pdfBuffer = await this.buildBasePdf(
      title,
      (doc, y) => {
        doc.fillColor('#1f2937').fontSize(12).font('Helvetica');
        doc.moveDown(3);

        doc.text(
          `This is to certify that ${name} is employed with GREHASOFT as a ${designation} since ${joining}.`,
          { lineGap: 5 },
        );
        doc.moveDown(1);
        doc.text(
          `The employee is currently drawing a monthly salary of INR ${this.formatMoney(salary)}. This certificate is issued upon the request of the employee for official purposes.`,
          { lineGap: 5 },
        );

        return doc.y;
      },
      dto.issueDate,
      'Authorized Signatory',
    );

    return pdfBuffer;
  }

  async generateInternshipCertificate(
    dto: InternshipCertificateDto,
  ): Promise<Buffer> {
    const title = 'Internship Certificate';
    const roleContent = this.getInternshipContent(dto.position);

    const pdfBuffer = await this.buildBasePdf(
      title,
      (doc, y) => {
        doc.fillColor('#1f2937').fontSize(12).font('Helvetica');
        doc.moveDown(3);

        doc.text(
          `This is to certify that ${dto.internName} from ${dto.collegeName} has successfully completed an internship as ${dto.position} at GREHASOFT from ${dto.startDate} to ${dto.endDate}.`,
          { lineGap: 5 },
        );
        doc.moveDown(1);
        doc.text(roleContent, { lineGap: 5 });
        doc.moveDown(1);
        doc.text(
          `The intern was hardworking, punctual, and showed a positive attitude towards learning and teamwork.`,
          { lineGap: 5 },
        );
        doc.moveDown(1);
        doc.text(
          `We wish them all the very best in their future career and professional endeavors.`,
          { lineGap: 5 },
        );

        return doc.y;
      },
      dto.issueDate,
      dto.hrName,
    );

    return pdfBuffer;
  }

  async generateAppointmentLetter(dto: AppointmentLetterDto): Promise<Buffer> {
    let name = dto.employeeName || 'Candidate';
    let addr = dto.address || '';
    let joining = dto.joiningDate;

    if (dto.employeeId) {
      const emp = await this.prisma.user.findUnique({
        where: { id: dto.employeeId },
      });
      if (emp) {
        name = `${emp.firstName} ${emp.lastName}`;
        addr = emp.address || '';
        joining = emp.joiningDate
          ? emp.joiningDate.toISOString().split('T')[0]
          : joining;
      }
    }

    const title = 'Appointment Letter';
    const issueDate = new Date().toISOString().split('T')[0];
    const probation = dto.probationPeriod || '6 months';
    const hours = dto.workingHours || '9:00 AM - 6:00 PM';

    const pdfBuffer = await this.buildBasePdf(
      title,
      (doc, y) => {
        doc.fillColor('#1f2937').fontSize(11).font('Helvetica');
        doc.text(`Date: ${issueDate}`, 70, y);
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').text(`To, ${name}`);
        if (addr) {
          doc.font('Helvetica').text(`Address: ${addr}`);
        }
        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').text('Subject: Letter of Appointment');
        doc.moveDown(1.5);

        doc.font('Helvetica').text(`Dear ${name},`, { lineGap: 3 });
        doc.moveDown(1);
        doc.text(
          `We are pleased to appoint you as ${dto.position} in the ${dto.department} department at GREHASOFT under the following terms and conditions:`,
          { lineGap: 3 },
        );
        doc.moveDown(0.8);
        doc.text(
          `1. Commencing Date: Your appointment is effective from your joining date ${joining}.`,
        );
        doc.text(
          `2. Remuneration: You will receive a monthly salary of INR ${this.formatMoney(dto.salaryMonthly)}.`,
        );
        doc.text(
          `3. Probationary Period: You will be on probation for a period of ${probation}.`,
        );
        doc.text(
          `4. Work Schedule: Your standard office working hours are ${hours}.`,
        );
        doc.moveDown(0.8);
        doc.text(
          `Please sign the duplicate copy of this letter as a token of your acceptance of these terms. We look forward to a mutually beneficial relationship.`,
          { lineGap: 3 },
        );

        return doc.y;
      },
      issueDate,
      'Authorized Signatory',
    );

    return pdfBuffer;
  }
}
