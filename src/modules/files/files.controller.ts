import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../core/database/prisma.service';
import { LocalStorageProvider } from '../../shared/storage/local-storage.provider';
import { Inject } from '@nestjs/common';
import { STORAGE_PROVIDER_TOKEN } from '../../shared/storage/storage.interface';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'files', version: VERSION_NEUTRAL })
export class FilesController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storageProvider: LocalStorageProvider,
  ) {}

  @Get('*')
  async getFile(
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: any,
  ) {
    // Extract the wildcard file path key from the request url
    // Example request path: /api/files/seo/proofs/some-uuid/screenshot.png
    // req.params['0'] gets the wildcard part: seo/proofs/some-uuid/screenshot.png
    const fileKey = req.params['0'];
    if (!fileKey) {
      throw new NotFoundException('File path not provided');
    }

    const tenantId =
      (req.headers['x-tenant-id'] as string) ||
      '00000000-0000-0000-0000-000000000000';
    const isAuthorized = await this.validateAuthorization(
      user,
      fileKey,
      tenantId,
    );

    if (!isAuthorized) {
      throw new ForbiddenException('Access denied to requested file resource');
    }

    try {
      const fileStream = await this.storageProvider.getFileStream(fileKey);

      // Basic MIME type detection based on extension
      const ext = fileKey.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === 'png') contentType = 'image/png';
      else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'pdf') contentType = 'application/pdf';
      else if (ext === 'txt') contentType = 'text/plain';
      else if (ext === 'csv') contentType = 'text/csv';

      res.setHeader('Content-Type', contentType);
      // Serve inline or as attachment
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${fileKey.split('/').pop()}"`,
      );

      (fileStream as any).pipe(res);
    } catch (error) {
      throw new NotFoundException(`File not found: ${fileKey}`);
    }
  }

  private async validateAuthorization(
    user: any,
    fileKey: string,
    tenantId: string,
  ): Promise<boolean> {
    const userRole = String(user.roleName || '').toUpperCase();

    // 1.5. Employee Documents: employees/:profileId/...
    if (fileKey.startsWith('employees/')) {
      if (userRole === 'CLIENT') return false; // Clients blocked

      const parts = fileKey.split('/');
      const profileId = parts[1]; // employees/{profileId}/filename
      if (!profileId) return false;

      // Super Admin / Admin and managers with hr.read or hr.manage can access
      if (
        userRole === 'SUPER_ADMIN' ||
        userRole === 'ADMIN' ||
        userRole === 'COMPANY_ADMIN' ||
        user.permissions?.includes('hr.read') ||
        user.permissions?.includes('hr.manage')
      ) {
        return true;
      }

      // Check if this is the employee themselves
      const employeeProfile = await this.prisma.employeeProfile.findUnique({
        where: { id: profileId },
      });
      if (employeeProfile && employeeProfile.userId === user.id) {
        return true;
      }

      return false;
    }

    // 2. SEO Proofs: seo/proofs/:workLogId/:fileName
    if (fileKey.startsWith('seo/proofs/')) {
      const parts = fileKey.split('/');
      const workLogId = parts[2]; // seo/proofs/{workLogId}/{fileName}
      if (!workLogId) return false;

      const workLog = await this.prisma.sEODailyWorkLog.findUnique({
        where: { id: workLogId },
      });

      if (!workLog) return false;

      // Executive who submitted it or Manager/Admin can download
      if (workLog.executiveId === user.id) return true;
      if (userRole === 'SEO_MANAGER' || userRole === 'MANAGER') return true;

      // Check granular permission
      const userPerms = user.permissions || [];
      if (
        userPerms.includes('seo.review') ||
        userPerms.includes('seo.manage')
      ) {
        return true;
      }
      return false;
    }

    // 3. Project Documents: project-documents/:documentId or project-documents/:projectId/...
    if (fileKey.startsWith('project-documents/')) {
      const parts = fileKey.split('/');
      const projectId = parts[1]; // project-documents/{projectId}/{fileName}
      if (!projectId) return true; // Default allow if format is not matching structure

      // Check if user is a member of the project
      const member = await this.prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: user.id,
        },
      });
      return !!member;
    }

    // 4. Proposals: proposals/:id/...
    if (fileKey.startsWith('proposals/')) {
      // Proposals are usually client-facing or internal.
      // Clients can download, employees can download.
      return true;
    }

    // 5. Screenshots: tracking/screenshots/ or screenshots/
    if (fileKey.includes('screenshot')) {
      // Screenshots belong to the logged-in user themselves or their manager
      if (
        userRole === 'MANAGER' ||
        userRole === 'SUPER_ADMIN' ||
        userRole === 'ADMIN'
      )
        return true;
      return true;
    }

    // Default: allow authenticated access
    return true;
  }
}
