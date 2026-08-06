import { Injectable, NotFoundException } from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';
import { CreateEstimateDto } from '../dto/estimates.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { EstimateStatus } from '@prisma/client';

@Injectable()
export class EstimatesService {
  constructor(
    private readonly repository: FinanceRepository,
    private readonly logger: LoggerService
  ) {}

  private async getNextEstimateNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastEstimate = await this.repository.getLastEstimateNumber(year);
    let nextNum = 1;
    if (lastEstimate && lastEstimate.estimateNumber) {
      const parts = lastEstimate.estimateNumber.split('-');
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
    return `EST-${year}-${String(nextNum).padStart(6, '0')}`;
  }

  async createEstimate(dto: CreateEstimateDto, context: RequestContext) {
    const estimateNumber = await this.getNextEstimateNumber();

    let subtotal = 0;
    const items = dto.items.map((it) => {
      const total = (it.quantity * it.rate) - (it.discount || 0) + (it.tax || 0);
      subtotal += total;
      return {
        description: it.description,
        quantity: it.quantity,
        rate: it.rate,
        discount: it.discount || 0,
        tax: it.tax || 0,
        total,
      };
    });

    const total = subtotal - (dto.discount || 0) + (dto.tax || 0);

    const estimate = await this.repository.createEstimate({
      estimateNumber,
      clientId: dto.clientId,
      subject: dto.subject,
      status: EstimateStatus.DRAFT,
      subtotal,
      discount: dto.discount || 0,
      tax: dto.tax || 0,
      total,
      currencyId: dto.currencyId,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
      items: {
        create: items,
      },
    });

    this.logger.audit(context.userId, 'Create Estimate', 'estimate', estimate, { after: estimate });
    return estimate;
  }

  async updateStatus(id: string, status: EstimateStatus, context: RequestContext) {
    const before = await this.repository.findEstimateById(id);
    if (!before) throw new NotFoundException('Estimate not found');

    const updated = await this.repository.updateEstimateStatus(id, status);
    this.logger.audit(context.userId, 'Update Estimate Status', 'estimate', updated, { before, after: updated });
    return updated;
  }

  async getEstimateById(id: string) {
    return this.repository.findEstimateById(id);
  }

  async getEstimates() {
    return this.repository.findEstimates();
  }
}
