import { Test, TestingModule } from '@nestjs/testing';
import { DeploymentsService } from './deployments.service';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { BadRequestException } from '@nestjs/common';

describe('DeploymentsService', () => {
  let service: DeploymentsService;
  let repository: jest.Mocked<InfrastructureRepository>;

  const mockContext: RequestContext = {
    userId: 'admin-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'corr-uuid',
  };

  beforeEach(async () => {
    const mockRepo = {
      findServerEnvironmentById: jest.fn(),
      createDeployment: jest.fn(),
      updateDeployment: jest.fn(),
      createDeploymentHistory: jest.fn(),
      findDeploymentById: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeploymentsService,
        { provide: InfrastructureRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DeploymentsService>(DeploymentsService);
    repository = module.get(InfrastructureRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rollbackDeployment', () => {
    it('should throw BadRequestException if rollback support is disabled', async () => {
      repository.findDeploymentById.mockResolvedValue({
        id: 'dep-uuid',
        rollbackSupport: false,
      } as any);

      await expect(
        service.rollbackDeployment('dep-uuid', { rollbackReason: 'Testing' }, mockContext)
      ).rejects.toThrow(BadRequestException);
    });

    it('should trigger rollback successfully', async () => {
      repository.findDeploymentById.mockResolvedValue({
        id: 'dep-uuid',
        rollbackSupport: true,
        projectId: 'project-uuid',
        serverEnvironmentId: 'env-uuid',
        repositoryBranchId: 'branch-uuid',
        commitHash: 'commit-hash',
      } as any);

      repository.createDeployment.mockResolvedValue({ id: 'rollback-uuid' } as any);

      const result = await service.rollbackDeployment('dep-uuid', { rollbackReason: 'Testing' }, mockContext);
      expect(result.id).toEqual('rollback-uuid');
      expect(repository.createDeployment).toHaveBeenCalled();
    });
  });
});
