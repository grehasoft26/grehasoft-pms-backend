import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from '../services/employees.service';
import { CreateEmployeeProfileDto, AddDocumentDto, AddSkillDto, AddEmergencyContactDto } from '../dto/employees.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { EmploymentStatus } from '@prisma/client';

@ApiTags('HR Employees')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('hr/employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

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
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Onboard a new employee profile (generates EMP-YYYY-000001 code)' })
  @ApiResponse({ type: SuccessResponseDto })
  async onboard(@Body() dto: CreateEmployeeProfileDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.onboardEmployee(dto, context);
    return { message: 'Employee profile onboarded successfully', data };
  }

  @Patch(':id')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Update employee profile (e.g. status changes, manager, division, payroll fields)' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: any, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.service.updateProfile(id, dto, context);
    return { message: 'Employee profile updated successfully', data };
  }

  @Post(':id/documents')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Attach a document category (Offer Letter, Contract, PAN, Aadhaar, etc.)' })
  @ApiResponse({ type: SuccessResponseDto })
  async addDocument(@Param('id') id: string, @Body() dto: AddDocumentDto) {
    const data = await this.service.addDocument(id, dto);
    return { message: 'Document attached successfully', data };
  }

  @Post(':id/skills')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Add employee skills proficiency' })
  @ApiResponse({ type: SuccessResponseDto })
  async addSkill(@Param('id') id: string, @Body() dto: AddSkillDto) {
    const data = await this.service.addSkill(id, dto);
    return { message: 'Skill registered successfully', data };
  }

  @Post(':id/emergency-contacts')
  @Permissions('hr.manage')
  @ApiOperation({ summary: 'Add emergency contact details' })
  @ApiResponse({ type: SuccessResponseDto })
  async addContact(@Param('id') id: string, @Body() dto: AddEmergencyContactDto) {
    const data = await this.service.addEmergencyContact(id, dto);
    return { message: 'Emergency contact added', data };
  }

  @Get()
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get list of employees with filters' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany(@Query('status') status?: EmploymentStatus, @Query('buId') buId?: string) {
    const data = await this.service.getProfiles({ status, buId });
    return { message: 'Employee list retrieved', data };
  }

  @Get(':id')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get employee details with skills, documents, and shift history' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.service.getProfileById(id);
    return { message: 'Employee profile details retrieved', data };
  }

  @Get(':id/timeline')
  @Permissions('hr.read')
  @ApiOperation({ summary: 'Get employee promotion, department changes, transfer timeline events' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTimeline(@Param('id') id: string) {
    const data = await this.service.getTimeline(id);
    return { message: 'Employee timeline history retrieved', data };
  }
}
