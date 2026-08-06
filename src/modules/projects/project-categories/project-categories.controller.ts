import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectCategoriesService } from './project-categories.service';
import { CreateProjectCategoryDto, UpdateProjectCategoryDto } from './dto/project-categories.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Categories')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-categories')
export class ProjectCategoriesController {
  constructor(private readonly categoriesService: ProjectCategoriesService) {}

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
  @Permissions('project-categories.create')
  @ApiOperation({ summary: 'Create custom project category' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateProjectCategoryDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.categoriesService.create(dto, context);
    return { message: 'Category created successfully', data };
  }

  @Get()
  @Permissions('project-categories.read')
  @ApiOperation({ summary: 'Get all project categories' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.categoriesService.getMany();
    return { message: 'Categories retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('project-categories.read')
  @ApiOperation({ summary: 'Get specific category details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.categoriesService.getById(id);
    return { message: 'Category retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('project-categories.update')
  @ApiOperation({ summary: 'Update custom project category' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectCategoryDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.categoriesService.update(id, dto, context);
    return { message: 'Category updated successfully', data };
  }

  @Delete(':id')
  @Permissions('project-categories.delete')
  @ApiOperation({ summary: 'Delete custom project category' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.categoriesService.delete(id, context);
    return { message: 'Category deleted successfully' };
  }
}
