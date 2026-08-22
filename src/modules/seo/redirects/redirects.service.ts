import { Injectable, BadRequestException } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';
import { CreateRedirectDto } from '../dto/redirects.dto';

@Injectable()
export class RedirectsService {
  constructor(private readonly repository: SeoRepository) {}

  async addRedirect(
    tenantId: string,
    seoProjectId: string,
    dto: CreateRedirectDto,
  ) {
    if (dto.sourcePath === dto.targetPath) {
      throw new BadRequestException(
        'Source and target redirect paths cannot be identical (causes redirect loop)',
      );
    }

    // Redirect loop chain check
    const existing = await this.repository.findRedirects(
      tenantId,
      seoProjectId,
    );
    const hasChainLoop = existing.some(
      (r) => r.sourcePath === dto.targetPath && r.targetPath === dto.sourcePath,
    );
    if (hasChainLoop) {
      throw new BadRequestException(
        'A redirect rule mapping back in the opposite direction already exists, creating a loop.',
      );
    }

    const redirect = await this.repository.createRedirect(tenantId, {
      seoProjectId,
      sourcePath: dto.sourcePath,
      targetPath: dto.targetPath,
      type: dto.type,
      isActive: true,
    });

    await this.repository.logAudit(
      tenantId,
      'Create Redirect Rule',
      `Redirect created from ${dto.sourcePath} to ${dto.targetPath}.`,
    );
    return redirect;
  }

  async getRedirects(tenantId: string, seoProjectId: string) {
    return this.repository.findRedirects(tenantId, seoProjectId);
  }
}
