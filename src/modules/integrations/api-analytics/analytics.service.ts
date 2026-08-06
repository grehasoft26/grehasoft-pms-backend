import { Injectable } from '@nestjs/common';
import { IntegrationsRepository } from '../repositories/integrations.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly repository: IntegrationsRepository) {}

  async logRequest(tenantId: string, endpointPath: string, method: string, latencyMs: number, statusCode: number) {
    const isError = statusCode >= 400;
    
    // Log in analytics
    await this.repository.logApiAnalytics(tenantId, {
      endpointPath,
      method,
      latencyMs,
      isError,
    });

    // Also record general API Log entry
    await this.repository.prisma.apiLog.create({
      data: {
        tenantId,
        method,
        path: endpointPath,
        statusCode,
        latencyMs,
        logType: isError ? 'ERROR' : 'REQUEST',
      },
    });
  }

  async getDashboardAnalytics(tenantId: string) {
    const records = await this.repository.getAnalytics(tenantId);

    const totalRequests = records.reduce((acc, r) => acc + r.totalRequests, 0);
    const errorRequests = records.reduce((acc, r) => acc + r.errorRequests, 0);
    const avgLatencyMs = records.length > 0 
      ? Math.round(records.reduce((acc, r) => acc + r.avgLatencyMs, 0) / records.length) 
      : 0;

    const errorRate = totalRequests > 0 ? Number(((errorRequests / totalRequests) * 100).toFixed(2)) : 0.0;

    // Top endpoints
    const topEndpoints = records
      .map((r) => ({
        path: r.endpointPath,
        method: r.method,
        requests: r.totalRequests,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 5);

    return {
      totalApiRequests: totalRequests,
      failedApiRequests: errorRequests,
      errorRate,
      averageLatencyMs: avgLatencyMs,
      topEndpoints,
    };
  }
}
