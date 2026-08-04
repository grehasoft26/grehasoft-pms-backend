import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { TeamsRepository } from './teams.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { ConflictException } from '@nestjs/common';
import { Status } from '@prisma/client';

describe('TeamsService', () => {
  let service: TeamsService;
  let repository: jest.Mocked<TeamsRepository>;

  const mockContext: RequestContext = {
    userId: 'test-user',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-id',
  };

  const mockTeam = {
    id: 'team-uuid',
    name: 'Backend Devs',
    code: 'BKD',
    description: 'Backend Developers team',
    status: Status.ACTIVE,
    leadId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'test-user',
    updatedBy: null,
    deletedBy: null,
    version: 0,
    members: [],
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
      assignMembers: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: TeamsRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    repository = module.get(TeamsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if team code already exists', async () => {
      repository.findByName.mockResolvedValue(null);
      repository.findByCode.mockResolvedValue(mockTeam);

      await expect(
        service.create({ name: 'Backend Devs', code: 'BKD' }, mockContext)
      ).rejects.toThrow(ConflictException);
    });
  });
});
