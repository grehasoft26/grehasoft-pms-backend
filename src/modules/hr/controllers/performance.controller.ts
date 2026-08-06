import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PerformanceService } from '../services/performance.service';
import { CreateGoalDto, UpdateGoalProgressDto, CreateReviewCycleDto, CreatePerformanceReviewDto, UpdatePerformanceReviewDto, CreatePipDto } from '../dto/performance.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('HR Performance')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/performance')
export class PerformanceController {
  constructor(private readonly service: PerformanceService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('goals/:profileId')
  @Permissions('performance.manage')
  @ApiOperation({ summary: 'Setup employee performance target goal (KPIs, Competencies)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createGoal(
    @Param('profileId') profileId: string,
    @Body() dto: CreateGoalDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.createGoal(profileId, dto, context);
    return { message: 'Goal assigned successfully', data };
  }

  @Patch('goals/:id/progress')
  @Permissions('performance.manage')
  @ApiOperation({ summary: 'Update goal progress percentage' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateGoalProgress(
    @Param('id') id: string,
    @Body() dto: UpdateGoalProgressDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.updateGoalProgress(id, dto, context);
    return { message: 'Goal progress updated', data };
  }

  @Post('cycles')
  @Permissions('performance.manage')
  @ApiOperation({ summary: 'Create new Appraisal review cycle' })
  @ApiResponse({ type: SuccessResponseDto })
  async createCycle(@Body() dto: CreateReviewCycleDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createCycle(dto, context);
    return { message: 'Review cycle created', data };
  }

  @Post('reviews/self')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Submit employee self appraisal review' })
  @ApiResponse({ type: SuccessResponseDto })
  async submitSelfReview(@Body() dto: CreatePerformanceReviewDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.submitSelfReview(dto, context);
    return { message: 'Self review submitted', data };
  }

  @Patch('reviews/:id/manager')
  @Permissions('performance.manage')
  @ApiOperation({ summary: 'Submit manager review and final score ratings (1 to 5)' })
  @ApiResponse({ type: SuccessResponseDto })
  async submitManagerReview(
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceReviewDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.submitManagerReview(id, dto, context);
    return { message: 'Manager review completed', data };
  }

  @Post('reviews/:id/pip')
  @Permissions('performance.manage')
  @ApiOperation({ summary: 'Place employee on Performance Improvement Plan (PIP)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createPip(
    @Param('id') id: string,
    @Body() dto: CreatePipDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.createPip(id, dto, context);
    return { message: 'PIP activated successfully', data };
  }

  @Get('reviews')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get list of reviews with filters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getReviews(
    @Query('employeeProfileId') employeeProfileId?: string,
    @Query('cycleId') cycleId?: string
  ) {
    const data = await this.service.getReviews({ employeeProfileId, cycleId });
    return { message: 'Reviews retrieved', data };
  }

  @Get('reviews/:id')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get review details including PIP goals' })
  @ApiResponse({ type: SuccessResponseDto })
  async getReviewById(@Param('id') id: string) {
    const data = await this.service.getReviewById(id);
    return { message: 'Review details retrieved', data };
  }
}
