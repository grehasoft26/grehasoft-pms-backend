import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PermissionsRepository } from './permissions.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let repository: jest.Mocked<PermissionsRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-id',
  };

  const mockGroup = { id: 'group-uuid', name: 'CRM', description: 'CRM Module' };
  const mockCategory = { id: 'category-uuid', name: 'Leads', groupId: 'group-uuid' };
  const mockPermission = { id: 'perm-uuid', name: 'Create Leads', code: 'leads.create', categoryId: 'category-uuid' };

  beforeEach(async () => {
    const mockRepo = {
      createGroup: jest.fn(),
      findGroups: jest.fn(),
      findGroupById: jest.fn(),
      createCategory: jest.fn(),
      findCategories: jest.fn(),
      findCategoryById: jest.fn(),
      createPermission: jest.fn(),
      findPermissions: jest.fn(),
      findPermissionById: jest.fn(),
      findPermissionByCode: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: PermissionsRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    repository = module.get(PermissionsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCategory', () => {
    it('should throw NotFoundException if group does not exist', async () => {
      repository.findGroupById.mockResolvedValue(null);

      await expect(
        service.createCategory({ name: 'Leads', groupId: 'invalid-group-uuid' }, mockContext)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPermission', () => {
    it('should throw ConflictException if permission code already exists', async () => {
      repository.findCategoryById.mockResolvedValue(mockCategory);
      repository.findPermissionByCode.mockResolvedValue(mockPermission);

      await expect(
        service.createPermission({ name: 'Create Leads', code: 'leads.create', categoryId: 'category-uuid' }, mockContext)
      ).rejects.toThrow(ConflictException);
    });
  });
});
