import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { Prisma, EmploymentStatus, AttendanceStatus, LeaveStatus, AssetStatus, TimelineEventType } from '@prisma/client';

@Injectable()
export class HrRepository {
  constructor(public readonly prisma: PrismaService) {}

  // Business Units & Divisions
  async createBusinessUnit(data: Prisma.BusinessUnitCreateInput) {
    return this.prisma.businessUnit.create({ data });
  }

  async findBusinessUnits() {
    return this.prisma.businessUnit.findMany({ include: { divisions: true } });
  }

  async createDivision(data: Prisma.DivisionUncheckedCreateInput) {
    return this.prisma.division.create({ data });
  }

  async findDivisions() {
    return this.prisma.division.findMany({ include: { businessUnit: true } });
  }

  // Employee Profile
  async createProfile(data: Prisma.EmployeeProfileUncheckedCreateInput) {
    return this.prisma.employeeProfile.create({
      data,
      include: { user: true, businessUnit: true, division: true },
    });
  }

  async updateProfile(id: string, data: Prisma.EmployeeProfileUncheckedUpdateInput) {
    return this.prisma.employeeProfile.update({
      where: { id },
      data,
      include: { user: true, businessUnit: true, division: true },
    });
  }

  async findProfiles(filters: { status?: EmploymentStatus; buId?: string }) {
    const where: Prisma.EmployeeProfileWhereInput = {};
    if (filters.status) where.employmentStatus = filters.status;
    if (filters.buId) where.businessUnitId = filters.buId;

    return this.prisma.employeeProfile.findMany({
      where,
      include: { user: { include: { department: true, designation: true } }, businessUnit: true, division: true },
    });
  }

  async findProfileById(id: string) {
    return this.prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: { include: { department: true, designation: true } },
        businessUnit: true,
        division: true,
        documents: true,
        emergencyContacts: true,
        skills: true,
        certifications: true,
        experiences: true,
        education: true,
        leaveBalances: { include: { leaveType: true } },
        shiftAssignments: { include: { shift: true } },
      },
    });
  }

  async findProfileByUserId(userId: string) {
    return this.prisma.employeeProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async getLastEmployeeCode(year: number) {
    return this.prisma.employeeProfile.findFirst({
      where: {
        employeeCode: {
          startsWith: `EMP-${year}-`,
        },
      },
      orderBy: { employeeCode: 'desc' },
      select: { employeeCode: true },
    });
  }

  // Employee Sub-details (Skills, Contacts, Certifications, etc.)
  async addDocument(data: Prisma.EmployeeDocumentUncheckedCreateInput) {
    return this.prisma.employeeDocument.create({ data });
  }

  async addEmergencyContact(data: Prisma.EmergencyContactUncheckedCreateInput) {
    return this.prisma.emergencyContact.create({ data });
  }

  async addSkill(data: Prisma.EmployeeSkillUncheckedCreateInput) {
    return this.prisma.employeeSkill.create({ data });
  }

  async addCertification(data: Prisma.EmployeeCertificationUncheckedCreateInput) {
    return this.prisma.employeeCertification.create({ data });
  }

  async addExperience(data: Prisma.EmployeeExperienceUncheckedCreateInput) {
    return this.prisma.employeeExperience.create({ data });
  }

  async addEducation(data: Prisma.EmployeeEducationUncheckedCreateInput) {
    return this.prisma.employeeEducation.create({ data });
  }

  // Attendance
  async createAttendance(data: Prisma.AttendanceUncheckedCreateInput) {
    return this.prisma.attendance.create({ data });
  }

  async findAttendance(employeeProfileId: string, date: Date) {
    return this.prisma.attendance.findUnique({
      where: {
        employeeProfileId_date: {
          employeeProfileId,
          date,
        },
      },
      include: { workSession: true },
    });
  }

  // Shifts
  async createShift(data: Prisma.ShiftCreateInput) {
    return this.prisma.shift.create({ data });
  }

  async findShifts() {
    return this.prisma.shift.findMany();
  }

  async findShiftById(id: string) {
    return this.prisma.shift.findUnique({ where: { id } });
  }

  async assignShift(data: Prisma.ShiftAssignmentUncheckedCreateInput) {
    return this.prisma.shiftAssignment.create({ data, include: { shift: true } });
  }

  async findShiftAssignment(employeeProfileId: string, date: Date) {
    return this.prisma.shiftAssignment.findFirst({
      where: {
        employeeProfileId,
        startDate: { lte: date },
        OR: [
          { endDate: null },
          { endDate: { gte: date } },
        ],
      },
      include: { shift: true },
    });
  }

  // Holidays
  async createHoliday(data: Prisma.HolidayCreateInput) {
    return this.prisma.holiday.create({ data });
  }

  async findHolidays() {
    return this.prisma.holiday.findMany({ orderBy: { date: 'asc' } });
  }

  async findHolidayByDate(date: Date) {
    return this.prisma.holiday.findUnique({ where: { date } });
  }

  // Leaves
  async createLeaveType(data: Prisma.LeaveTypeCreateInput) {
    return this.prisma.leaveType.create({ data });
  }

  async findLeaveTypes() {
    return this.prisma.leaveType.findMany();
  }

  async findLeaveTypeById(id: string) {
    return this.prisma.leaveType.findUnique({ where: { id } });
  }

  async findLeaveTypeByCode(code: any) {
    return this.prisma.leaveType.findUnique({ where: { code } });
  }

  async findLeaveBalance(employeeProfileId: string, leaveTypeId: string) {
    return this.prisma.leaveBalance.findUnique({
      where: {
        employeeProfileId_leaveTypeId: {
          employeeProfileId,
          leaveTypeId,
        },
      },
    });
  }

  async createLeaveBalance(data: Prisma.LeaveBalanceUncheckedCreateInput) {
    return this.prisma.leaveBalance.create({ data });
  }

  async updateLeaveBalance(id: string, used: number, remaining: number) {
    return this.prisma.leaveBalance.update({
      where: { id },
      data: { used, remaining },
    });
  }

  async createLeaveRequest(data: Prisma.LeaveRequestUncheckedCreateInput) {
    return this.prisma.leaveRequest.create({
      data,
      include: { leaveType: true },
    });
  }

  async updateLeaveRequest(id: string, status: LeaveStatus) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status },
      include: { leaveType: true },
    });
  }

  async createLeaveApproval(data: Prisma.LeaveApprovalUncheckedCreateInput) {
    return this.prisma.leaveApproval.create({ data });
  }

  async findLeaveRequestById(id: string) {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true, employeeProfile: { include: { user: true } }, approvals: { include: { approver: true } } },
    });
  }

  async findLeaveRequests(filters: { status?: LeaveStatus; employeeProfileId?: string }) {
    const where: Prisma.LeaveRequestWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.employeeProfileId) where.employeeProfileId = filters.employeeProfileId;

    return this.prisma.leaveRequest.findMany({
      where,
      include: { leaveType: true, employeeProfile: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createLeaveBlackoutDate(data: Prisma.LeaveBlackoutDateCreateInput) {
    return this.prisma.leaveBlackoutDate.create({ data });
  }

  async findLeaveBlackoutDates() {
    return this.prisma.leaveBlackoutDate.findMany({ orderBy: { startDate: 'asc' } });
  }

  // Overtime Requests
  async createOvertime(data: Prisma.OvertimeRequestUncheckedCreateInput) {
    return this.prisma.overtimeRequest.create({ data });
  }

  async findOvertimeById(id: string) {
    return this.prisma.overtimeRequest.findUnique({ where: { id } });
  }

  async updateOvertimeStatus(id: string, status: LeaveStatus, approvedById?: string) {
    return this.prisma.overtimeRequest.update({
      where: { id },
      data: { status, approvedById },
    });
  }

  async findOvertimeRequests() {
    return this.prisma.overtimeRequest.findMany({
      include: { employeeProfile: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Performance Goal & Appraisals
  async createGoal(data: Prisma.PerformanceGoalUncheckedCreateInput) {
    return this.prisma.performanceGoal.create({ data });
  }

  async updateGoalProgress(id: string, progress: number) {
    return this.prisma.performanceGoal.update({
      where: { id },
      data: { progress },
    });
  }

  async findGoals(employeeProfileId: string) {
    return this.prisma.performanceGoal.findMany({ where: { employeeProfileId } });
  }

  async createReviewCycle(data: Prisma.PerformanceCycleCreateInput) {
    return this.prisma.performanceCycle.create({ data });
  }

  async findCycles() {
    return this.prisma.performanceCycle.findMany();
  }

  async createReview(data: Prisma.PerformanceReviewUncheckedCreateInput) {
    return this.prisma.performanceReview.create({ data });
  }

  async updateReview(id: string, data: Prisma.PerformanceReviewUncheckedUpdateInput) {
    return this.prisma.performanceReview.update({
      where: { id },
      data,
      include: { cycle: true, employeeProfile: { include: { user: true } } },
    });
  }

  async findReviewById(id: string) {
    return this.prisma.performanceReview.findUnique({
      where: { id },
      include: { cycle: true, employeeProfile: { include: { user: true } }, pip: true },
    });
  }

  async findReviews(filters: { employeeProfileId?: string; cycleId?: string }) {
    const where: Prisma.PerformanceReviewWhereInput = {};
    if (filters.employeeProfileId) where.employeeProfileId = filters.employeeProfileId;
    if (filters.cycleId) where.cycleId = filters.cycleId;

    return this.prisma.performanceReview.findMany({
      where,
      include: { cycle: true, employeeProfile: { include: { user: true } } },
    });
  }

  async createPip(data: Prisma.PerformanceImprovementPlanUncheckedCreateInput) {
    return this.prisma.performanceImprovementPlan.create({ data });
  }

  // Training
  async createCourse(data: Prisma.TrainingCourseCreateInput) {
    return this.prisma.trainingCourse.create({ data });
  }

  async findCourses() {
    return this.prisma.trainingCourse.findMany();
  }

  async findCourseById(id: string) {
    return this.prisma.trainingCourse.findUnique({ where: { id } });
  }

  async enrollEmployee(data: Prisma.TrainingEnrollmentUncheckedCreateInput) {
    return this.prisma.trainingEnrollment.create({ data, include: { course: true } });
  }

  async findEnrollmentById(id: string) {
    return this.prisma.trainingEnrollment.findUnique({ where: { id }, include: { course: true } });
  }

  async updateEnrollment(id: string, status: string, completionDate?: Date) {
    return this.prisma.trainingEnrollment.update({
      where: { id },
      data: { status, completionDate },
      include: { course: true },
    });
  }

  async createCertificate(data: Prisma.TrainingCertificateUncheckedCreateInput) {
    return this.prisma.trainingCertificate.create({ data });
  }

  // Asset Assignment
  async createAssetAssignment(data: Prisma.AssetAssignmentUncheckedCreateInput) {
    return this.prisma.assetAssignment.create({ data });
  }

  async updateAssetAssignment(id: string, data: Prisma.AssetAssignmentUncheckedUpdateInput) {
    return this.prisma.assetAssignment.update({ where: { id }, data });
  }

  async findAssetAssignments(employeeProfileId: string) {
    return this.prisma.assetAssignment.findMany({ where: { employeeProfileId } });
  }

  async findAssetAssignmentById(id: string) {
    return this.prisma.assetAssignment.findUnique({ where: { id } });
  }

  // Employee Timeline Auditing
  async createTimelineEvent(employeeProfileId: string, event: TimelineEventType, description: string) {
    return this.prisma.employeeTimeline.create({
      data: {
        employeeProfileId,
        event,
        description,
      },
    });
  }

  async findTimeline(employeeProfileId: string) {
    return this.prisma.employeeTimeline.findMany({
      where: { employeeProfileId },
      orderBy: { date: 'desc' },
    });
  }
}
