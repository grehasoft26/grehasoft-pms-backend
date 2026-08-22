import { Injectable, NotFoundException } from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';
import { CreatePurchaseDto } from '../dto/purchases.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly repository: FinanceRepository,
    private readonly logger: LoggerService,
  ) {}

  private async getNextPurchaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPurchase = await this.repository.getLastPurchaseNumber(year);
    let nextNum = 1;
    if (lastPurchase && lastPurchase.purchaseNumber) {
      const parts = lastPurchase.purchaseNumber.split('-');
      if (parts.length === 3) {
        nextNum = parseInt(parts[2], 10) + 1;
      }
    }
    return `PO-${year}-${String(nextNum).padStart(6, '0')}`;
  }

  async createPurchase(dto: CreatePurchaseDto, context: RequestContext) {
    const purchaseNumber = await this.getNextPurchaseNumber();

    let subtotal = 0;
    const items = dto.items.map((it) => {
      const total = it.quantity * it.rate - (it.discount || 0) + (it.tax || 0);
      subtotal += total;
      return {
        productName: it.productName,
        quantity: it.quantity,
        rate: it.rate,
        discount: it.discount || 0,
        tax: it.tax || 0,
        total,
      };
    });

    const total = subtotal - (dto.discount || 0) + (dto.tax || 0);

    const purchase = await this.repository.createPurchase({
      purchaseNumber,
      vendorId: dto.vendorId,
      purchaseDate: new Date(dto.purchaseDate),
      status: 'DRAFT',
      subtotal,
      discount: dto.discount || 0,
      tax: dto.tax || 0,
      total,
      currencyId: dto.currencyId,
      items: {
        create: items,
      },
    });

    this.logger.audit(
      context.userId,
      'Create Purchase Order',
      'purchase',
      purchase,
      { after: purchase },
    );
    return purchase;
  }

  async getPurchases() {
    return this.repository.findPurchases();
  }

  async getPurchaseById(id: string) {
    return this.repository.findPurchaseById(id);
  }
}
