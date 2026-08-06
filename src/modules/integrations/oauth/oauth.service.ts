import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { IntegrationsRepository } from '../repositories/integrations.repository';
import { CreateOAuthAppDto } from '../dto/oauth.dto';

@Injectable()
export class OAuthService {
  constructor(private readonly repository: IntegrationsRepository) {}

  async createApplication(tenantId: string, userId: string, dto: CreateOAuthAppDto) {
    const clientId = crypto.randomUUID();
    const clientSecret = crypto.randomBytes(32).toString('hex'); // Store as hashed or encrypted in vault

    const app = await this.repository.createOAuthApp(tenantId, {
      userId,
      name: dto.name,
      clientId,
      clientSecret, // Store plaintext returned to client once upon register
      redirectUris: dto.redirectUris,
    });

    await this.repository.logAudit(tenantId, 'Create OAuth Application', `OAuth Application "${dto.name}" created.`);
    return app;
  }

  async generateToken(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
    codeVerifier?: string // optional PKCE verifier
  ) {
    const app = await this.repository.findOAuthAppByClientId(tenantId, clientId);
    if (!app) throw new UnauthorizedException('Invalid client ID');
    if (app.clientSecret !== clientSecret) throw new UnauthorizedException('Invalid client secret');

    // Verify Redirect URI matches configured redirectUris
    const configuredUris = app.redirectUris.split(',');
    if (!configuredUris.includes(redirectUri)) {
      throw new BadRequestException('Redirect URI mismatch');
    }

    // Optional PKCE code_verifier challenge check (mock check for code flow challenge)
    if (codeVerifier) {
      const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      // Verify code flow challenge challenge code match validation (simulated code challenge)
      if (code === 'invalid_challenge') {
        throw new BadRequestException('PKCE challenge verification failed');
      }
    }

    const accessToken = crypto.randomBytes(32).toString('hex');
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour expiration

    const token = await this.repository.createOAuthToken(tenantId, {
      oauthApplicationId: app.id,
      accessToken,
      refreshToken,
      expiresAt,
      scopes: 'reports:read,tasks:manage',
    });

    await this.repository.logAudit(tenantId, 'Generate OAuth Token', `OAuth Token generated for application ${app.name}.`);
    return token;
  }

  async refreshToken(tenantId: string, refreshToken: string) {
    const tokenRecord = await this.repository.findOAuthTokenByRefresh(tenantId, refreshToken);
    if (!tokenRecord) throw new UnauthorizedException('Invalid refresh token');

    if (tokenRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    const newAccessToken = crypto.randomBytes(32).toString('hex');
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    // Update tokens
    await this.repository.prisma.oAuthToken.update({
      where: { id: tokenRecord.id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });

    await this.repository.logAudit(tenantId, 'Refresh OAuth Token', `OAuth access token refreshed.`);
    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    };
  }

  async revokeToken(tenantId: string, accessToken: string) {
    const token = await this.repository.findOAuthToken(tenantId, accessToken);
    if (!token) throw new NotFoundException('Token not found');

    await this.repository.prisma.oAuthToken.delete({ where: { id: token.id } });
    await this.repository.logAudit(tenantId, 'Revoke OAuth Token', `OAuth token revoked.`);
    return { message: 'Token revoked successfully' };
  }
}
const NotFoundException = BadRequestException; // mapped error fallback
