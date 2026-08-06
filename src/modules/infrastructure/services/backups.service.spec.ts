import { Test, TestingModule } from '@nestjs/testing';
import { BackupsService } from './backups.service';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';

describe('BackupsService', () => {
  let service: BackupsService;
  let repository: jest.Mocked<InfrastructureRepository>;

  const mockContext: RequestContext = {
    userId: 'admin-uuid',
    ip: '127.0.0.1',
    userAgent: 'test-agent',
    correlationId: 'corr-uuid',
  };

  beforeEach(async () => {
    const mockRepo = {
      createBackupSchedule: jest.fn(),
      findBackupSchedules: jest.fn(),
      createBackup: jest.fn(),
      findBackups: jest.fn(),
    };

    const mockLogger = {
      audit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupsService,
        { provide: InfrastructureRepository, useValue: mockRepo },
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<BackupsService>(BackupsService);
    repository = module.get(InfrastructureRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('triggerBackup', () => {
    it('should trigger and completed manual backup successfully', async () => {
      repository.createBackup.mockResolvedValue({ id: 'backup-uuid', name: 'Database daily backup' } as any);

      const result = await service.triggerBackup({
        name: 'Database daily backup',
        backupType: 'DATABASE',
        isFull: true,
      }, mockContext);

      expect(result.id).toEqual('backup-uuid');
      expect(repository.createBackup).toHaveBeenCalled();
    });
  });
});
