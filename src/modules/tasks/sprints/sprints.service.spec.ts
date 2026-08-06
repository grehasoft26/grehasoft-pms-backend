import { Test, TestingModule } from '@nestjs/testing';
import { SprintsService } from './sprints.service';
import { SprintsRepository } from './sprints.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SprintStatus } from '@prisma/client';

describe('SprintsService', () => {
  let service: SprintsService;
  let repository: jest.Mocked<SprintsRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-uuid',
  };

  const mockSprint: any = {
    id: 'sprint-uuid',
    projectId: 'project-uuid',
    name: 'Sprint 1',
    startDate: new Date(),
    endDate: new Date(),
    status: SprintStatus.PLANNING,
    goals: [],
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      addGoal: jest.fn(),
      updateGoal: jest.fn(),
      removeGoals: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SprintsService,
        { provide: SprintsRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<SprintsService>(SprintsService);
    repository = module.get(SprintsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sprint and map goals list', async () => {
      repository.create.mockResolvedValue(mockSprint);
      repository.findById.mockResolvedValue(mockSprint);

      const result = await service.create(
        {
          projectId: 'project-uuid',
          name: 'Sprint 1',
          startDate: '2026-08-01',
          endDate: '2026-08-15',
          status: SprintStatus.PLANNING,
          goals: ['Complete initial MVP features', 'Achieve 80% coverage'],
        },
        mockContext
      );

      expect(result).toEqual(mockSprint);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.addGoal).toHaveBeenCalledTimes(2);
    });
  });
});
