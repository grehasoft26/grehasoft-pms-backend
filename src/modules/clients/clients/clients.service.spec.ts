import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { ClientsRepository } from './clients.repository';
import { ClientTimelinesRepository } from '../client-timelines/client-timelines.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { ClientStatus } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('ClientsService', () => {
  let service: ClientsService;
  let repository: jest.Mocked<ClientsRepository>;
  let timelineRepository: jest.Mocked<ClientTimelinesRepository>;
  let logger: jest.Mocked<LoggerService>;

  const mockContext: RequestContext = {
    userId: 'test-user-id',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-id',
  };

  const mockClient = {
    id: 'client-uuid',
    name: 'Acme Corp',
    code: 'CL-000001',
    status: ClientStatus.PROSPECT,
    categoryId: 'category-uuid',
    industry: 'Technology',
    companyType: 'Inc',
    website: 'https://acme.com',
    gstVatNumber: 'GST-1234',
    taxNumber: 'TAX-5678',
    registrationNumber: 'REG-9012',
    profileLogo: null,
    remarks: 'Test Remarks',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'test-user-id',
    updatedBy: null,
    deletedBy: null,
    version: 0,
  };

  beforeEach(async () => {
    const mockRepo = {
      generateClientCode: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
    };

    const mockTimelineRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: ClientsRepository, useValue: mockRepo },
        { provide: ClientTimelinesRepository, useValue: mockTimelineRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    repository = module.get(ClientsRepository);
    timelineRepository = module.get(ClientTimelinesRepository);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create client with auto-generated code and generate timeline + audit log', async () => {
      repository.generateClientCode.mockResolvedValue('CL-000001');
      repository.create.mockResolvedValue(mockClient);

      const result = await service.create(
        {
          name: 'Acme Corp',
          categoryId: 'category-uuid',
          industry: 'Technology',
          companyType: 'Inc',
          website: 'https://acme.com',
          gstVatNumber: 'GST-1234',
          taxNumber: 'TAX-5678',
          registrationNumber: 'REG-9012',
          remarks: 'Test Remarks',
        },
        mockContext,
      );

      expect(result).toEqual(mockClient);
      expect(repository.generateClientCode).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith({
        name: 'Acme Corp',
        categoryId: 'category-uuid',
        industry: 'Technology',
        companyType: 'Inc',
        website: 'https://acme.com',
        gstVatNumber: 'GST-1234',
        taxNumber: 'TAX-5678',
        registrationNumber: 'REG-9012',
        remarks: 'Test Remarks',
        code: 'CL-000001',
        createdBy: mockContext.userId,
      });
      expect(timelineRepository.create).toHaveBeenCalledWith({
        clientId: mockClient.id,
        event: 'CLIENT_CREATED',
        description: `Client "Acme Corp" was registered under code CL-000001.`,
        createdBy: mockContext.userId,
        metadata: { client: mockClient },
      });
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return client if found', async () => {
      repository.findById.mockResolvedValue(mockClient);
      const result = await service.getById('client-uuid');
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update client, create timeline and audit entries', async () => {
      repository.findById.mockResolvedValue(mockClient);
      const updatedClient = { ...mockClient, name: 'Acme Updated' };
      repository.update.mockResolvedValue(updatedClient);

      const result = await service.update(
        'client-uuid',
        { name: 'Acme Updated' },
        mockContext,
      );
      expect(result).toEqual(updatedClient);
      expect(timelineRepository.create).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should soft delete client, create timeline and audit entries', async () => {
      repository.findById.mockResolvedValue(mockClient);
      await service.delete('client-uuid', mockContext);
      expect(repository.delete).toHaveBeenCalledWith(
        'client-uuid',
        mockContext.userId,
      );
      expect(timelineRepository.create).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should restore client, create timeline and audit entries', async () => {
      repository.restore.mockResolvedValue(mockClient);
      const result = await service.restore('client-uuid', mockContext);
      expect(result).toEqual(mockClient);
      expect(repository.restore).toHaveBeenCalledWith('client-uuid');
      expect(timelineRepository.create).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('setStatus', () => {
    it('should change status, update timeline and audit logs', async () => {
      repository.findById.mockResolvedValue(mockClient);
      const updatedClient = { ...mockClient, status: ClientStatus.ACTIVE };
      repository.update.mockResolvedValue(updatedClient);

      const result = await service.setStatus(
        'client-uuid',
        ClientStatus.ACTIVE,
        mockContext,
      );
      expect(result.status).toEqual(ClientStatus.ACTIVE);
      expect(timelineRepository.create).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });
  });
});
