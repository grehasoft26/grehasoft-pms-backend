import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectTemplatesService } from './project-templates.service';
import { CreateProjectTemplateDto, UpdateProjectTemplateDto } from './dto/project-templates.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Templates')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-templates')
export class ProjectTemplatesController {
  constructor(private readonly templatesService: ProjectTemplatesService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @Permissions('project-templates.create')
  @ApiOperation({ summary: 'Create reusable project template' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectTemplateDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.templatesService.create(dto, context);
    return { message: 'Template created successfully', data };
  }

  @Get()
  @Permissions('project-templates.read')
  @ApiOperation({ summary: 'List reusable templates' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.templatesService.getMany();
    return { message: 'Templates retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('project-templates.read')
  @ApiOperation({ summary: 'Get specific template details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.templatesService.getById(id);
    return { message: 'Template details retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('project-templates.update')
  @ApiOperation({ summary: 'Update reusable template' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectTemplateDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.templatesService.update(id, dto, context);
    return { message: 'Template updated successfully', data };
  }

  @Delete(':id')
  @Permissions('project-templates.delete')
  @ApiOperation({ summary: 'Soft delete reusable template' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.templatesService.delete(id, context);
    return { message: 'Template deleted successfully' };
  }
}
