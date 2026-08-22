/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProductivityReportsService,
  RequestingUser,
} from './productivity-reports.service';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  generateProductivityPdf,
  generateProductivityCsv,
} from '../utils/pdf-generator.helper';
import { ForbiddenException } from '@nestjs/common';

describe('ProductivityReportsService', () => {
  let service: ProductivityReportsService;
  let prisma: any;

  const mockAdminUser: RequestingUser = {
    id: 'admin-uuid',
    email: 'admin@grehasoft.com',
    roleId: 'role-admin',
    roleName: 'Super Admin',
    permissions: ['reports.read', 'reports.manage'],
  };

  const mockManagerUser: RequestingUser = {
    id: 'manager-uuid',
    email: 'manager@grehasoft.com',
    roleId: 'role-manager',
    roleName: 'Manager',
    permissions: ['reports.read'],
  };

  const mockEmployeeUser: RequestingUser = {
    id: 'employee-uuid',
    email: 'employee@grehasoft.com',
    roleId: 'role-employee',
    roleName: 'Employee',
    permissions: ['reports.read'],
  };

  const mockEmployee2User: RequestingUser = {
    id: 'employee2-uuid',
    email: 'employee2@grehasoft.com',
    roleId: 'role-employee',
    roleName: 'Employee',
    permissions: ['reports.read'],
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: { findMany: jest.fn(), findUnique: jest.fn() },
      workSession: { findMany: jest.fn() },
      activityLog: { findMany: jest.fn() },
      applicationUsage: { findMany: jest.fn() },
      department: { findMany: jest.fn() },
      team: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductivityReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProductivityReportsService>(
      ProductivityReportsService,
    );
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prisma).toBeDefined();
  });

  describe('Daily & Reconciliation Report Calculations', () => {
    it('should calculate multiple sessions, breaks, productive/idle times, portal sessions, unaccounted times, workday spans, and activity percentages correctly', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'employee-uuid',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@grehasoft.com',
          departmentId: 'dept-1',
        },
      ] as any);

      const dateStr = '2026-08-18';
      const s1Start = new Date(`${dateStr}T09:00:00`);
      const s1End = new Date(`${dateStr}T12:00:00`);
      const s2Start = new Date(`${dateStr}T13:00:00`);
      const s2End = new Date(`${dateStr}T14:00:00`);
      const s3Start = new Date(`${dateStr}T15:00:00`);
      const s3End = new Date(`${dateStr}T17:00:00`);

      prisma.workSession.findMany.mockResolvedValue([
        {
          id: 's1',
          userId: 'employee-uuid',
          startTime: s1Start,
          endTime: s1End,
          productiveTime: 7200,
          idleTime: 3600,
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Electron/28.2.0',
        },
        {
          id: 's2',
          userId: 'employee-uuid',
          startTime: s2Start,
          endTime: s2End,
          productiveTime: 0,
          idleTime: 0,
          userAgent: 'Mozilla/5.0 (Windows; Chrome/120.0)',
        },
        {
          id: 's3',
          userId: 'employee-uuid',
          startTime: s3Start,
          endTime: s3End,
          productiveTime: 5400,
          idleTime: 1800,
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Electron/28.2.0',
        },
      ] as any);

      prisma.activityLog.findMany.mockResolvedValue([
        {
          id: 'l1',
          workSessionId: 's1',
          timestamp: new Date(`${dateStr}T09:00:00`),
        },
        {
          id: 'l2',
          workSessionId: 's1',
          timestamp: new Date(`${dateStr}T09:30:00`),
        },
        {
          id: 'l3',
          workSessionId: 's1',
          timestamp: new Date(`${dateStr}T10:30:00`),
        },
        {
          id: 'l4',
          workSessionId: 's1',
          timestamp: new Date(`${dateStr}T12:00:00`),
        },
      ] as any);

      const report = await service.getDailyReportData(
        mockAdminUser,
        dateStr,
        dateStr,
        'employee-uuid',
      );

      expect(report.length).toBe(1);
      const row = report[0];

      expect(row.productive_time).toBe('03:30:00');
      expect(row.idle_time).toBe('01:30:00');
      expect(row.desktop_work_time).toBe('05:00:00');
      expect(row.portal_active_time).toBe('01:00:00');
      expect(row.break_time).toBe('04:57:00');
      expect(row.workday_span).toBe('08:00:00');
      expect(row.total_engagement_time).toBe('06:00:00');
      expect(row.raw_unaccounted_seconds).toBe(0);
      expect(row.activity_percentage).toBe(70.0);
    });

    it('should correctly reconcile sessions and calculate unaccounted session times', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'employee-uuid',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@grehasoft.com',
        },
      ] as any);

      const dateStr = '2026-08-18';
      prisma.workSession.findMany.mockResolvedValue([
        {
          id: 's1',
          userId: 'employee-uuid',
          startTime: new Date(`${dateStr}T09:00:00`),
          endTime: new Date(`${dateStr}T11:00:00`),
          productiveTime: 3600,
          idleTime: 1800,
          userAgent: 'Electron',
        },
      ] as any);

      // Only mock 1 log to avoid in-session gaps and simulate exactly 30 minutes of unaccounted time
      prisma.activityLog.findMany.mockResolvedValue([
        {
          id: 'l1',
          workSessionId: 's1',
          timestamp: new Date(`${dateStr}T09:00:00`),
        },
      ] as any);

      const report = await service.getReconciliationReportData(
        mockAdminUser,
        dateStr,
        dateStr,
        'employee-uuid',
      );

      expect(report.length).toBe(1);
      const row = report[0];

      expect(row.session_duration).toBe('02:00:00');
      expect(row.unaccounted_session_time).toBe('00:30:00');
    });

    it('should flag anomalies in Session Audit', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'employee-uuid',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@grehasoft.com',
        },
      ] as any);

      const dateStr = '2026-08-18';
      prisma.workSession.findMany.mockResolvedValue([
        {
          id: 's1',
          userId: 'employee-uuid',
          startTime: new Date(`${dateStr}T09:00:00`),
          endTime: new Date(`${dateStr}T10:00:00`),
          productiveTime: 4000,
          idleTime: 1000,
          userAgent: 'Electron',
          user: {
            id: 'employee-uuid',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@grehasoft.com',
          },
        },
      ] as any);

      const report = await service.getSessionAuditData(
        mockAdminUser,
        dateStr,
        dateStr,
        'employee-uuid',
      );

      expect(report.length).toBe(1);
      expect(report[0].severity).toBe('Warning');
      expect(report[0].validation_status).toContain(
        'exceeds elapsed session duration',
      );
    });

    it('should report zero-activity employees gracefully', async () => {
      prisma.user.findMany.mockResolvedValue([
        {
          id: 'employee-uuid',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@grehasoft.com',
        },
      ] as any);
      prisma.workSession.findMany.mockResolvedValue([]);

      const report = await service.getDailyReportData(
        mockAdminUser,
        '2026-08-18',
        '2026-08-18',
      );

      expect(report.length).toBe(0);
    });
  });

  describe('Security and RBAC Isolation Rules', () => {
    it('should allow employees to fetch only their own reports', async () => {
      prisma.department.findMany.mockResolvedValue([]);
      prisma.team.findMany.mockResolvedValue([]);
      prisma.workSession.findMany.mockResolvedValue([]);

      prisma.user.findMany.mockResolvedValue([
        {
          id: 'employee-uuid',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@grehasoft.com',
        },
      ] as any);

      await expect(
        service.getDailyReportData(
          mockEmployeeUser,
          '2026-08-18',
          '2026-08-18',
          'employee-uuid',
        ),
      ).resolves.toBeDefined();

      await expect(
        service.getDailyReportData(
          mockEmployeeUser,
          '2026-08-18',
          '2026-08-18',
          'employee2-uuid',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should restrict managers to department/team members only', async () => {
      prisma.department.findMany.mockResolvedValue([
        { id: 'dept-1', managerId: 'manager-uuid' },
      ] as any);
      prisma.team.findMany.mockResolvedValue([]);
      prisma.workSession.findMany.mockResolvedValue([]);

      prisma.user.findMany
        .mockResolvedValueOnce([
          { id: 'employee-uuid' },
          { id: 'manager-uuid' },
        ] as any)
        .mockResolvedValueOnce([
          {
            id: 'employee-uuid',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@grehasoft.com',
          },
        ] as any);

      await expect(
        service.getDailyReportData(
          mockManagerUser,
          '2026-08-18',
          '2026-08-18',
          'employee-uuid',
        ),
      ).resolves.toBeDefined();

      // Mock manager query for unauthorized employee2
      prisma.user.findMany.mockResolvedValueOnce([
        { id: 'manager-uuid' }, // manager cannot see employee2
      ] as any);

      await expect(
        service.getDailyReportData(
          mockManagerUser,
          '2026-08-18',
          '2026-08-18',
          'employee2-uuid',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject client roles entirely', async () => {
      const mockClientUser: RequestingUser = {
        id: 'client-uuid',
        email: 'client@company.com',
        roleId: 'role-client',
        roleName: 'Client',
        permissions: ['reports.read'],
      };

      await expect(
        service.getDailyReportData(mockClientUser, '2026-08-18', '2026-08-18'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Export Generators', () => {
    it('should successfully build CSV logs and landscape PDF documents', async () => {
      const testRows = [
        {
          employee_name: 'John Doe',
          employee_code: 'GS-26-ABCD',
          date: '2026-08-18',
          productive_time: '04:00:00',
          idle_time: '01:00:00',
          desktop_work_time: '05:00:00',
          portal_active_time: '00:00:00',
          break_time: '02:00:00',
          unaccounted_time: '01:00:00',
          total_engagement_time: '05:00:00',
          workday_span: '08:00:00',
          activity_percentage: 80.0,
          status: 'Offline',
        },
      ];

      const csv = generateProductivityCsv('daily', testRows);
      expect(csv).toContain('Employee,Code,Date,Productive Time');
      expect(csv).toContain('"John Doe","GS-26-ABCD","2026-08-18"');

      const pdf = await generateProductivityPdf(
        'daily',
        testRows,
        'Test Report',
      );
      expect(pdf).toBeInstanceOf(Buffer);
      expect(pdf.length).toBeGreaterThan(0);
    });
  });
});
