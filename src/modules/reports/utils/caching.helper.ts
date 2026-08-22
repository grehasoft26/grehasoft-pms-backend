import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class CachingHelper {
  constructor(private readonly prisma: PrismaService) {}

  generateHash(filters: any): string {
    const raw = JSON.stringify(filters || {});
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async getCache(
    tenantId: string,
    reportId: string,
    filterHash: string,
  ): Promise<any | null> {
    const cached = await this.prisma.analyticsCache.findUnique({
      where: {
        tenantId_reportId_filterHash: { tenantId, reportId, filterHash },
      },
    });

    if (!cached) {
      console.log(
        `[CACHE MISS] Tenant: ${tenantId} | Report: ${reportId} | Hash: ${filterHash}`,
      );
      return null;
    }

    // Expiry check
    if (new Date(cached.expiresAt).getTime() < Date.now()) {
      console.log(
        `[CACHE EXPIRED] Tenant: ${tenantId} | Report: ${reportId} | Hash: ${filterHash}`,
      );
      await this.prisma.analyticsCache
        .delete({
          where: { id: cached.id },
        })
        .catch(() => {});
      return null;
    }

    console.log(
      `[CACHE HIT] Tenant: ${tenantId} | Report: ${reportId} | Hash: ${filterHash}`,
    );
    try {
      return JSON.parse(cached.payload);
    } catch (e) {
      return null;
    }
  }

  async setCache(
    tenantId: string,
    reportId: string,
    filterHash: string,
    payload: any,
    ttlSeconds = 300,
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const payloadStr = JSON.stringify(payload);

    await this.prisma.analyticsCache.upsert({
      where: {
        tenantId_reportId_filterHash: { tenantId, reportId, filterHash },
      },
      update: {
        payload: payloadStr,
        expiresAt,
      },
      create: {
        tenantId,
        reportId,
        filterHash,
        payload: payloadStr,
        expiresAt,
      },
    });
  }
}
