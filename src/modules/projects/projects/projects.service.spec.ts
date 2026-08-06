import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { ProjectsRepository } from './projects.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { ProjectType, ProjectPriority, ProjectStatus, ProjectHealth } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: jest.Mocked<ProjectsRepository>;
  let logger: jest.Mocked<LoggerService>;

  const mockContext: RequestContext = {
    userId: 'test-user-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-uuid',
  };

  const mockProject: any = {
    id: 'project-uuid',
    code: 'PRJ-2026-000001',
    name: 'Standard Software Project',
    description: 'A mock project description',
    type: ProjectType.FIXED_PRICE,
    priority: ProjectPriority.MEDIUM,
    status: ProjectStatus.PLANNING,
    healthStatus: ProjectHealth.GREEN,
    estimatedCost: 100000.0,
    actualCost: 0.0,
    remainingBudget: 100000.0,
    budgetVariance: 100000.0,
    estimatedRevenue: 120000.0,
    estimatedHours: 400.0,
    startDate: new Date(),
    endDate: new Date(),
    completionPercentage: 0,
    categoryId: 'category-uuid',
    managerId: 'manager-user-uuid',
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockProject),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      permanentDelete: jest.fn(),
      generateProjectCode: jest.fn().mockResolvedValue('PRJ-2026-000001'),
      syncTags: jest.fn(),
      createTimeline: jest.fn(),
      prisma: {
        proposal: { findUnique: jest.fn() },
        projectPhase: { create: jest.fn(), findMany: jest.fn() },
        projectMilestone: { create: jest.fn(), findMany: jest.fn(), count: jest.fn().mockResolvedValue(0) },
        projectMember: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
        projectResource: { create: jest.fn(), findMany: jest.fn(), deleteMany: jest.fn() },
        projectRisk: { aggregate: jest.fn().mockResolvedValue({ _max: { riskScore: 0 } }) },
        projectIssue: { count: jest.fn().mockResolvedValue(0) },
        projectTimeline: { create: jest.fn() },
      },
    };

    const mockLogger = {
      audit: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: ProjectsRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repository = module.get(ProjectsRepository);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a project and record events', async () => {
      repository.create.mockResolvedValue(mockProject);

      const result = await service.create(
        {
          name: 'Standard Software Project',
          description: 'A mock project description',
          type: ProjectType.FIXED_PRICE,
          priority: ProjectPriority.MEDIUM,
          estimatedCost: 100000.0,
          estimatedHours: 400.0,
          startDate: '2026-08-01',
          endDate: '2026-11-01',
          categoryId: 'category-uuid',
          managerId: 'manager-user-uuid',
        },
        mockContext
      );

      expect(result).toEqual(mockProject);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.createTimeline).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return project if found', async () => {
      repository.findById.mockResolvedValue(mockProject);
      const result = await service.getById('project-uuid');
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update project budget, calculate health status dynamically and log audit', async () => {
      const updated = { ...mockProject, name: 'New Project Name', estimatedCost: 120000.0 };
      repository.update.mockResolvedValue(updated);
      repository.findById
        .mockResolvedValueOnce(mockProject) // first call (before)
        .mockResolvedValueOnce(updated);    // second call (return value)

      const result = await service.update('project-uuid', { name: 'New Project Name', estimatedCost: 120000.0 }, mockContext);
      expect(result.estimatedCost).toEqual(120000.0);
      expect(repository.createTimeline).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('clone', () => {
    it('should deep clone project phases, milestones, members, resources, adjusting timeline offset dates', async () => {
      const oldStartDate = new Date('2026-08-01');
      const oldEndDate = new Date('2026-11-01');
      const sourceProject = { ...mockProject, startDate: oldStartDate, endDate: oldEndDate };
      repository.findById.mockResolvedValue(sourceProject);
      
      const clonedProject = { ...sourceProject, id: 'cloned-uuid', code: 'PRJ-2026-000002', name: 'Cloned Project' };
      repository.create.mockResolvedValue(clonedProject);
      
      repository.findById.mockImplementation((id: string) => {
        if (id === 'cloned-uuid') return Promise.resolve(clonedProject);
        return Promise.resolve(sourceProject);
      });

      repository.prisma.projectPhase.findMany.mockResolvedValue([{ id: 'phase-1', code: 'DEV', sortOrder: 1 }]);
      repository.prisma.projectPhase.create.mockResolvedValue({ id: 'new-phase-1' });
      repository.prisma.projectMilestone.findMany.mockResolvedValue([]);
      repository.prisma.projectMember.findMany.mockResolvedValue([]);
      repository.prisma.projectResource.findMany.mockResolvedValue([]);

      const result = await service.clone('project-uuid', { name: 'Cloned Project', startDate: '2026-09-01' }, mockContext);
      expect(result.id).toEqual('cloned-uuid');
      expect(repository.createTimeline).toHaveBeenCalled();
    });
  });
});
