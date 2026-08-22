import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../shared/logger/logger.service';
import { PrismaService } from '../../core/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SettingsService {
  constructor(
    private readonly logger: LoggerService,
    private readonly prisma: PrismaService,
  ) {}

  getCompanySettings() {
    this.logger.log(
      'Fetching company configuration settings',
      'SettingsService',
    );
    return Promise.resolve({
      companyName: 'Grehasoft Technologies',
      address: '123 Enterprise Street, Tech City',
      phone: '+91 9999999999',
      email: 'info@grehasoft.com',
      website: 'https://grehasoft.com',
      taxNumber: 'GSTIN1234567890',
    });
  }

  updateCompanySettings(data: Record<string, any>) {
    this.logger.log(
      'Updating company configuration settings',
      'SettingsService',
    );
    this.logger.audit('system', 'Update Company Settings', 'company', data);
    return Promise.resolve({
      message: 'Company settings updated successfully',
      data,
    });
  }

  getSmtpSettings() {
    this.logger.log('Fetching SMTP config parameters', 'SettingsService');
    return Promise.resolve({
      host: 'smtp.grehasoft.com',
      port: 587,
      user: 'smtp-user@grehasoft.com',
      from: 'noreply@grehasoft.com',
      encryption: 'TLS',
    });
  }

  updateSmtpSettings(data: Record<string, any>) {
    this.logger.log(
      'Updating SMTP configuration parameters',
      'SettingsService',
    );
    this.logger.audit('system', 'Update SMTP Settings', 'smtp', data);
    return Promise.resolve({
      message: 'SMTP settings updated successfully',
      data,
    });
  }

  getStorageSettings() {
    this.logger.log('Fetching storage parameters config', 'SettingsService');
    return Promise.resolve({
      provider: 'local',
      localPath: './uploads',
      maxFileSizeMb: 10,
    });
  }

  updateStorageSettings(data: Record<string, any>) {
    this.logger.log(
      'Updating storage configuration parameters',
      'SettingsService',
    );
    this.logger.audit('system', 'Update Storage Settings', 'storage', data);
    return Promise.resolve({
      message: 'Storage settings updated successfully',
      data,
    });
  }

  getBrandingSettings() {
    this.logger.log(
      'Fetching branding settings configuration',
      'SettingsService',
    );
    return Promise.resolve({
      logoUrl: '/media/branding/logo.png',
      faviconUrl: '/favicon.ico',
      primaryColor: '#2980b9',
      sidebarTheme: 'dark',
    });
  }

  updateBrandingSettings(data: Record<string, any>) {
    this.logger.log(
      'Updating branding configuration settings',
      'SettingsService',
    );
    this.logger.audit('system', 'Update Branding Settings', 'branding', data);
    return Promise.resolve({
      message: 'Branding settings updated successfully',
      data,
    });
  }

  getCurrencies() {
    return Promise.resolve([
      { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
      { code: 'GBP', symbol: '£', name: 'British Pound' },
    ]);
  }

  getTimezones() {
    return Promise.resolve([
      { name: 'UTC', offset: '+00:00' },
      { name: 'Asia/Kolkata', offset: '+05:30' },
      { name: 'America/New_York', offset: '-04:00' },
      { name: 'Europe/London', offset: '+01:00' },
    ]);
  }

  async getAuditLogs(page = 1, limit = 50, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.ApiAuditWhereInput = { deletedAt: null };
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { details: { contains: search } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.apiAudit.count({ where }),
      this.prisma.apiAudit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, page, limit, items };
  }

  async getSecurityEvents(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      this.prisma.userSession.count(),
      this.prisma.userSession.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return { total, page, limit, items };
  }
}
