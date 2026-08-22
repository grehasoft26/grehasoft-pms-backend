import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization token missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Decode and verify access token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if session exists in DB and is active
      const session = await this.prisma.userSession.findFirst({
        where: {
          id: payload.sessionId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      });

      if (
        !session ||
        !session.user ||
        session.user.deletedAt !== null ||
        session.user.status !== 'ACTIVE'
      ) {
        throw new UnauthorizedException(
          'Session is invalid, expired, or user account is inactive',
        );
      }

      // Update session last activity timestamp asynchronously
      this.prisma.userSession
        .update({
          where: { id: session.id },
          data: { lastActivityAt: new Date() },
        })
        .catch(() => {});

      // Build user details payload for guards & controllers
      const userRole = session.user.role?.name || '';
      const userCompanyId =
        session.user.companyId || '00000000-0000-0000-0000-000000000000';

      // Super Admin can override tenant/company ID via header
      let effectiveCompanyId = userCompanyId;
      if (userRole === 'Super Admin') {
        const headerTenantId =
          request.headers['x-tenant-id'] || request.headers['x-company-id'];
        if (headerTenantId) {
          effectiveCompanyId = String(headerTenantId);
        }
      }

      request.user = {
        id: session.user.id,
        email: session.user.email,
        roleId: session.user.roleId,
        roleName: userRole,
        companyId: userCompanyId,
        effectiveCompanyId: effectiveCompanyId,
        sessionId: session.id,
        permissions: session.user.role?.permissions.map((p) => p.code) || [],
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        'Session is invalid, expired, or token verification failed',
      );
    }
  }
}
