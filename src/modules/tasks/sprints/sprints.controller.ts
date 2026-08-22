import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SprintsService } from './sprints.service';
import {
  CreateSprintDto,
  UpdateSprintDto,
  CreateSprintGoalDto,
} from './dto/sprints.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Sprints')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('sprints')
export class SprintsController {
  constructor(private readonly sprintsService: SprintsService) {}

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
  @Permissions('sprints.create')
  @ApiOperation({ summary: 'Create sprint planning' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateSprintDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.sprintsService.create(dto, context);
    return { message: 'Sprint created successfully', data };
  }

  @Get()
  @Permissions('sprints.read')
  @ApiOperation({ summary: 'List all sprints under project' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId: string) {
    const data = await this.sprintsService.getMany(projectId);
    return { message: 'Sprints retrieved successfully', data };
  }

  @Get(':id')
  @Permissions('sprints.read')
  @ApiOperation({ summary: 'Get specific sprint details (with tasks list)' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.sprintsService.getById(id);
    return { message: 'Sprint details retrieved successfully', data };
  }

  @Patch(':id')
  @Permissions('sprints.update')
  @ApiOperation({ summary: 'Update sprint name, dates, or active status' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSprintDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.sprintsService.update(id, dto, context);
    return { message: 'Sprint updated successfully', data };
  }

  @Delete(':id')
  @Permissions('sprints.delete')
  @ApiOperation({ summary: 'Soft delete sprint planning' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.sprintsService.delete(id, context);
    return { message: 'Sprint deleted successfully' };
  }

  // Goals
  @Post(':sprintId/goals')
  @Permissions('sprints.update')
  @ApiOperation({ summary: 'Add sprint goal' })
  @ApiResponse({ type: SuccessResponseDto })
  async addGoal(
    @Param('sprintId') sprintId: string,
    @Body('goal') goal: string,
  ) {
    const data = await this.sprintsService.addGoal(sprintId, goal);
    return { message: 'Sprint goal added successfully', data };
  }

  @Patch('goals/:goalId')
  @Permissions('sprints.update')
  @ApiOperation({ summary: 'Update sprint goal achievement status' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateGoal(
    @Param('goalId') goalId: string,
    @Body('isAchieved') isAchieved: boolean,
  ) {
    const data = await this.sprintsService.updateGoal(goalId, isAchieved);
    return { message: 'Sprint goal updated', data };
  }
}
