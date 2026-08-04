import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('RolesService', () => {
  let service: RolesService;
  let repository: jest.Mocked<RolesRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-id',
  };

  const mockRole = {
    id: 'role-uuid',
    name: 'Admin',
    description: 'System Administrator',
    isSystem: true,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'system',
    updatedBy: null,
    deletedBy: null,
    version: 0,
    permissions: [],
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      assignPermissions: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RolesRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    repository = module.get(RolesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a role successfully', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockRole);

      const result = await service.create({ name: 'Admin', description: 'Admin role' }, mockContext);
      expect(result).toEqual(mockRole);
    });

    it('should throw ConflictException if role name exists', async () => {
      repository.findByName.mockResolvedValue(mockRole);

      await expect(
        service.create({ name: 'Admin', description: 'Admin role' }, mockContext)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update hierarchy cycle prevention', () => {
    it('should prevent mapping a role as its own parent', async () => {
      repository.findById.mockResolvedValue(mockRole);

      await expect(
        service.update('role-uuid', { parentId: 'role-uuid' }, mockContext)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
