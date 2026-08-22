import { Injectable, NotFoundException } from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';
import { CreateSSLCertificateDto } from '../dto/monitoring.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class SslService {
  constructor(
    private readonly repository: InfrastructureRepository,
    private readonly logger: LoggerService,
  ) {}

  private calculateSslMetrics(expiryDate: Date) {
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let renewalStatus = 'GOOD';
    if (daysRemaining <= 0) {
      renewalStatus = 'EXPIRED';
    } else if (daysRemaining <= 30) {
      renewalStatus = 'WARNING';
    }
    return { daysRemaining, renewalStatus };
  }

  async createCertificate(
    dto: CreateSSLCertificateDto,
    context: RequestContext,
  ) {
    const expiry = new Date(dto.expiryDate);
    const { daysRemaining, renewalStatus } = this.calculateSslMetrics(expiry);

    const certificate = await this.repository.createSSLCertificate({
      domainId: dto.domainId,
      subDomainId: dto.subDomainId,
      issuer: dto.issuer,
      issuedDate: new Date(dto.issuedDate),
      expiryDate: expiry,
      wildcard: dto.wildcard ?? false,
      autoRenewal: dto.autoRenewal ?? false,
      daysRemaining,
      renewalStatus,
    });

    if (dto.domainId) {
      await this.repository.createTimelineEvent(
        dto.domainId,
        'Domain',
        'SSL Certificate Installed',
        `SSL Certificate issued by ${dto.issuer} has been installed`,
      );
    }

    this.logger.audit(
      context.userId,
      'Install SSL Certificate',
      'sslCertificate',
      certificate,
      { after: certificate },
    );
    return certificate;
  }

  async getCertificates() {
    return this.repository.prisma.sSLCertificate.findMany({
      include: { domain: true, subDomain: true },
    });
  }
}
