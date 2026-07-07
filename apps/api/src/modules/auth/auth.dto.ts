// auth.dto.ts · 统一认证 DTO + 校验
// Phase-FP P0 · 2026-07-05

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator'
import 'reflect-metadata'

export enum LoginType {
  MOBILE_SMS = 'mobile_sms',
  MOBILE_PASSWORD = 'mobile_password',
  WECHAT = 'wechat',
  WECHAT_MINIAPP = 'wechat_miniapp',
  EMAIL_PASSWORD = 'email_password',
  SSO = 'sso',
}

// ─── 请求 DTO ──────────────────────────────────────────────────────────

export class LoginBySmsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^1[3-9]\d{9}$/, { message: 'Invalid mobile number format' })
  mobile!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(8)
  code!: string
}

export class LoginByPasswordDto {
  @IsString()
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: 'Invalid mobile number format' })
  mobile?: string

  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(128)
  password!: string

  @IsEnum(LoginType)
  @IsOptional()
  loginType?: LoginType
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string
}

export class LogoutDto {
  @IsString()
  @IsOptional()
  sessionId?: string

  @IsBoolean()
  @IsOptional()
  allSessions?: boolean
}

export class WechatLoginDto {
  @IsString()
  @IsNotEmpty()
  code!: string
}

// ─── 响应 DTO ──────────────────────────────────────────────────────────

export class UserInfoDto {
  userId!: string
  tenantId!: string
  mobile?: string
  email?: string
  nickname?: string
  roles!: string[]
  avatar?: string
}

export class TokenPairDto {
  accessToken!: string
  refreshToken!: string
  expiresIn!: number
  tokenType!: 'Bearer'
}

export class LoginResponseDto {
  success!: boolean
  data?: {
    user: UserInfoDto
    accessToken: string
    refreshToken: string
    expiresIn: number
    tokenType: 'Bearer'
  }
  error?: {
    code: string
    message: string
  }
}
