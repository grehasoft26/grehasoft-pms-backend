import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let repository: jest.Mocked<TasksRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockContext: RequestContext = {
    userId: 'test-user-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-uuid',
  };

  const mockTask: any = {
    id: 'task-uuid',
    code: 'TSK-2026-000001',
    projectId: 'project-uuid',
    title: 'Implement Kanban drag-and-drop',
    description: 'Add position shifting and status update',
    typeId: 'type-uuid',
    statusId: 'status-todo-uuid',
    priorityId: 'priority-high-uuid',
    estimatedHours: 8,
    actualHours: 0,
    remainingHours: 8,
    position: 0,
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      permanentDelete: jest.fn(),
      generateTaskCode: jest.fn().mockResolvedValue('TSK-2026-000001'),
      syncAssignees: jest.fn(),
      syncLabels: jest.fn(),
      getMaxPosition: jest.fn().mockResolvedValue(0),
      createTimeline: jest.fn(),
      prisma: {
        task: { updateMany: jest.fn(), update: jest.fn() },
        taskChecklist: { findMany: jest.fn() },
        taskChecklistItem: { create: jest.fn() },
        taskStatus: { findFirst: jest.fn().mockResolvedValue({ id: 'status-done-uuid', code: 'DONE' }) },
      },
    };

    const mockLogger = {
      audit: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const mockEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
        { provide: EventEmitter2, useValue: mockEmitter },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    repository = module.get(TasksRepository);
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create task, setup position and emit event', async () => {
      repository.create.mockResolvedValue(mockTask);
      repository.findById.mockResolvedValue(mockTask);

      const result = await service.create(
        {
          projectId: 'project-uuid',
          title: 'Implement Kanban drag-and-drop',
          description: 'Add position shifting and status update',
          typeId: 'type-uuid',
          statusId: 'status-todo-uuid',
          priorityId: 'priority-high-uuid',
          estimatedHours: 8,
          assigneeIds: ['assignee-uuid'],
        },
        mockContext
      );

      expect(result).toEqual(mockTask);
      expect(repository.create).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('task.assigned', expect.any(Object));
    });
  });

  describe('update', () => {
    it('should update properties, remaining hours and status change event', async () => {
      repository.findById.mockResolvedValueOnce(mockTask);
      const updated = { ...mockTask, statusId: 'status-done-uuid' };
      repository.update.mockResolvedValue(updated);
      repository.findById.mockResolvedValueOnce(updated);

      const result = await service.update(
        'task-uuid',
        { statusId: 'status-done-uuid' },
        mockContext
      );

      expect(result.statusId).toEqual('status-done-uuid');
      expect(eventEmitter.emit).toHaveBeenCalledWith('task.status.changed', expect.any(Object));
    });
  });

  describe('updatePosition', () => {
    it('should drag task and trigger position shift updates', async () => {
      repository.findById.mockResolvedValue(mockTask);
      repository.findById.mockResolvedValue({ ...mockTask, position: 2 });

      const result = await service.updatePosition('task-uuid', 'status-todo-uuid', 2, mockContext);
      expect(repository.prisma.task.update).toHaveBeenCalled();
    });
  });
});
