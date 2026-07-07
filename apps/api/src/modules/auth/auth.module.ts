// AuthModule · Phase-FP 全端标准化 P0
// 创建: 2026-07-03
// 状态: IMPLEMENTED
// 职责: 统一认证服务 - 登录/登出/Token管理/会话管理

import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { SessionService } from './session.service'
import { TokenService } from './token.service'

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    TokenService,
  ],
  exports: [
    AuthService,
    SessionService,
    TokenService,
  ],
})
export class AuthModule {}
