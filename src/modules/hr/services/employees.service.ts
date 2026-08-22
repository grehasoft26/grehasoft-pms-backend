import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import {
  CreateEmployeeProfileDto,
  AddDocumentDto,
  AddSkillDto,
  AddEmergencyContactDto,
} from '../dto/employees.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { TimelineEventType, EmploymentStatus } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly repository: HrRepository,
    private readonly logger: LoggerService,
  ) {}

  private async getNextEmployeeCode(): Promise<string> {
    const year = new Date().getFullYear();
    const lastCode = await this.repository.getLastEmployeeCode(year);
    let nextNum = 1;
    if (lastCode && lastCode.employeeCode) {
      const parts = lastCode.employeeCode.split('-');
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
    return `EMP-${year}-${String(nextNum).padStart(6, '0')}`;
  }

  async onboardEmployee(
    dto: CreateEmployeeProfileDto,
    context: RequestContext,
  ) {
    // 1. Verify user exists
    const user = await this.repository.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User profile not found');

    const existing = await this.repository.findProfileByUserId(dto.userId);
    if (existing)
      throw new BadRequestException(
        'Employee profile already exists for this user',
      );

    const employeeCode = await this.getNextEmployeeCode();

    const profile = await this.repository.createProfile({
      userId: dto.userId,
      employeeCode,
      dateOfJoining: new Date(dto.dateOfJoining),
      employmentStatus: dto.employmentStatus || EmploymentStatus.PROBATION,
      bloodGroup: dto.bloodGroup || '',
      nationality: dto.nationality || '',
      maritalStatus: dto.maritalStatus || '',
      passport: dto.passport || '',
      drivingLicense: dto.drivingLicense || '',
      aadhaar: dto.aadhaar || '',
      pan: dto.pan || '',
      bankDetails: dto.bankDetails || '',
      businessUnitId: dto.businessUnitId,
      divisionId: dto.divisionId,
      reportingManagerId: dto.reportingManagerId,
      skipLevelManagerId: dto.skipLevelManagerId,
      payrollGroup: dto.payrollGroup || '',
      salaryGrade: dto.salaryGrade || '',
      costCenter: dto.costCenter || '',
      employmentCategory: dto.employmentCategory || 'Full-time',
    });

    // Timeline event: JOINED
    await this.repository.createTimelineEvent(
      profile.id,
      TimelineEventType.JOINED,
      `Employee onboarded successfully with code ${employeeCode}`,
    );

    // Automatically allocate default leave balances
    const leaveTypes = await this.repository.findLeaveTypes();
    for (const lt of leaveTypes) {
      await this.repository.createLeaveBalance({
        employeeProfileId: profile.id,
        leaveTypeId: lt.id,
        allocated: lt.daysAllowed,
        remaining: lt.daysAllowed,
      });
    }

    this.logger.audit(
      context.userId,
      'Onboard Employee',
      'employeeProfile',
      profile,
      { after: profile },
    );
    return profile;
  }

  async updateProfile(id: string, dto: any, context: RequestContext) {
    const before = await this.repository.findProfileById(id);
    if (!before) throw new NotFoundException('Employee profile not found');

    const updated = await this.repository.updateProfile(id, dto);

    // Audit promotion/salary revision timeline events
    if (
      dto.employmentStatus &&
      dto.employmentStatus !== before.employmentStatus
    ) {
      await this.repository.createTimelineEvent(
        id,
        TimelineEventType.DEPARTMENT_CHANGE,
        `Employment status updated from ${before.employmentStatus} to ${dto.employmentStatus}`,
      );
    }

    this.logger.audit(
      context.userId,
      'Update Employee Profile',
      'employeeProfile',
      updated,
      { before, after: updated },
    );
    return updated;
  }

  async addDocument(profileId: string, dto: AddDocumentDto) {
    return this.repository.addDocument({
      employeeProfileId: profileId,
      category: dto.category,
      name: dto.name,
      documentPath: dto.documentPath,
    });
  }

  async addSkill(profileId: string, dto: AddSkillDto) {
    return this.repository.addSkill({
      employeeProfileId: profileId,
      name: dto.name,
      proficiency: dto.proficiency,
    });
  }

  async addEmergencyContact(profileId: string, dto: AddEmergencyContactDto) {
    return this.repository.addEmergencyContact({
      employeeProfileId: profileId,
      name: dto.name,
      relationship: dto.relationship,
      phone: dto.phone,
      email: dto.email,
    });
  }

  async getProfileById(id: string) {
    return this.repository.findProfileById(id);
  }

  async getProfiles(filters: { status?: EmploymentStatus; buId?: string }) {
    return this.repository.findProfiles(filters);
  }

  async getTimeline(id: string) {
    return this.repository.findTimeline(id);
  }
}
