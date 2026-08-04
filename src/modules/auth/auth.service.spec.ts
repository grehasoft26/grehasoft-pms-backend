import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../core/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../shared/logger/logger.service';
import { MAIL_PROVIDER_TOKEN } from '../../shared/mail/mail.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockContext: RequestContext = {
    userId: 'test-user',
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    correlationId: 'test-correlation-id',
  };

  const mockUser = {
    id: 'user-uuid',
    email: 'superadmin@grehasoft.com',
    firstName: 'Super',
    lastName: 'Admin',
    password: bcrypt.hashSync('SuperAdminPassword123', 10),
    status: 'ACTIVE',
    roleId: 'role-uuid',
    departmentId: null,
    designationId: null,
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    createdBy: 'system',
    updatedBy: null,
    deletedBy: null,
    version: 0,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    lastPasswordChangedAt: null,
    emailVerifiedAt: null,
    emailVerificationToken: null,
    mfaEnabled: false,
    mfaSecret: null,
    backupCodes: null,
    role: { id: 'role-uuid', name: 'Super Admin' },
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      userSession: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      passwordHistory: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    const mockJwt = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'app.jwt.secret': 'secret',
          'app.jwt.refreshSecret': 'refresh',
          'app.auth.maxLoginAttempts': 5,
          'app.auth.lockoutTimeMs': 900000,
          'app.auth.passwordMinLength': 8,
          'app.auth.passwordHistoryLimit': 5,
          'app.auth.passwordRequireUppercase': true,
          'app.auth.passwordRequireLowercase': true,
          'app.auth.passwordRequireNumber': true,
          'app.auth.passwordRequireSpecialChar': true,
        };
        return config[key];
      }),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      audit: jest.fn(),
    };

    const mockMail = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: LoggerService, useValue: mockLogger },
        { provide: MAIL_PROVIDER_TOKEN, useValue: mockMail },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should authenticate successfully with correct credentials', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);
      jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');

      const result = await service.login(
        { email: 'superadmin@grehasoft.com', password: 'SuperAdminPassword123' },
        mockContext
      );

      expect(result.accessToken).toEqual('access-token');
      expect(result.refreshToken).toEqual('refresh-token');
      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser as any);
      prisma.user.update.mockResolvedValue(mockUser as any);

      await expect(
        service.login({ email: 'superadmin@grehasoft.com', password: 'wrongpassword' }, mockContext)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should block login if account is locked out', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 60000),
      };
      prisma.user.findFirst.mockResolvedValue(lockedUser as any);

      await expect(
        service.login({ email: 'superadmin@grehasoft.com', password: 'SuperAdminPassword123' }, mockContext)
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('password policy', () => {
    it('should throw BadRequestException if password fails policy verification', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser as any);
      prisma.passwordHistory.findMany.mockResolvedValue([]);

      await expect(
        service.changePassword(
          'user-uuid',
          { oldPassword: 'SuperAdminPassword123', newPassword: 'short' },
          mockContext
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
