import { Injectable } from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import {
  EmploymentStatus,
  AttendanceStatus,
  LeaveStatus,
} from '@prisma/client';

@Injectable()
export class HrDashboardService {
  constructor(private readonly repository: HrRepository) {}

  async getDashboardStats() {
    const prisma = this.repository.prisma;
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // 1. Employee status aggregates
    const totalEmployees = await prisma.employeeProfile.count();
    const activeEmployees = await prisma.employeeProfile.count({
      where: { employmentStatus: EmploymentStatus.ACTIVE },
    });
    const probationEmployees = await prisma.employeeProfile.count({
      where: { employmentStatus: EmploymentStatus.PROBATION },
    });
    const noticeEmployees = await prisma.employeeProfile.count({
      where: { employmentStatus: EmploymentStatus.NOTICE_PERIOD },
    });

    // 2. Attendance aggregates for today
    const presentToday = await prisma.attendance.count({
      where: {
        date: todayStart,
        status: {
          in: [
            AttendanceStatus.PRESENT,
            AttendanceStatus.LATE,
            AttendanceStatus.REMOTE,
            AttendanceStatus.WFH,
          ],
        },
      },
    });

    const absentToday = await prisma.attendance.count({
      where: {
        date: todayStart,
        status: AttendanceStatus.ABSENT,
      },
    });

    const remoteToday = await prisma.attendance.count({
      where: {
        date: todayStart,
        status: { in: [AttendanceStatus.REMOTE, AttendanceStatus.WFH] },
      },
    });

    const lateToday = await prisma.attendance.count({
      where: {
        date: todayStart,
        status: AttendanceStatus.LATE,
      },
    });

    const onLeaveToday = await prisma.leaveRequest.count({
      where: {
        startDate: { lte: todayStart },
        endDate: { gte: todayStart },
        status: LeaveStatus.HR_APPROVED,
      },
    });

    // 3. Birthdays & Anniversaries (within 30 days)
    // We can do simple JS filtering for anniversaries
    const profiles = await prisma.employeeProfile.findMany({
      include: { user: true },
    });

    const upcomingBirthdays: any[] = [];
    const upcomingAnniversaries: any[] = [];

    const monthDayStr = (d: Date) =>
      `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayMD = monthDayStr(now);

    // Anniversaries & Birthdays list
    for (const p of profiles) {
      if (p.dateOfJoining) {
        const joinMD = monthDayStr(p.dateOfJoining);
        const years = now.getFullYear() - p.dateOfJoining.getFullYear();
        if (joinMD === todayMD && years > 0) {
          upcomingAnniversaries.push({
            employeeId: p.id,
            name: `${p.user.firstName} ${p.user.lastName}`,
            years,
          });
        }
      }
    }

    // 4. Pending Requests & Appraisals
    const pendingLeaves = await prisma.leaveRequest.count({
      where: { status: LeaveStatus.SUBMITTED },
    });

    const pendingReviews = await prisma.performanceReview.count({
      where: { status: 'SUBMITTED' },
    });

    // 5. Training & Assets
    const trainingCompletions = await prisma.trainingEnrollment.count({
      where: { status: 'COMPLETED' },
    });

    const assignedAssets = await prisma.assetAssignment.count({
      where: { status: 'ASSIGNED' },
    });

    return {
      totalEmployees,
      activeEmployees,
      probationEmployees,
      noticeEmployees,
      presentToday,
      absentToday,
      remoteToday,
      onLeaveToday,
      lateToday,
      upcomingBirthdays,
      upcomingAnniversaries,
      pendingLeaveRequests: pendingLeaves,
      pendingPerformanceReviews: pendingReviews,
      trainingCompletionCount: trainingCompletions,
      assetAllocationCount: assignedAssets,
    };
  }
}
