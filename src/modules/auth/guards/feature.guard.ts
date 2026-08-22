import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/feature.decorator';
import { CompaniesService } from '../../companies/companies.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly companiesService: CompaniesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { roleName: string; effectiveCompanyId: string };
    }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (user.roleName === 'Super Admin') {
      const className = context.getClass().name;
      if (
        className === 'CompaniesController' ||
        className === 'SettingsController'
      ) {
        return true;
      }
    }

    const companyId =
      user.effectiveCompanyId || '00000000-0000-0000-0000-000000000000';
    const isEnabled = await this.companiesService.isFeatureEnabled(
      companyId,
      requiredFeature,
    );

    if (!isEnabled) {
      throw new ForbiddenException(
        `Access Denied: The feature '${requiredFeature}' is disabled for your company.`,
      );
    }

    return true;
  }
}
