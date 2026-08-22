import { Injectable, NotFoundException } from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';
import { CreateBillableRateDto } from '../dto/rates.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class BillableRatesService {
  constructor(
    private readonly repository: FinanceRepository,
    private readonly logger: LoggerService,
  ) {}

  async createRate(dto: CreateBillableRateDto, context: RequestContext) {
    const rate = await this.repository.createBillableRate({
      clientId: dto.clientId,
      projectId: dto.projectId,
      taskId: dto.taskId,
      userId: dto.userId,
      departmentId: dto.departmentId,
      rate: dto.rate,
      currencyId: dto.currencyId,
    });
    this.logger.audit(
      context.userId,
      'Create Billable Rate',
      'billableRate',
      rate,
      { after: rate },
    );
    return rate;
  }

  async getRates() {
    return this.repository.findBillableRates();
  }

  // Fallback resolve rates
  async resolveEffectiveRate(filters: {
    taskId?: string;
    userId?: string;
    projectId?: string;
    departmentId?: string;
    clientId?: string;
    targetCurrencyId?: string;
  }) {
    const rateRecord = await this.repository.findEffectiveRate(filters);
    if (!rateRecord) {
      return { rate: 0.0, currencyCode: 'INR' };
    }

    let rate = Number(rateRecord.rate);
    let currencyCode = rateRecord.currency.code;

    // Optional exchange conversion
    if (
      filters.targetCurrencyId &&
      filters.targetCurrencyId !== rateRecord.currencyId
    ) {
      const targetCurrency = await this.repository.findCurrencyById(
        filters.targetCurrencyId,
      );
      if (targetCurrency) {
        // Exchange calculation: Convert to base, then to target
        const rateInBase = rate / Number(rateRecord.currency.exchangeRate);
        rate = rateInBase * Number(targetCurrency.exchangeRate);
        currencyCode = targetCurrency.code;
      }
    }

    return {
      rate,
      currencyCode,
    };
  }
}
