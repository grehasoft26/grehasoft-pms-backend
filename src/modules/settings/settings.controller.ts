import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { SuccessResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('company')
  @ApiOperation({ summary: 'Retrieve company profile settings' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCompany() {
    const data = await this.settingsService.getCompanySettings();
    return { message: 'Company settings retrieved successfully', data };
  }

  @Patch('company')
  @ApiOperation({ summary: 'Update company profile settings' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateCompany(@Body() body: Record<string, any>) {
    return this.settingsService.updateCompanySettings(body);
  }

  @Get('smtp')
  @ApiOperation({ summary: 'Retrieve SMTP configuration' })
  @ApiResponse({ type: SuccessResponseDto })
  async getSmtp() {
    const data = await this.settingsService.getSmtpSettings();
    return { message: 'SMTP settings retrieved successfully', data };
  }

  @Patch('smtp')
  @ApiOperation({ summary: 'Update SMTP configuration' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateSmtp(@Body() body: Record<string, any>) {
    return this.settingsService.updateSmtpSettings(body);
  }

  @Get('storage')
  @ApiOperation({ summary: 'Retrieve file storage configuration' })
  @ApiResponse({ type: SuccessResponseDto })
  async getStorage() {
    const data = await this.settingsService.getStorageSettings();
    return { message: 'Storage settings retrieved successfully', data };
  }

  @Patch('storage')
  @ApiOperation({ summary: 'Update file storage configuration' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateStorage(@Body() body: Record<string, any>) {
    return this.settingsService.updateStorageSettings(body);
  }

  @Get('branding')
  @ApiOperation({ summary: 'Retrieve branding configurations' })
  @ApiResponse({ type: SuccessResponseDto })
  async getBranding() {
    const data = await this.settingsService.getBrandingSettings();
    return { message: 'Branding settings retrieved successfully', data };
  }

  @Patch('branding')
  @ApiOperation({ summary: 'Update branding configurations' })
  @ApiResponse({ type: SuccessResponseDto })
  async updateBranding(@Body() body: Record<string, any>) {
    return this.settingsService.updateBrandingSettings(body);
  }

  @Get('lookups/currencies')
  @ApiOperation({ summary: 'Get list of supported currencies' })
  @ApiResponse({ type: SuccessResponseDto })
  async getCurrencies() {
    const data = await this.settingsService.getCurrencies();
    return { message: 'Currencies retrieved successfully', data };
  }

  @Get('lookups/timezones')
  @ApiOperation({ summary: 'Get list of supported timezones' })
  @ApiResponse({ type: SuccessResponseDto })
  async getTimezones() {
    const data = await this.settingsService.getTimezones();
    return { message: 'Timezones retrieved successfully', data };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get paginated audit logs with search' })
  @ApiResponse({ type: SuccessResponseDto })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = parseInt(page || '1', 10);
    const l = parseInt(limit || '50', 10);
    const data = await this.settingsService.getAuditLogs(p, l, search);
    return { message: 'Audit logs retrieved successfully', data };
  }

  @Get('security-events')
  @ApiOperation({ summary: 'Get security events & session logs' })
  @ApiResponse({ type: SuccessResponseDto })
  async getSecurityEvents(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = parseInt(page || '1', 10);
    const l = parseInt(limit || '50', 10);
    const data = await this.settingsService.getSecurityEvents(p, l);
    return { message: 'Security events retrieved successfully', data };
  }
}
