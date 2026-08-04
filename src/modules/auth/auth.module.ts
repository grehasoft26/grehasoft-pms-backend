import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/roles.guard';
import { PermissionGuard } from './guards/permissions.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('app.jwt.secret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RateLimiterService,
    JwtAuthGuard,
    RoleGuard,
    PermissionGuard,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    RoleGuard,
    PermissionGuard,
    JwtModule,
  ],
})
export class AuthModule {}
