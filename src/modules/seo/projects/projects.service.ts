import { Injectable, NotFoundException } from '@nestjs/common';
import { SeoRepository } from '../repositories/seo.repository';
import { CreateSEOProjectDto } from '../dto/projects.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly repository: SeoRepository) {}

  async create(tenantId: string, dto: CreateSEOProjectDto) {
    const proj = await this.repository.createProject(tenantId, {
      clientId: dto.clientId,
      projectId: dto.projectId,
      ownerId: dto.ownerId,
      domain: dto.domain,
      status: 'ACTIVE',
    });

    await this.repository.logAudit(tenantId, 'Create SEO Project', `SEO Project created for domain ${dto.domain}.`);
    return proj;
  }

  async getProjects(tenantId: string) {
    return this.repository.findProjects(tenantId);
  }

  async getProject(tenantId: string, id: string) {
    const proj = await this.repository.findProjectById(tenantId, id);
    if (!proj) throw new NotFoundException('SEO Project not found');
    return proj;
  }
}
