import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('Super Admin')
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  async getAllCompanies() {
    const data = await this.companiesService.getAllCompanies();
    return { message: 'Companies retrieved successfully', data };
  }

  @Get(':companyId/features')
  @ApiOperation({ summary: 'Get all features of a company' })
  async getCompanyFeatures(@Param('companyId') companyId: string) {
    const data = await this.companiesService.getCompanyFeatures(companyId);
    return { message: 'Company features retrieved successfully', data };
  }

  @Get(':companyId/features/tree')
  @ApiOperation({ summary: 'Get hierarchical feature tree of a company' })
  async getCompanyFeaturesTree(@Param('companyId') companyId: string) {
    const data = await this.companiesService.getCompanyFeaturesTree(companyId);
    return { message: 'Company features tree retrieved successfully', data };
  }

  @Patch(':companyId/features/:featureKey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update toggle status of a company feature key' })
  async updateFeatureState(
    @Param('companyId') companyId: string,
    @Param('featureKey') featureKey: string,
    @Body() body: { isEnabled: boolean },
  ) {
    return this.companiesService.updateFeatureState(
      companyId,
      featureKey,
      body.isEnabled,
    );
  }
}
