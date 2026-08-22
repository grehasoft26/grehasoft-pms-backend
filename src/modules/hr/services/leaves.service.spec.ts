import { Test, TestingModule } from '@nestjs/testing';
import { LeavesService } from './leaves.service';
import { HrRepository } from '../repositories/hr.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LeaveStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('LeavesService', () => {
  let service: LeavesService;
  let repository: jest.Mocked<HrRepository>;

  const mockContext: RequestContext = {
    userId: 'admin-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'corr-uuid',
  };

  beforeEach(async () => {
    const mockRepo = {
      findLeaveBlackoutDates: jest.fn().mockResolvedValue([]),
      findLeaveTypeById: jest.fn(),
      findLeaveBalance: jest.fn(),
      createLeaveRequest: jest.fn(),
      findLeaveRequestById: jest.fn(),
      createLeaveApproval: jest.fn(),
      updateLeaveRequest: jest.fn(),
      updateLeaveBalance: jest.fn(),
      createTimelineEvent: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeavesService,
        { provide: HrRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<LeavesService>(LeavesService);
    repository = module.get(HrRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRequest', () => {
    it('should throw BadRequestException if end date is prior to start date', async () => {
      await expect(
        service.createRequest(
          'profile-uuid',
          {
            leaveTypeId: 'type-uuid',
            startDate: '2026-08-06',
            endDate: '2026-08-05',
          },
          mockContext,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create leave request successfully', async () => {
      repository.findLeaveTypeById.mockResolvedValue({
        id: 'type-uuid',
        name: 'Casual Leave',
        allowHalfDay: true,
        allowHourly: false,
      } as any);
      repository.findLeaveBalance.mockResolvedValue({
        id: 'bal-uuid',
        remaining: 10,
      } as any);
      repository.createLeaveRequest.mockResolvedValue({
        id: 'req-uuid',
      } as any);

      const result = await service.createRequest(
        'profile-uuid',
        {
          leaveTypeId: 'type-uuid',
          startDate: '2026-08-06',
          endDate: '2026-08-06',
        },
        mockContext,
      );
      expect(result.id).toEqual('req-uuid');
      expect(repository.createLeaveRequest).toHaveBeenCalled();
    });
  });
});
