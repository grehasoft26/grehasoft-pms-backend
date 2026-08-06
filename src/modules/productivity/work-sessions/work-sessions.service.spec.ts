import { Test, TestingModule } from '@nestjs/testing';
import { WorkSessionsService } from './work-sessions.service';
import { WorkSessionsRepository } from './work-sessions.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { AttendanceStatus, BreakType, IdleType } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('WorkSessionsService', () => {
  let service: WorkSessionsService;
  let repository: jest.Mocked<WorkSessionsRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-uuid',
  };

  const mockSession: any = {
    id: 'session-uuid',
    userId: 'test-user-uuid',
    startTime: new Date(),
    attendanceStatus: AttendanceStatus.CHECK_IN,
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findActiveSession: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      createBreak: jest.fn(),
      findActiveBreak: jest.fn(),
      updateBreak: jest.fn(),
      createIdle: jest.fn(),
      findActiveIdle: jest.fn(),
      updateIdle: jest.fn(),
      createScreenshot: jest.fn(),
      createActivityLog: jest.fn(),
      logApplicationUsage: jest.fn(),
      logWebsiteUsage: jest.fn(),
      prisma: {
        breakSession: { findMany: jest.fn().mockResolvedValue([]) },
        idleSession: { findMany: jest.fn().mockResolvedValue([]) },
        applicationUsage: { findMany: jest.fn().mockResolvedValue([]) },
        websiteUsage: { findMany: jest.fn().mockResolvedValue([]) },
      },
    };

    const mockLogger = {
      audit: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkSessionsService,
        { provide: WorkSessionsRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<WorkSessionsService>(WorkSessionsService);
    repository = module.get(WorkSessionsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startSession', () => {
    it('should start session successfully if none is active', async () => {
      repository.findActiveSession.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockSession);

      const result = await service.startSession({}, mockContext);
      expect(result).toEqual(mockSession);
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if session is already active', async () => {
      repository.findActiveSession.mockResolvedValue(mockSession);
      await expect(service.startSession({}, mockContext)).rejects.toThrow(BadRequestException);
    });
  });

  describe('startBreak', () => {
    it('should trigger new break log', async () => {
      repository.findActiveSession.mockResolvedValue(mockSession);
      repository.findActiveBreak.mockResolvedValue(null);
      repository.createBreak.mockResolvedValue({ id: 'break-uuid' } as any);

      const result = await service.startBreak({ type: BreakType.LUNCH, reason: 'Lunch Break' }, mockContext);
      expect(result.id).toEqual('break-uuid');
    });
  });
});
