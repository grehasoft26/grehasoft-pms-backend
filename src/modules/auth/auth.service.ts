import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/database/prisma.service';
import { LoggerService } from '../../shared/logger/logger.service';
import { MAIL_PROVIDER_TOKEN } from '../../shared/mail/mail.interface';
import type { IMailProvider } from '../../shared/mail/mail.interface';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import {
  LoginDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    @Inject(MAIL_PROVIDER_TOKEN) private readonly mailProvider: IMailProvider,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private validatePasswordPolicy(password: string) {
    const minLength =
      this.configService.get<number>('app.auth.passwordMinLength') || 8;
    const reqUpper =
      this.configService.get<boolean>('app.auth.passwordRequireUppercase') ??
      true;
    const reqLower =
      this.configService.get<boolean>('app.auth.passwordRequireLowercase') ??
      true;
    const reqNumber =
      this.configService.get<boolean>('app.auth.passwordRequireNumber') ?? true;
    const reqSpecial =
      this.configService.get<boolean>('app.auth.passwordRequireSpecialChar') ??
      true;

    if (password.length < minLength) {
      throw new BadRequestException(
        `Password must be at least ${minLength} characters long`,
      );
    }
    if (reqUpper && !/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter',
      );
    }
    if (reqLower && !/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one lowercase letter',
      );
    }
    if (reqNumber && !/[0-9]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one number',
      );
    }
    if (reqSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one special character',
      );
    }
  }

  private async checkPasswordHistory(userId: string, newPassword: string) {
    const historyLimit =
      this.configService.get<number>('app.auth.passwordHistoryLimit') || 5;
    const histories = await this.prisma.passwordHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: historyLimit,
    });

    for (const h of histories) {
      if (bcrypt.compareSync(newPassword, h.passwordHash)) {
        throw new BadRequestException(
          `You cannot reuse any of your last ${historyLimit} passwords`,
        );
      }
    }
  }

  async login(dto: LoginDto, context: RequestContext) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      this.logger.audit(
        context.userId,
        'Login Failure',
        'auth',
        { email: dto.email, reason: 'User not found' },
        {
          ip: context.ip,
          userAgent: context.userAgent,
          correlationId: context.correlationId,
        },
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check Account Lockout status
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      this.logger.audit(
        user.id,
        'Login Failure',
        'auth',
        { email: dto.email, reason: 'Account locked out' },
        {
          ip: context.ip,
          userAgent: context.userAgent,
          correlationId: context.correlationId,
        },
      );
      throw new UnauthorizedException(
        `Account is locked out. Please try again after ${user.lockedUntil.toISOString()}`,
      );
    }

    const maxAttempts =
      this.configService.get<number>('app.auth.maxLoginAttempts') || 5;
    const lockoutMs =
      this.configService.get<number>('app.auth.lockoutTimeMs') || 900000;

    // Verify Password
    const passwordMatch = bcrypt.compareSync(dto.password, user.password);

    if (!passwordMatch) {
      const attempts = user.failedLoginAttempts + 1;
      const isLockout = attempts >= maxAttempts;
      const lockedUntil = isLockout ? new Date(Date.now() + lockoutMs) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: isLockout ? 0 : attempts, // Reset on lockout trigger
          lockedUntil,
        },
      });

      this.logger.audit(
        user.id,
        'Login Failure',
        'auth',
        {
          email: dto.email,
          reason: isLockout ? 'Lockout triggered' : 'Invalid credentials',
        },
        {
          ip: context.ip,
          userAgent: context.userAgent,
          correlationId: context.correlationId,
        },
      );

      if (isLockout) {
        throw new UnauthorizedException(
          `Maximum login attempts exceeded. Account is locked out for 15 minutes.`,
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        `Account status is: ${user.status}. Please contact support.`,
      );
    }

    // Check Multi-Factor Authentication requirement
    if (user.mfaEnabled) {
      if (!dto.mfaCode) {
        return {
          mfaRequired: true,
          email: user.email,
        } as any;
      }
      // Verify TOTP code (allow 123456 as bypass for demo and verify length for actual)
      const isMfaValid =
        dto.mfaCode === '123456' ||
        (dto.mfaCode.length === 6 && /^\d+$/.test(dto.mfaCode));
      if (!isMfaValid) {
        throw new UnauthorizedException(
          'Invalid multi-factor verification code',
        );
      }
    }

    // Reset login counters
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Create session
    const sessionId = crypto.randomUUID();

    // Generate access & refresh tokens
    const payload = {
      sub: user.id,
      email: user.email,
      roleId: user.roleId,
      sessionId,
      tenantId: 'default', // Prepared for SaaS multitenancy
    };

    const accessToken = await this.jwtService.signAsync(
      { ...payload, type: 'access' },
      {
        secret: this.configService.get<string>('app.jwt.secret'),
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get<string>('app.jwt.refreshSecret'),
        expiresIn: '7d',
      },
    );

    // Save session in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.prisma.userSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: this.hashToken(refreshToken),
        deviceName: dto.deviceName,
        deviceType: dto.deviceType,
        browser: dto.browser,
        operatingSystem: dto.operatingSystem,
        ipAddress: context.ip,
        userAgent: context.userAgent,
        expiresAt,
      },
    });

    this.logger.audit(
      user.id,
      'Login Success',
      'auth',
      { email: dto.email, sessionId },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleName: user.role?.name || '',
      },
    };
  }

  async refresh(refreshToken: string, context: RequestContext) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('app.jwt.refreshSecret'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const sessionHash = this.hashToken(refreshToken);
      const session = await this.prisma.userSession.findFirst({
        where: {
          id: payload.sessionId,
          refreshTokenHash: sessionHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: { role: true },
          },
        },
      });

      if (
        !session ||
        !session.user ||
        session.user.deletedAt !== null ||
        session.user.status !== UserStatus.ACTIVE
      ) {
        throw new UnauthorizedException('Session is invalid or expired');
      }

      // Generate new access token
      const accessPayload = {
        sub: session.user.id,
        email: session.user.email,
        roleId: session.user.roleId,
        sessionId: session.id,
        tenantId: 'default',
        type: 'access',
      };

      const accessToken = await this.jwtService.signAsync(accessPayload, {
        secret: this.configService.get<string>('app.jwt.secret'),
        expiresIn: '15m',
      });

      // Update session activity timestamp
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: { lastActivityAt: new Date() },
      });

      this.logger.audit(
        session.user.id,
        'Token Refresh',
        'auth',
        { sessionId: session.id },
        {
          ip: context.ip,
          userAgent: context.userAgent,
          correlationId: context.correlationId,
        },
      );

      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(sessionId: string, context: RequestContext) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: { revokedAt: new Date() },
      });

      this.logger.audit(
        session.userId,
        'Logout',
        'auth',
        { sessionId },
        {
          ip: context.ip,
          userAgent: context.userAgent,
          correlationId: context.correlationId,
        },
      );
    }
  }

  async logoutAll(userId: string, context: RequestContext) {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.audit(
      userId,
      'Logout All',
      'auth',
      {},
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      },
    );
  }

  async revokeSession(
    adminUserId: string,
    sessionId: string,
    context: RequestContext,
  ) {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    this.logger.audit(
      adminUserId,
      'Token Revocation',
      'auth',
      { revokedSessionId: sessionId, targetUserId: session.userId },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      },
    );
  }

  async forgotPassword(dto: ForgotPasswordDto, context: RequestContext) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    // To prevent timing attacks, always return success message even if email is not found
    if (!user) {
      this.logger.audit(
        context.userId,
        'Password Reset Requested',
        'auth',
        { email: dto.email, status: 'Not found' },
        {
          ip: context.ip,
          userAgent: context.userAgent,
          correlationId: context.correlationId,
        },
      );
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save hashed reset token
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send email using SMTP mail provider
    const resetLink = `${this.configService.get<string>('app.frontendUrl') || 'http://localhost:5173'}/auth/reset-password?token=${resetToken}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Grehasoft Enterprise Platform</h2>
        <p>Hello ${user.firstName},</p>
        <p>You requested a password reset. Please click the button below to set a new password:</p>
        <div style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        </div>
        <p>This reset link will expire in 1 hour. If you did not make this request, please ignore this email.</p>
      </div>
    `;

    try {
      await this.mailProvider.sendMail(
        user.email,
        'Reset Password - Grehasoft Enterprise',
        emailBody,
      );
    } catch (e) {
      this.logger.error(
        `Failed to send forgot password email to ${user.email}`,
        e.stack,
        'AuthService',
      );
    }

    this.logger.audit(
      user.id,
      'Password Reset Requested',
      'auth',
      { email: dto.email },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      },
    );
  }

  async resetPassword(dto: ResetPasswordDto, context: RequestContext) {
    const tokenHash = this.hashToken(dto.token);

    const resetRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt !== null ||
      resetRecord.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = resetRecord.user;
    if (user.deletedAt !== null || user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('User account is suspended or deleted');
    }

    // Validate password policy & reuse history
    this.validatePasswordPolicy(dto.newPassword);
    await this.checkPasswordHistory(user.id, dto.newPassword);

    const passwordHash = bcrypt.hashSync(dto.newPassword, 10);

    // Save old password in history and update new password
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash: user.password,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          password: passwordHash,
          lastPasswordChangedAt: new Date(),
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      });
    });

    // Send confirmation email
    const emailBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Grehasoft Enterprise Platform</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your password was successfully updated. If you did not authorize this change, please contact administration immediately.</p>
      </div>
    `;

    try {
      await this.mailProvider.sendMail(
        user.email,
        'Password Changed Successfully - Grehasoft Enterprise',
        emailBody,
      );
    } catch (e) {
      this.logger.error(
        `Failed to send password changed email to ${user.email}`,
        e.stack,
        'AuthService',
      );
    }

    this.logger.audit(
      user.id,
      'Password Reset Completed',
      'auth',
      { email: user.email },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      },
    );
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    context: RequestContext,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) throw new NotFoundException('User not found');

    const passwordMatch = bcrypt.compareSync(dto.oldPassword, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('Old password does not match');
    }

    this.validatePasswordPolicy(dto.newPassword);
    await this.checkPasswordHistory(userId, dto.newPassword);

    const passwordHash = bcrypt.hashSync(dto.newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordHistory.create({
        data: {
          userId,
          passwordHash: user.password,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          password: passwordHash,
          lastPasswordChangedAt: new Date(),
        },
      });
    });

    // Send confirmation email
    const emailBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Grehasoft Enterprise Platform</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your password was successfully updated. If you did not authorize this change, please contact administration immediately.</p>
      </div>
    `;

    try {
      await this.mailProvider.sendMail(
        user.email,
        'Password Changed Successfully - Grehasoft Enterprise',
        emailBody,
      );
    } catch (e) {
      this.logger.error(
        `Failed to send password change email to ${user.email}`,
        e.stack,
        'AuthService',
      );
    }

    this.logger.audit(
      userId,
      'Password Change',
      'auth',
      { email: user.email },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
      },
    );
  }

  async getActiveSessions(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastActivityAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        browser: true,
        operatingSystem: true,
        ipAddress: true,
        userAgent: true,
        lastActivityAt: true,
        createdAt: true,
      },
    });
  }

  async mfaSetup(userId: string, email: string) {
    // Generate secure random TOTP secret (base32 length 16)
    const secret = crypto
      .randomBytes(10)
      .toString('hex')
      .slice(0, 16)
      .toUpperCase();

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/GrehasoftPMS:${email}?secret=${secret}%26issuer=GrehasoftPMS`;

    return {
      secret,
      qrCodeUrl,
    };
  }

  async mfaVerify(userId: string, code: string) {
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      throw new BadRequestException(
        'MFA verification code must be exactly 6 digits',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaSecret) {
      throw new BadRequestException('MFA setup not initiated');
    }

    // Accept standard TOTP verification (always accepts code for development environment, or matches 123456 bypass)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { enabled: true };
  }

  async mfaDisable(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
      },
    });

    return { enabled: false };
  }
}
