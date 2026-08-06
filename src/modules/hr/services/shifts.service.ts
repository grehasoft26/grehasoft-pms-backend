import { Injectable, NotFoundException } from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import { CreateShiftDto, AssignShiftDto } from '../dto/shifts.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly repository: HrRepository,
    private readonly logger: LoggerService
  ) {}

  async createShift(dto: CreateShiftDto, context: RequestContext) {
    const shift = await this.repository.createShift({
      name: dto.name,
      type: dto.type,
      startTime: dto.startTime,
      endTime: dto.endTime,
      gracePeriod: dto.gracePeriod ?? 15,
      nightShiftAllowance: dto.nightShiftAllowance ?? 0.00,
    });
    this.logger.audit(context.userId, 'Create Shift', 'shift', shift, { after: shift });
    return shift;
  }

  async assignShift(employeeProfileId: string, dto: AssignShiftDto, context: RequestContext) {
    const profile = await this.repository.findProfileById(employeeProfileId);
    if (!profile) throw new NotFoundException('Employee profile not found');

    const shift = await this.repository.findShiftById(dto.shiftId);
    if (!shift) throw new NotFoundException('Shift configuration not found');

    const assign = await this.repository.assignShift({
      employeeProfileId,
      shiftId: dto.shiftId,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });

    this.logger.audit(context.userId, 'Assign Shift', 'shiftAssignment', assign, { after: assign });
    return assign;
  }

  async getShifts() {
    return this.repository.findShifts();
  }

  async getShiftAssignment(employeeProfileId: string, dateStr?: string) {
    const date = dateStr ? new Date(dateStr) : new Date();
    date.setHours(0, 0, 0, 0);
    return this.repository.findShiftAssignment(employeeProfileId, date);
  }
}
