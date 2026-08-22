import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import {
  CreateTeamDto,
  UpdateTeamDto,
  TeamAssignmentsDto,
} from './dto/teams.dto';
import { Status } from '@prisma/client';

@ApiTags('Teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  private getContext(req: Request): RequestContext {
    return {
      userId: (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new team' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateTeamDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.teamsService.create(dto, context);
    return { message: 'Team created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all teams with members details' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.teamsService.getMany();
    return { message: 'Teams retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific team by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.teamsService.getById(id);
    return { message: 'Team retrieved successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team details' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.teamsService.update(id, dto, context);
    return { message: 'Team updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a team' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.teamsService.delete(id, context);
    return { message: 'Team soft-deleted successfully' };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted team' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.teamsService.restore(id, context);
    return { message: 'Team restored successfully', data };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a team' })
  @ApiResponse({ type: SuccessResponseDto })
  async activate(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.teamsService.setStatus(id, Status.ACTIVE, context);
    return { message: 'Team activated successfully', data };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a team' })
  @ApiResponse({ type: SuccessResponseDto })
  async deactivate(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.teamsService.setStatus(
      id,
      Status.INACTIVE,
      context,
    );
    return { message: 'Team deactivated successfully', data };
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Assign a list of members to a team with roles' })
  @ApiResponse({ type: SuccessResponseDto })
  async assignMembers(
    @Param('id') id: string,
    @Body() dto: TeamAssignmentsDto,
    @Req() req: Request,
  ) {
    const context = this.getContext(req);
    const data = await this.teamsService.assignMembers(
      id,
      dto.members,
      context,
    );
    return { message: 'Members assigned to team successfully', data };
  }
}
