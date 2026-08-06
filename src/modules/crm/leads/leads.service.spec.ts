import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { LeadsRepository } from './leads.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LeadPriority, LeadTemperature, LeadActivityType } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

describe('LeadsService', () => {
  let service: LeadsService;
  let repository: jest.Mocked<LeadsRepository>;
  let logger: jest.Mocked<LoggerService>;

  const mockContext: RequestContext = {
    userId: 'test-user-id',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'test-correlation-id',
  };

  const mockLead: any = {
    id: 'lead-uuid',
    companyName: 'Acme Leads Inc',
    contactName: 'John Lead',
    email: 'john@acmeleads.com',
    phone: '+919876543210',
    website: 'https://acmeleads.com',
    gstNumber: 'GST-LEAD-12',
    expectedBudget: 50000,
    expectedClosingDate: new Date(),
    remarks: 'Interested in software development',
    leadPriority: LeadPriority.HIGH,
    leadTemperature: LeadTemperature.HOT,
    sourceId: 'source-uuid',
    statusId: 'status-uuid',
    ownerId: 'test-user-id',
  };

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      findMany: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      restore: jest.fn(),
      checkDuplicates: jest.fn(),
      createTimeline: jest.fn(),
      createAssignment: jest.fn(),
      createActivity: jest.fn(),
      getActivities: jest.fn(),
      findActivityById: jest.fn(),
      updateActivity: jest.fn(),
      deleteActivity: jest.fn(),
      getTimeline: jest.fn(),
      prisma: {
        leadActivity: { findMany: jest.fn(), update: jest.fn() },
        leadAssignment: { findMany: jest.fn(), update: jest.fn() },
        leadTimeline: { findMany: jest.fn(), update: jest.fn() },
        opportunity: { findMany: jest.fn(), update: jest.fn() },
      },
    };

    const mockLogger = {
      audit: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadsService,
        { provide: LeadsRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<LeadsService>(LeadsService);
    repository = module.get(LeadsRepository);
    logger = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a lead, write to timeline and audit log', async () => {
      repository.create.mockResolvedValue(mockLead);

      const result = await service.create(
        {
          companyName: 'Acme Leads Inc',
          contactName: 'John Lead',
          email: 'john@acmeleads.com',
          phone: '+919876543210',
          sourceId: 'source-uuid',
          statusId: 'status-uuid',
          ownerId: 'test-user-id',
        },
        mockContext
      );

      expect(result).toEqual(mockLead);
      expect(repository.create).toHaveBeenCalled();
      expect(repository.createTimeline).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return lead if found', async () => {
      repository.findById.mockResolvedValue(mockLead);
      const result = await service.getById('lead-uuid');
      expect(result).toEqual(mockLead);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findById.mockResolvedValue(null);
      await expect(service.getById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update lead, record in timeline and audit log', async () => {
      repository.findById.mockResolvedValue(mockLead);
      const updated = { ...mockLead, companyName: 'New Acme Name' };
      repository.update.mockResolvedValue(updated);

      const result = await service.update('lead-uuid', { companyName: 'New Acme Name' }, mockContext);
      expect(result.companyName).toEqual('New Acme Name');
      expect(repository.createTimeline).toHaveBeenCalled();
      expect(logger.audit).toHaveBeenCalled();
    });
  });

  describe('assign', () => {
    it('should assign a lead to a new owner and log history', async () => {
      repository.findById.mockResolvedValue(mockLead);
      const assigned = { ...mockLead, ownerId: 'new-owner-id' };
      repository.update.mockResolvedValue(assigned);

      const result = await service.assign('lead-uuid', { assigneeId: 'new-owner-id', notes: 'Assign' }, mockContext);
      expect(result.ownerId).toEqual('new-owner-id');
      expect(repository.createAssignment).toHaveBeenCalled();
      expect(repository.createTimeline).toHaveBeenCalled();
    });
  });

  describe('merge', () => {
    it('should merge two duplicate leads and delete the secondary lead', async () => {
      const primaryLead = { ...mockLead, id: 'primary-uuid', phone: null };
      const secondaryLead = { ...mockLead, id: 'secondary-uuid', phone: '+919999999999' };

      repository.findById
        .mockResolvedValueOnce(primaryLead) // first call primary
        .mockResolvedValueOnce(secondaryLead); // second call secondary

      repository.update.mockResolvedValue({ ...primaryLead, phone: '+919999999999' });

      // Mock Prisma transfers
      repository.prisma.leadActivity.findMany.mockResolvedValue([]);
      repository.prisma.leadAssignment.findMany.mockResolvedValue([]);
      repository.prisma.leadTimeline.findMany.mockResolvedValue([]);
      repository.prisma.opportunity.findMany.mockResolvedValue([]);

      const result = await service.merge({ primaryLeadId: 'primary-uuid', secondaryLeadId: 'secondary-uuid' }, mockContext);
      expect(repository.delete).toHaveBeenCalledWith('secondary-uuid', mockContext.userId);
      expect(repository.createTimeline).toHaveBeenCalled();
    });
  });
});
