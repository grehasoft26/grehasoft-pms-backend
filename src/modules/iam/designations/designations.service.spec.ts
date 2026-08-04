import { Test, TestingModule } from '@nestjs/testing';
import { DesignationsService } from './designations.service';
import { DesignationsRepository } from './designations.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { ConflictException } from '@nestjs/common';
import { Status } from '@prisma/client';

describe('DesignationsService', () => {
  let service: DesignationsService;
  let repository: jest.Mocked<DesignationsRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-id',
  };

  const mockDesignation = {
    id: 'desig-uuid',
    name: 'Architect',
    code: 'ARC',
    description: 'System Architect designation',
    sortOrder: 1,
    status: Status.ACTIVE,
    departmentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'test-user',
    updatedBy: null,
    deletedBy: null,
    version: 0,
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
        DesignationsService,
        { provide: DesignationsRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DesignationsService>(DesignationsService);
    repository = module.get(DesignationsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if designation name already exists', async () => {
      repository.findByName.mockResolvedValue(mockDesignation);

      await expect(
        service.create({ name: 'Architect', code: 'ARC' }, mockContext)
      ).rejects.toThrow(ConflictException);
    });
  });
});
