import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../../shared/cache/cache.service';
import { SuccessResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'System health check status' })
  @ApiResponse({ type: SuccessResponseDto })
  async getHealth() {
    let dbStatus = 'UP';
    let redisStatus = 'UP';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'DOWN';
    }

    try {
      await this.cache.set('health_check_ping', 'ok', 5);
      const val = await this.cache.get('health_check_ping');
      if (val !== 'ok') {
        redisStatus = 'DOWN';
      }
    } catch (e) {
      redisStatus = 'DOWN';
    }

    const isHealthy = dbStatus === 'UP' && redisStatus === 'UP';

    return {
      success: isHealthy,
      statusCode: isHealthy ? 200 : 503,
      message: isHealthy ? 'System is healthy' : 'System is degraded',
      data: {
        database: dbStatus,
        cache: redisStatus,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check status (app booted)' })
  @ApiResponse({ type: SuccessResponseDto })
  getLive() {
    return {
      success: true,
      statusCode: 200,
      message: 'Application is running',
      data: {
        status: 'UP',
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check status (connections active)' })
  @ApiResponse({ type: SuccessResponseDto })
  async getReady() {
    const health = await this.getHealth();
    return health;
  }
}
