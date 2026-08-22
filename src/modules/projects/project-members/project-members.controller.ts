import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { ProjectMembersService } from './project-members.service';
import { AssignProjectMemberDto } from './dto/project-members.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('Project Members')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('project-members')
export class ProjectMembersController {
  constructor(private readonly membersService: ProjectMembersService) {}

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
  @Permissions('project-members.manage')
  @ApiOperation({ summary: 'Assign user to project with specific role' })
  @ApiResponse({ type: SuccessResponseDto })
  async assign(@Body() dto: AssignProjectMemberDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.membersService.assign(dto, context);
    return { message: 'Member assigned successfully', data };
  }

  @Get()
  @Permissions('project-members.read')
  @ApiOperation({ summary: 'List members assigned to a project' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('projectId') projectId: string) {
    const data = await this.membersService.getMany(projectId);
    return { message: 'Members retrieved successfully', data };
  }

  @Delete(':id')
  @Permissions('project-members.manage')
  @ApiOperation({ summary: 'Remove member assignment from project' })
  @ApiResponse({ type: SuccessResponseDto })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.membersService.remove(id, context);
    return { message: 'Member removed successfully' };
  }
}
