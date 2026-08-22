import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import {
  CreateLeaveRequestDto,
  CreateLeaveApprovalDto,
  CreateLeaveTypeDto,
} from '../dto/leaves.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { LeaveStatus, TimelineEventType } from '@prisma/client';

@Injectable()
export class LeavesService {
  constructor(
    private readonly repository: HrRepository,
    private readonly logger: LoggerService,
  ) {}

  async createLeaveType(dto: CreateLeaveTypeDto, context: RequestContext) {
    const lt = await this.repository.createLeaveType({
      name: dto.name,
      code: dto.code,
      daysAllowed: dto.daysAllowed,
      allowHalfDay: dto.allowHalfDay ?? true,
      allowHourly: dto.allowHourly ?? false,
      carryForward: dto.carryForward ?? true,
      allowEncashment: dto.allowEncashment ?? false,
      allowNegative: dto.allowNegative ?? false,
    });
    this.logger.audit(context.userId, 'Create Leave Type', 'leaveType', lt, {
      after: lt,
    });
    return lt;
  }

  async findLeaveTypes() {
    return this.repository.findLeaveTypes();
  }

  // Create Leave request
  async createRequest(
    employeeProfileId: string,
    dto: CreateLeaveRequestDto,
    context: RequestContext,
  ) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end < start)
      throw new BadRequestException('End date cannot be prior to start date');

    // 1. Verify Blackout Dates
    const blackouts = await this.repository.findLeaveBlackoutDates();
    for (const b of blackouts) {
      if (
        (start >= b.startDate && start <= b.endDate) ||
        (end >= b.startDate && end <= b.endDate) ||
        (start <= b.startDate && end >= b.endDate)
      ) {
        throw new BadRequestException(
          `Cannot request leave: Overlaps with Blackout period: ${b.name}`,
        );
      }
    }

    const type = await this.repository.findLeaveTypeById(dto.leaveTypeId);
    if (!type) throw new NotFoundException('Leave Type not found');

    // Calculate days requested
    let daysRequested = 0;
    if (dto.isHourly) {
      if (!type.allowHourly)
        throw new BadRequestException(
          'Hourly leave not allowed for this leave type',
        );
      daysRequested = (dto.hoursRequested || 8) / 8.0;
    } else if (dto.isHalfDay) {
      if (!type.allowHalfDay)
        throw new BadRequestException(
          'Half day leave not allowed for this leave type',
        );
      daysRequested = 0.5;
    } else {
      // Days difference inclusive
      daysRequested =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
    }

    // 2. Verify Leave Balance
    const balance = await this.repository.findLeaveBalance(
      employeeProfileId,
      dto.leaveTypeId,
    );
    const remaining = balance ? Number(balance.remaining) : 0;

    if (remaining < daysRequested && !type.allowNegative) {
      throw new BadRequestException(
        `Insufficient leave balance. Requested: ${daysRequested}, Remaining: ${remaining}`,
      );
    }

    const request = await this.repository.createLeaveRequest({
      employeeProfileId,
      leaveTypeId: dto.leaveTypeId,
      startDate: start,
      endDate: end,
      isHalfDay: dto.isHalfDay ?? false,
      isHourly: dto.isHourly ?? false,
      hoursRequested: dto.hoursRequested || null,
      reason: dto.reason || '',
      status: LeaveStatus.SUBMITTED,
    });

    this.logger.audit(
      context.userId,
      'Submit Leave Request',
      'leaveRequest',
      request,
      { after: request },
    );
    return request;
  }

  // Workflow Approvals
  async approveRequest(
    id: string,
    dto: CreateLeaveApprovalDto,
    context: RequestContext,
  ) {
    const request = await this.repository.findLeaveRequestById(id);
    if (!request) throw new NotFoundException('Leave request not found');

    const currentStatus = request.status;

    // Transition checks
    if (
      dto.status === LeaveStatus.MANAGER_APPROVED &&
      currentStatus !== LeaveStatus.SUBMITTED
    ) {
      throw new BadRequestException(
        'Leave request must be Submitted to get Manager approval',
      );
    }
    if (
      dto.status === LeaveStatus.HR_APPROVED &&
      currentStatus !== LeaveStatus.MANAGER_APPROVED
    ) {
      throw new BadRequestException(
        'Leave request must have Manager approval to get HR approval',
      );
    }

    // Record approval log
    await this.repository.createLeaveApproval({
      leaveRequestId: id,
      approverId: context.userId,
      status: dto.status,
      comments: dto.comments || '',
    });

    // Update request status
    const updated = await this.repository.updateLeaveRequest(id, dto.status);

    // If HR_APPROVED, deduce leave balance
    if (dto.status === LeaveStatus.HR_APPROVED) {
      const type = request.leaveType;
      let daysDeducted = 0;
      if (request.isHourly) {
        daysDeducted = (request.hoursRequested || 8) / 8.0;
      } else if (request.isHalfDay) {
        daysDeducted = 0.5;
      } else {
        daysDeducted =
          Math.ceil(
            (request.endDate.getTime() - request.startDate.getTime()) /
              (1000 * 60 * 60 * 24),
          ) + 1;
      }

      const balance = await this.repository.findLeaveBalance(
        request.employeeProfileId,
        request.leaveTypeId,
      );
      if (balance) {
        const newUsed = Number(balance.used) + daysDeducted;
        const newRemaining = Number(balance.allocated) - newUsed;
        await this.repository.updateLeaveBalance(
          balance.id,
          newUsed,
          newRemaining,
        );
      }
    }

    this.logger.audit(
      context.userId,
      `Leave Approval: ${dto.status}`,
      'leaveRequest',
      updated,
      { before: request, after: updated },
    );
    return updated;
  }

  // Carry Forward leaves at period end
  async processCarryForward(
    employeeProfileId: string,
    context: RequestContext,
  ) {
    const balances = await this.repository.prisma.leaveBalance.findMany({
      where: { employeeProfileId },
      include: { leaveType: true },
    });

    for (const bal of balances) {
      if (bal.leaveType.carryForward && Number(bal.remaining) > 0) {
        const carryOver = Number(bal.remaining);
        // Carry forward up to 10 days max (configurable policy placeholder)
        const allowedCF = Math.min(carryOver, 10);

        const newAllocated = Number(bal.leaveType.daysAllowed) + allowedCF;
        await this.repository.prisma.leaveBalance.update({
          where: { id: bal.id },
          data: {
            allocated: newAllocated,
            remaining: newAllocated - Number(bal.used),
          },
        });
      }
    }
  }

  // Leave Encashment
  async encashLeaves(
    employeeProfileId: string,
    leaveTypeId: string,
    daysToEncash: number,
    context: RequestContext,
  ) {
    const type = await this.repository.findLeaveTypeById(leaveTypeId);
    if (!type || !type.allowEncashment) {
      throw new BadRequestException('Leave type does not allow encashment');
    }

    const balance = await this.repository.findLeaveBalance(
      employeeProfileId,
      leaveTypeId,
    );
    if (!balance || Number(balance.remaining) < daysToEncash) {
      throw new BadRequestException(
        'Insufficient remaining leave balance for encashment',
      );
    }

    const newUsed = Number(balance.used) + daysToEncash;
    const newRemaining = Number(balance.allocated) - newUsed;

    const updated = await this.repository.updateLeaveBalance(
      balance.id,
      newUsed,
      newRemaining,
    );
    this.logger.audit(
      context.userId,
      'Encash Leaves',
      'leaveBalance',
      updated,
      { after: updated },
    );
    return updated;
  }

  async getLeaveRequests(filters: {
    status?: LeaveStatus;
    employeeProfileId?: string;
  }) {
    return this.repository.findLeaveRequests(filters);
  }

  async getLeaveRequestById(id: string) {
    return this.repository.findLeaveRequestById(id);
  }

  async createBlackoutDate(
    name: string,
    start: string,
    end: string,
    description?: string,
  ) {
    return this.repository.createLeaveBlackoutDate({
      name,
      startDate: new Date(start),
      endDate: new Date(end),
      description: description || '',
    });
  }
}
