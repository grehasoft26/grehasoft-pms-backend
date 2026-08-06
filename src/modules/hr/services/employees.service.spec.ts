import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { HrRepository } from '../repositories/hr.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { EmploymentStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repository: jest.Mocked<HrRepository>;

  const mockContext: RequestContext = {
    userId: 'admin-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'corr-uuid',
  };

  beforeEach(async () => {
    const mockRepo = {
      createProfile: jest.fn(),
      findProfileById: jest.fn(),
      findProfileByUserId: jest.fn(),
      getLastEmployeeCode: jest.fn(),
      createTimelineEvent: jest.fn(),
      findLeaveTypes: jest.fn().mockResolvedValue([]),
      createLeaveBalance: jest.fn(),
      prisma: {
        user: { findUnique: jest.fn() },
      },
    };

    const mockLogger = {
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: HrRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    repository = module.get(HrRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onboardEmployee', () => {
    it('should throw BadRequestException if profile already exists', async () => {
      repository.prisma.user.findUnique.mockResolvedValue({ id: 'user-uuid' } as any);
      repository.findProfileByUserId.mockResolvedValue({ id: 'existing-profile-uuid' } as any);

      await expect(
        service.onboardEmployee({ userId: 'user-uuid', dateOfJoining: '2026-08-06' }, mockContext)
      ).rejects.toThrow(BadRequestException);
    });

    it('should onboard employee profile successfully', async () => {
      repository.prisma.user.findUnique.mockResolvedValue({ id: 'user-uuid' } as any);
      repository.findProfileByUserId.mockResolvedValue(null);
      repository.getLastEmployeeCode.mockResolvedValue(null);
      repository.createProfile.mockResolvedValue({ id: 'new-profile-uuid', employeeCode: 'EMP-2026-000001' } as any);

      const result = await service.onboardEmployee({ userId: 'user-uuid', dateOfJoining: '2026-08-06' }, mockContext);
      expect(result.id).toEqual('new-profile-uuid');
      expect(repository.createProfile).toHaveBeenCalled();
    });
  });
});
