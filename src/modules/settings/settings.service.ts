import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../shared/logger/logger.service';

@Injectable()
export class SettingsService {
  constructor(private readonly logger: LoggerService) {}

  async getCompanySettings() {
    this.logger.log('Fetching company configuration settings', 'SettingsService');
    return {
      companyName: 'Grehasoft Technologies',
      address: '123 Enterprise Street, Tech City',
      phone: '+91 9999999999',
      email: 'info@grehasoft.com',
      website: 'https://grehasoft.com',
      taxNumber: 'GSTIN1234567890',
    };
  }

  async updateCompanySettings(data: any) {
    this.logger.log('Updating company configuration settings', 'SettingsService');
    this.logger.audit('system', 'Update Company Settings', 'company', data);
    return {
      message: 'Company settings updated successfully',
      data,
    };
  }

  async getSmtpSettings() {
    this.logger.log('Fetching SMTP config parameters', 'SettingsService');
    return {
      host: 'smtp.grehasoft.com',
      port: 587,
      user: 'smtp-user@grehasoft.com',
      from: 'noreply@grehasoft.com',
      encryption: 'TLS',
    };
  }

  async updateSmtpSettings(data: any) {
    this.logger.log('Updating SMTP configuration parameters', 'SettingsService');
    this.logger.audit('system', 'Update SMTP Settings', 'smtp', data);
    return {
      message: 'SMTP settings updated successfully',
      data,
    };
  }

  async getStorageSettings() {
    this.logger.log('Fetching storage parameters config', 'SettingsService');
    return {
      provider: 'local',
      localPath: './uploads',
      maxFileSizeMb: 10,
    };
  }

  async updateStorageSettings(data: any) {
    this.logger.log('Updating storage configuration parameters', 'SettingsService');
    this.logger.audit('system', 'Update Storage Settings', 'storage', data);
    return {
      message: 'Storage settings updated successfully',
      data,
    };
  }

  async getBrandingSettings() {
    this.logger.log('Fetching branding settings configuration', 'SettingsService');
    return {
      logoUrl: '/media/branding/logo.png',
      faviconUrl: '/favicon.ico',
      primaryColor: '#2980b9',
      sidebarTheme: 'dark',
    };
  }

  async updateBrandingSettings(data: any) {
    this.logger.log('Updating branding configuration settings', 'SettingsService');
    this.logger.audit('system', 'Update Branding Settings', 'branding', data);
    return {
      message: 'Branding settings updated successfully',
      data,
    };
  }

  async getCurrencies() {
    return [
      { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
      { code: 'GBP', symbol: '£', name: 'British Pound' },
    ];
  }

  async getTimezones() {
    return [
      { name: 'UTC', offset: '+00:00' },
      { name: 'Asia/Kolkata', offset: '+05:30' },
      { name: 'America/New_York', offset: '-04:00' },
      { name: 'Europe/London', offset: '+01:00' },
    ];
  }
}
