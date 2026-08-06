import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OpportunitiesService } from './opportunities.service';
import { CreateOpportunityDto, UpdateOpportunityDto, OpportunityFilterDto, ConvertLeadDto } from './dto/opportunities.dto';
import { CreatePipelineDto, CreatePipelineStageDto } from './dto/pipelines.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Opportunities')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

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
  @Permissions('opportunities.create')
  @ApiOperation({ summary: 'Create a new Opportunity' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateOpportunityDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.opportunitiesService.create(dto, context);
    return { message: 'Opportunity created successfully', data };
  }

  @Get()
  @Permissions('opportunities.read')
  @ApiOperation({ summary: 'Get all Opportunities with advanced search, filter, and pagination' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query() query: OpportunityFilterDto) {
    const { data, totalCount } = await this.opportunitiesService.getMany(query);
    const page = query.page || 1;
    const limit = query.limit || 10;
    const totalPages = Math.ceil(totalCount / limit);

    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Opportunities retrieved successfully',
      data,
      meta: {
        totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  @Post('convert')
  @Permissions('opportunities.convert')
  @ApiOperation({ summary: 'Convert qualified Lead into Opportunity' })
  @ApiResponse({ type: SuccessResponseDto })
  async convert(@Body() dto: ConvertLeadDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.opportunitiesService.convertLead(dto, context);
    return { message: 'Lead successfully converted to Opportunity', data };
  }

  @Get(':id')
  @Permissions('opportunities.read')
  @ApiOperation({ summary: 'Get specific Opportunity details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.opportunitiesService.getById(id);
    return { message: 'Opportunity details retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('opportunities.update')
  @ApiOperation({ summary: 'Update Opportunity details and line items' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateOpportunityDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.opportunitiesService.update(id, dto, context);
    return { message: 'Opportunity updated successfully', data };
  }

  @Delete(':id')
  @Permissions('opportunities.delete')
  @ApiOperation({ summary: 'Soft delete an Opportunity' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.opportunitiesService.delete(id, context);
    return { message: 'Opportunity soft-deleted successfully' };
  }

  @Post(':id/restore')
  @Permissions('opportunities.restore')
  @ApiOperation({ summary: 'Restore soft-deleted Opportunity' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.opportunitiesService.restore(id, context);
    return { message: 'Opportunity restored successfully', data };
  }

  @Get(':id/timeline')
  @Permissions('opportunities.read')
  @ApiOperation({ summary: 'Retrieve Opportunity lifecycle timeline logs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTimeline(@Param('id') id: string) {
    const data = await this.opportunitiesService.getTimeline(id);
    return { message: 'Opportunity timeline logs retrieved successfully', data };
  }

  // Pipeline Endpoints
  @Post('pipelines')
  @Permissions('opportunities.update')
  @ApiOperation({ summary: 'Create custom Sales Pipeline' })
  @ApiResponse({ type: SuccessResponseDto })
  async createPipeline(@Body() dto: CreatePipelineDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.opportunitiesService.createPipeline(dto, context);
    return { message: 'Sales Pipeline created successfully', data };
  }

  @Get('pipelines')
  @Permissions('opportunities.read')
  @ApiOperation({ summary: 'Get all Pipelines' })
  @ApiResponse({ type: SuccessResponseDto })
  async getPipelines() {
    const data = await this.opportunitiesService.getPipelines();
    return { message: 'Pipelines retrieved successfully', data };
  }

  @Get('pipelines/:pipelineId')
  @Permissions('opportunities.read')
  @ApiOperation({ summary: 'Get specific Pipeline details and stages' })
  @ApiResponse({ type: SuccessResponseDto })
  async getPipelineById(@Param('pipelineId') pipelineId: string) {
    const data = await this.opportunitiesService.getPipelineById(pipelineId);
    return { message: 'Pipeline details retrieved successfully', data };
  }

  @Post('pipelines/:pipelineId/stages')
  @Permissions('opportunities.update')
  @ApiOperation({ summary: 'Create custom Pipeline Stage under pipeline' })
  @ApiResponse({ type: SuccessResponseDto })
  async createStage(
    @Param('pipelineId') pipelineId: string,
    @Body() dto: CreatePipelineStageDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    dto.pipelineId = pipelineId;
    const data = await this.opportunitiesService.createPipelineStage(dto, context);
    return { message: 'Pipeline Stage created successfully', data };
  }
}
