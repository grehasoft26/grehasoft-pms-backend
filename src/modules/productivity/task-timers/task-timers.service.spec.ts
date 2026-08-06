import { Test, TestingModule } from '@nestjs/testing';
import { TaskTimersService } from './task-timers.service';
import { TaskTimersRepository } from './task-timers.repository';
import { TimeEntriesRepository } from '../time-entries/time-entries.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { BadRequestException } from '@nestjs/common';

describe('TaskTimersService', () => {
  let service: TaskTimersService;
  let repository: jest.Mocked<TaskTimersRepository>;
  let entriesRepository: jest.Mocked<TimeEntriesRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-uuid',
  };

  const mockTimer: any = {
    id: 'timer-uuid',
    userId: 'test-user-uuid',
    taskId: 'task-uuid',
    startTime: new Date(),
    isRunning: true,
    task: { projectId: 'proj-uuid' },
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findActiveTimer: jest.fn(),
      findById: jest.fn(),
      findRecoverableTimers: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockEntriesRepo = {
      create: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskTimersService,
        { provide: TaskTimersRepository, useValue: mockRepo },
        { provide: TimeEntriesRepository, useValue: mockEntriesRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TaskTimersService>(TaskTimersService);
    repository = module.get(TaskTimersRepository);
    entriesRepository = module.get(TimeEntriesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startTimer', () => {
    it('should start timer successfully if none is active', async () => {
      repository.findActiveTimer.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockTimer);

      const result = await service.startTimer({ taskId: 'task-uuid' }, mockContext);
      expect(result).toEqual(mockTimer);
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if active timer exists', async () => {
      repository.findActiveTimer.mockResolvedValue(mockTimer);
      await expect(service.startTimer({ taskId: 'task-uuid' }, mockContext)).rejects.toThrow(BadRequestException);
    });
  });

  describe('stopTimer', () => {
    it('should delete timer and create TimeEntry (Single Source of Truth)', async () => {
      repository.findById.mockResolvedValue(mockTimer);
      entriesRepository.create.mockResolvedValue({ id: 'entry-uuid' } as any);

      const result = await service.stopTimer('timer-uuid', mockContext);
      expect(result.id).toEqual('entry-uuid');
      expect(repository.delete).toHaveBeenCalledWith('timer-uuid');
      expect(entriesRepository.create).toHaveBeenCalled();
    });
  });
});
