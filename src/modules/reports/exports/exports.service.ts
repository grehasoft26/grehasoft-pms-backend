import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportsRepository } from '../repositories/reports.repository';
import { TriggerExportDto } from '../dto/exports.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ExportsService {
  constructor(
    private readonly repository: ReportsRepository,
    private readonly logger: LoggerService
  ) {}

  async triggerExport(tenantId: string, dto: TriggerExportDto, context: RequestContext) {
    const report = await this.repository.findDefinitionById(tenantId, dto.reportDefinitionId);
    if (!report) throw new NotFoundException('Report definition not found');

    const startedAt = new Date();
    const exportRecord = await this.repository.createExport(tenantId, {
      reportDefinitionId: dto.reportDefinitionId,
      startedAt,
      generatedById: context.userId,
      exportStatus: 'PENDING',
      exportFormat: dto.exportFormat,
    });

    // Run async simulation task
    this.processBackgroundExport(tenantId, exportRecord.id, startedAt);

    return exportRecord;
  }

  private async processBackgroundExport(tenantId: string, exportId: string, startedAt: Date) {
    try {
      // Simulate rendering time
      await new Promise((resolve) => setTimeout(resolve, 500));

      const completedAt = new Date();
      const duration = Math.ceil((completedAt.getTime() - startedAt.getTime()) / 1000);

      await this.repository.updateExport(tenantId, exportId, {
        exportStatus: 'COMPLETED',
        completedAt,
        duration,
        recordCount: 150, // mock count
        fileSize: 45280,  // mock bytes size
        filePath: `/exports/downloads/report_${exportId}.bin`,
      });
    } catch (err) {
      await this.repository.updateExport(tenantId, exportId, {
        exportStatus: 'FAILED',
        completedAt: new Date(),
      }).catch(() => {});
    }
  }

  async getExports(tenantId: string) {
    return this.repository.findExports(tenantId);
  }

  async incrementDownload(tenantId: string, id: string) {
    const record = await this.repository.findExportById(tenantId, id);
    if (!record) throw new NotFoundException('Export record not found');

    return this.repository.updateExport(tenantId, id, {
      downloadCount: record.downloadCount + 1,
    });
  }
}
