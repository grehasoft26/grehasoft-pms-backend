import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceService } from './performance.service';
import { HrRepository } from '../repositories/hr.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let repository: jest.Mocked<HrRepository>;

  const mockContext: RequestContext = {
    userId: 'admin-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'corr-uuid',
  };

  beforeEach(async () => {
    const mockRepo = {
      createGoal: jest.fn(),
      updateGoalProgress: jest.fn(),
      findGoals: jest.fn(),
      createReviewCycle: jest.fn(),
      createReview: jest.fn(),
      updateReview: jest.fn(),
      findReviewById: jest.fn(),
      createPip: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: HrRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
    repository = module.get(HrRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createGoal', () => {
    it('should assign a goal successfully', async () => {
      repository.createGoal.mockResolvedValue({ id: 'goal-uuid' } as any);
      const result = await service.createGoal(
        'profile-uuid',
        { title: 'Reach KPI', targetDate: '2026-12-31' },
        mockContext,
      );
      expect(result.id).toEqual('goal-uuid');
      expect(repository.createGoal).toHaveBeenCalled();
    });
  });
});
