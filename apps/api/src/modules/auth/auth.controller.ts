// auth.controller.ts · 统一认证接口
// Phase-FP P0 · 2026-07-03

import {
  Controller,
  Post,
  Body,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import {
  LoginBySmsDto,
  LoginByPasswordDto,
  RefreshTokenDto,
  LogoutDto,
  LoginType,
} from './auth.types'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/login/sms
   * 手机号+短信验证码登录
   */
  @Post('login/sms')
  @HttpCode(HttpStatus.OK)
  async loginBySms(
    @Body() body: LoginBySmsDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    const deviceInfo = this.extractDeviceInfo(userAgent)
    const result = await this.authService.loginBySms(body.mobile, body.code, deviceInfo)

    if (!result.success) {
      throw new UnauthorizedException(result.error)
    }

    return {
      success: true,
      data: {
        user: result.user,
        ...result.tokens,
      },
    }
  }

  /**
   * POST /auth/login/password
   * 密码登录
   */
  @Post('login/password')
  @HttpCode(HttpStatus.OK)
  async loginByPassword(
    @Body() body: LoginByPasswordDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    const deviceInfo = this.extractDeviceInfo(userAgent)
    const result = await this.authService.loginByPassword(
      body.mobile,
      body.email,
      body.password,
      body.loginType || LoginType.MOBILE_PASSWORD,
      deviceInfo,
    )

    if (!result.success) {
      throw new UnauthorizedException(result.error)
    }

    return {
      success: true,
      data: {
        user: result.user,
        ...result.tokens,
      },
    }
  }

  /**
   * POST /auth/login/wechat
   * 微信登录
   */
  @Post('login/wechat')
  @HttpCode(HttpStatus.OK)
  async loginByWechat(
    @Body('code') code: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const deviceInfo = this.extractDeviceInfo(userAgent)
    const result = await this.authService.loginByWechat(code, deviceInfo)

    if (!result.success) {
      throw new UnauthorizedException(result.error)
    }

    return {
      success: true,
      data: {
        user: result.user,
        ...result.tokens,
      },
    }
  }

  /**
   * POST /auth/refresh
   * 刷新Token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: RefreshTokenDto) {
    const result = await this.authService.refreshTokens(body.refreshToken)

    if (!result.success) {
      throw new UnauthorizedException(result.error)
    }

    return {
      success: true,
      data: {
        ...result.tokens,
      },
    }
  }

  /**
   * POST /auth/logout
   * 登出
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body() body: LogoutDto,
    @Headers('authorization') auth?: string,
  ) {
    const token = this.extractToken(auth)
    if (!token) {
      throw new UnauthorizedException({ message: 'No token provided' })
    }

    const user = await this.authService.validateToken(token)
    if (!user) {
      throw new UnauthorizedException({ message: 'Invalid token' })
    }

    await this.authService.logout(user.userId, body.sessionId, body.allSessions)

    return {
      success: true,
      message: 'Logged out successfully',
    }
  }

  /**
   * GET /auth/me
   * 获取当前用户信息
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Headers('authorization') auth?: string) {
    const token = this.extractToken(auth)
    if (!token) {
      throw new UnauthorizedException({ message: 'No token provided' })
    }

    const user = await this.authService.validateToken(token)
    if (!user) {
      throw new UnauthorizedException({ message: 'Invalid or expired token' })
    }

    return {
      success: true,
      data: user,
    }
  }

  // ─── 辅助方法 ────────────────────────────────────────────────────────

  private extractToken(auth: string | undefined): string | null {
    if (!auth) return null
    if (auth.startsWith('Bearer ')) {
      return auth.slice(7)
    }
    return null
  }

  private extractDeviceInfo(userAgent?: string): any {
    if (!userAgent) {
      return {
        deviceId: 'unknown',
        deviceType: 'unknown',
        userAgent: undefined,
      }
    }

    const isMobile = /mobile|android|iphone|ipad/i.test(userAgent)
    const isTablet = /tablet|ipad/i.test(userAgent)

    return {
      deviceId: `device_${Date.now()}`,
      deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'web',
      browser: this.extractBrowser(userAgent),
      os: this.extractOS(userAgent),
      userAgent,
    }
  }

  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  private extractOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    return 'Unknown'
  }
}
