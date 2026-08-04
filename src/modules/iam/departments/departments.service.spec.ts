import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsService } from './departments.service';
import { DepartmentsRepository } from './departments.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Status } from '@prisma/client';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let repository: jest.Mocked<DepartmentsRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-id',
  };

  const mockDept = {
    id: 'dept-uuid',
    name: 'Engineering',
    code: 'ENG',
    displayOrder: 1,
    isRoot: false,
    status: Status.ACTIVE,
    parentId: null,
    managerId: null,
    deputyManagerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'test-user',
    updatedBy: null,
    deletedBy: null,
    version: 0,
    children: [],
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByCode: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: DepartmentsRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
    repository = module.get(DepartmentsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if code already exists', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.findByCode.mockResolvedValue(mockDept);

      await expect(
        service.create({ name: 'Engineering', code: 'ENG' }, mockContext)
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update hierarchy cycle prevention', () => {
    it('should prevent mapping a department as its own parent', async () => {
      repository.findById.mockResolvedValue(mockDept as any);

      await expect(
        service.update('dept-uuid', { parentId: 'dept-uuid' }, mockContext)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
