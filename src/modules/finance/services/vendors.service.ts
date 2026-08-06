import { Injectable, NotFoundException } from '@nestjs/common';
import { FinanceRepository } from '../repositories/finance.repository';
import { CreateVendorDto } from '../dto/vendors.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class VendorsService {
  constructor(
    private readonly repository: FinanceRepository,
    private readonly logger: LoggerService
  ) {}

  async createVendor(dto: CreateVendorDto, context: RequestContext) {
    const vendor = await this.repository.createVendor({
      name: dto.name,
      companyName: dto.companyName || '',
      email: dto.email || '',
      phone: dto.phone || '',
      taxNumber: dto.taxNumber || '',
      pan: dto.pan || '',
      gst: dto.gst || '',
      bankDetails: dto.bankDetails || '',
      upi: dto.upi || '',
      paymentTerms: dto.paymentTerms || 'Due on Receipt',
      outstandingBalance: dto.outstandingBalance || 0.00,
      status: 'ACTIVE',
    });

    this.logger.audit(context.userId, 'Create Vendor', 'vendor', vendor, { after: vendor });
    return vendor;
  }

  async getVendors() {
    return this.repository.findVendors();
  }

  async getVendorById(id: string) {
    const vendor = await this.repository.findVendorById(id);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }
}
