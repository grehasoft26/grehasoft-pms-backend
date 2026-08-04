import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let logger: jest.Mocked<LoggerService>;

  const mockContext: RequestContext = {
    userId: 'test-user',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-id',
  };

  const mockUser = {
    id: 'user-uuid',
    email: 'jisha.charly@gmail.com',
    firstName: 'Jisha',
    lastName: 'Charly',
    password: 'hashed_password',
    status: UserStatus.PENDING,
    roleId: null,
    departmentId: null,
    designationId: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'test-user',
    updatedBy: null,
    deletedBy: null,
    version: 0,
    preferences: {
      id: 'pref-uuid',
      userId: 'user-uuid',
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Kolkata',
      notificationsEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      deletedBy: null,
      version: 0,
    },
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
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
        UsersService,
        { provide: UsersRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      repository.findByEmail.mockResolvedValue(null);
      repository.create.mockResolvedValue(mockUser);

      const result = await service.create(
        {
          email: 'jisha.charly@gmail.com',
          firstName: 'Jisha',
          lastName: 'Charly',
          password: 'password123',
        },
        mockContext
      );

      expect(result).toEqual(mockUser);
      expect(repository.create).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      repository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.create(
          {
            email: 'jisha.charly@gmail.com',
            firstName: 'Jisha',
            lastName: 'Charly',
          },
          mockContext
        )
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getById', () => {
    it('should return a user if found', async () => {
      repository.findById.mockResolvedValue(mockUser);
      const result = await service.getById('user-uuid');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getById('invalid-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});
