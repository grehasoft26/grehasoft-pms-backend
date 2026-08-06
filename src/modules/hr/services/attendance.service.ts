import { Injectable, NotFoundException } from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AttendanceStatus } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly repository: HrRepository,
    private readonly logger: LoggerService
  ) {}

  // Session mapping - generates daily Attendance from WorkSession
  async generateDailyAttendance(workSessionId: string, context: RequestContext) {
    const session = await this.repository.prisma.workSession.findUnique({
      where: { id: workSessionId },
      include: { user: true },
    });
    if (!session) throw new NotFoundException('WorkSession not found');

    const profile = await this.repository.findProfileByUserId(session.userId);
    if (!profile) return null; // not an employee

    const date = new Date(session.startTime);
    date.setHours(0, 0, 0, 0);

    // 1. Resolve active shift assignment
    const shiftAssign = await this.repository.findShiftAssignment(profile.id, date);
    let status: AttendanceStatus = AttendanceStatus.PRESENT;
    let notes = '';

    if (shiftAssign) {
      const shift = shiftAssign.shift;
      const shiftStartStr = shift.startTime; // e.g. "09:00"
      
      const checkInTime = new Date(session.startTime);
      const shiftStart = new Date(checkInTime);
      const [hrs, mins] = shiftStartStr.split(':').map((x) => parseInt(x, 10));
      shiftStart.setHours(hrs, mins, 0, 0);

      const diffMins = (checkInTime.getTime() - shiftStart.getTime()) / (60 * 1000);
      if (diffMins > shift.gracePeriod) {
        status = AttendanceStatus.LATE;
        notes = `Late check-in by ${Math.round(diffMins)} minutes (Grace: ${shift.gracePeriod}m)`;
      }
    }

    // WFH / Remote detection
    const isWfh = session.userAgent && (session.userAgent.toLowerCase().includes('remote') || session.userAgent.toLowerCase().includes('wfh'));
    if (isWfh) {
      status = AttendanceStatus.WFH;
    }

    // Check if weekend or holiday
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) {
      status = AttendanceStatus.WEEKEND;
    }

    const holiday = await this.repository.findHolidayByDate(date);
    if (holiday) {
      status = AttendanceStatus.HOLIDAY;
    }

    const attendance = await this.repository.createAttendance({
      employeeProfileId: profile.id,
      date,
      status,
      workSessionId,
      notes,
    });

    this.logger.audit(context.userId, 'Generate Attendance', 'attendance', attendance, { after: attendance });
    return attendance;
  }

  async getAttendanceRecord(profileId: string, dateStr: string) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return this.repository.findAttendance(profileId, date);
  }

  async getAttendances(filters: { profileId?: string; dateStart?: string; dateEnd?: string }) {
    const where: any = {};
    if (filters.profileId) where.employeeProfileId = filters.profileId;
    if (filters.dateStart || filters.dateEnd) {
      where.date = {};
      if (filters.dateStart) where.date.gte = new Date(filters.dateStart);
      if (filters.dateEnd) where.date.lte = new Date(filters.dateEnd);
    }

    return this.repository.prisma.attendance.findMany({
      where,
      include: { workSession: true, employeeProfile: { include: { user: true } } },
      orderBy: { date: 'desc' },
    });
  }
}
