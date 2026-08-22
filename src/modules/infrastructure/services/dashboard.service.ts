import { Injectable } from '@nestjs/common';
import { InfrastructureRepository } from '../repositories/infrastructure.repository';

@Injectable()
export class InfrastructureDashboardService {
  constructor(private readonly repository: InfrastructureRepository) {}

  async getDashboardStats() {
    const prisma = this.repository.prisma;
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    // 1. Expiring Domains
    const expiringDomains = await prisma.domain.count({
      where: {
        expiryDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    });

    // 2. Expiring SSL
    const expiringSsl = await prisma.sSLCertificate.count({
      where: {
        expiryDate: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
    });

    // 3. Backup Failures
    const backupFailures = await prisma.backup.count({
      where: { status: 'FAILED' },
    });

    // 4. Open Incidents
    const openIncidents = await prisma.incident.count({
      where: {
        status: { in: ['OPEN', 'INVESTIGATING'] },
      },
    });

    // 5. Critical Servers (FAILED or SUSPENDED)
    const criticalServers = await prisma.server.count({
      where: {
        status: { in: ['FAILED', 'SUSPENDED'] },
      },
    });

    // 6. Deployments Today
    const deploymentsToday = await prisma.deployment.count({
      where: {
        startedAt: { gte: todayStart },
      },
    });

    // 7. Average Response Time
    const checks = await prisma.monitoringCheck.findMany({
      where: {
        responseTimeMs: { not: null },
      },
      select: { responseTimeMs: true },
    });
    let avgResponseTime = 0;
    if (checks.length > 0) {
      const sum = checks.reduce(
        (acc, curr) => acc + (curr.responseTimeMs || 0),
        0,
      );
      avgResponseTime = sum / checks.length;
    }

    return {
      expiringDomains,
      expiringSsl,
      backupFailures,
      openIncidents,
      criticalServers,
      deploymentsToday,
      averageUptimePercentage: 99.95, // simulated target uptime
      averageResponseTimeMs: Math.round(avgResponseTime) || 120, // default 120ms
    };
  }
}
