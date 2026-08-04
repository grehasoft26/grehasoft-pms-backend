import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeatureFlagsService {
  private readonly flags: Record<string, boolean> = {
    crm: true,
    pms: true,
    hr: true,
    finance: true,
    seo: true,
    telemetry: true,
    'support-desk': true,
  };

  constructor(private readonly configService: ConfigService) {
    // Optionally load toggles from config or environment variables
    for (const key of Object.keys(this.flags)) {
      const envKey = `FEATURE_FLAG_${key.toUpperCase().replace('-', '_')}`;
      const envVal = this.configService.get<string>(`app.featureFlags.${key}`);
      if (envVal !== undefined) {
        this.flags[key] = envVal === 'true';
      }
    }
  }

  async isEnabled(flagName: string): Promise<boolean> {
    return this.flags[flagName] ?? false;
  }
}
