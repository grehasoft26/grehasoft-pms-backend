import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TrainingService } from '../services/training.service';
import { CreateCourseDto, EnrollEmployeeDto, CompleteTrainingDto } from '../dto/training.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';

@ApiTags('HR Training')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/training')
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  private getContext(req: Request): RequestContext {
    const user = (req as any).user;
    return {
      userId: user?.id || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post('courses')
  @Permissions('training.manage')
  @ApiOperation({ summary: 'Create corporate training course (Mandatory vs Optional, Internal vs External)' })
  @ApiResponse({ type: SuccessResponseDto })
  async createCourse(@Body() dto: CreateCourseDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.createCourse(dto, context);
    return { message: 'Course created successfully', data };
  }

  @Post('enrollments/:profileId')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Enroll employee in a course' })
  @ApiResponse({ type: SuccessResponseDto })
  async enroll(
    @Param('profileId') profileId: string,
    @Body() dto: EnrollEmployeeDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.enrollEmployee(profileId, dto, context);
    return { message: 'Employee enrolled in course', data };
  }

  @Patch('enrollments/:id/complete')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Register course completion and issue certificate' })
  @ApiResponse({ type: SuccessResponseDto })
  async complete(
    @Param('id') id: string,
    @Body() dto: CompleteTrainingDto,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const data = await this.service.completeTraining(id, dto, context);
    return { message: 'Training completed, certificate issued', data };
  }

  @Get('courses')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get list of training courses' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCourses() {
    const data = await this.service.getCourses();
    return { message: 'Courses list', data };
  }

  @Get('enrollments/:profileId')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get course enrollments for specific employee' })
  @ApiResponse({ type: SuccessResponseDto })
  async getEnrollments(@Param('profileId') profileId: string) {
    const data = await this.service.getEnrollments(profileId);
    return { message: 'Employee enrollments list', data };
  }
}
