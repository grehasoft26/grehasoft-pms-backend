import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../common/dto/api-response.dto';
import { LoginDto, TokenRefreshDto, ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly rateLimiter: RateLimiterService
  ) {}

  private getContext(req: Request, customUserId?: string): RequestContext {
    return {
      userId: customUserId || (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and establish a secure session' })
  @ApiResponse({ type: SuccessResponseDto })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || '127.0.0.1';
    await this.rateLimiter.checkLoginLimit(ip, dto.email);

    const context = this.getContext(req);
    const data = await this.authService.login(dto, context);
    return { message: 'Login successful', data };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renew access token using valid refresh token' })
  @ApiResponse({ type: SuccessResponseDto })
  async refresh(@Body() dto: TokenRefreshDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.authService.refresh(dto.refreshToken, context);
    return { message: 'Token refreshed successfully', data };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke and destroy current session' })
  @ApiResponse({ type: SuccessResponseDto })
  async logout(@Req() req: Request, @CurrentUser() user: any) {
    const context = this.getContext(req, user.id);
    await this.authService.logout(user.sessionId, context);
    return { message: 'Logout successful' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke and terminate all active sessions' })
  @ApiResponse({ type: SuccessResponseDto })
  async logoutAll(@Req() req: Request, @CurrentUser() user: any) {
    const context = this.getContext(req, user.id);
    await this.authService.logoutAll(user.id, context);
    return { message: 'All sessions logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile and active sessions' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMe(@CurrentUser() user: any) {
    const sessions = await this.authService.getActiveSessions(user.id);
    return {
      message: 'Current profile retrieved',
      data: {
        user,
        activeSessions: sessions,
      },
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate forgot password reset token request' })
  @ApiResponse({ type: SuccessResponseDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ip = req.ip || '127.0.0.1';
    await this.rateLimiter.checkForgotLimit(ip);

    const context = this.getContext(req);
    await this.authService.forgotPassword(dto, context);
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using valid reset token' })
  @ApiResponse({ type: SuccessResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ip = req.ip || '127.0.0.1';
    await this.rateLimiter.checkResetLimit(ip);

    const context = this.getContext(req);
    await this.authService.resetPassword(dto, context);
    return { message: 'Password has been reset successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password for logged-in user' })
  @ApiResponse({ type: SuccessResponseDto })
  async changePassword(@Req() req: Request, @CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    const context = this.getContext(req, user.id);
    await this.authService.changePassword(user.id, dto, context);
    return { message: 'Password updated successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Admin session revocation by ID' })
  @ApiResponse({ type: SuccessResponseDto })
  async revokeSession(@Param('id') sessionId: string, @Req() req: Request, @CurrentUser() user: any) {
    const context = this.getContext(req, user.id);
    await this.authService.revokeSession(user.id, sessionId, context);
    return { message: 'Session revoked successfully' };
  }
}
