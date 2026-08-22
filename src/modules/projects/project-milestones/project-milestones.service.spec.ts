import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMilestonesService } from './project-milestones.service';
import { ProjectMilestonesRepository } from './project-milestones.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { MilestoneStatus } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('ProjectMilestonesService', () => {
  let service: ProjectMilestonesService;
  let repository: jest.Mocked<ProjectMilestonesRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-uuid',
  };

  const mockMilestone: any = {
    id: 'milestone-uuid',
    projectId: 'project-uuid',
    title: 'Design Milestone',
    dueDate: new Date(),
    status: MilestoneStatus.PENDING,
    ownerId: 'owner-uuid',
    estimatedHours: 40,
    actualHours: 0,
    dependencies: [],
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      clearDependencies: jest.fn(),
      addDependency: jest.fn(),
      getDependencies: jest.fn(),
      getDirectDependentMilestones: jest.fn(),
      prisma: {
        projectDependency: { findMany: jest.fn() },
      },
    };

    const mockLogger = {
      audit: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectMilestonesService,
        { provide: ProjectMilestonesRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ProjectMilestonesService>(ProjectMilestonesService);
    repository = module.get(ProjectMilestonesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create milestone', () => {
    it('should create milestone without dependencies', async () => {
      repository.create.mockResolvedValue(mockMilestone);
      repository.findById.mockResolvedValue(mockMilestone);

      const result = await service.create(
        {
          projectId: 'project-uuid',
          title: 'Design Milestone',
          dueDate: '2026-09-01',
          ownerId: 'owner-uuid',
          estimatedHours: 40,
        },
        mockContext,
      );

      expect(result).toEqual(mockMilestone);
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if circular dependency detected', async () => {
      repository.create.mockResolvedValue(mockMilestone);

      // Mock cycle: current milestone (milestone-uuid) -> depends on 'depends-uuid'
      // and 'depends-uuid' depends on current milestone (milestone-uuid)
      repository.prisma.projectDependency.findMany.mockImplementation(
        (args: any) => {
          if (args.where.milestoneId === 'depends-uuid') {
            return Promise.resolve([
              { dependsOnMilestoneId: 'milestone-uuid' },
            ]);
          }
          return Promise.resolve([]);
        },
      );

      await expect(
        service.create(
          {
            projectId: 'project-uuid',
            title: 'Design Milestone',
            dueDate: '2026-09-01',
            ownerId: 'owner-uuid',
            estimatedHours: 40,
            dependsOnMilestones: ['depends-uuid'],
          },
          mockContext,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(repository.delete).toHaveBeenCalledWith(
        mockMilestone.id,
        mockContext.userId,
      );
    });
  });
});
