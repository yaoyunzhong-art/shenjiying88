// public.decorator.ts · 白名单跳过认证
// 标记的端点不经过 IdentityAccessGuard 的认证检查
//
// 使用方式:
//   @Public()
//   @Get('ping')
//   ping() { return 'OK' }
//
// Phase: Phase-FP P0 · 2026-07-03

import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'identity-access:is-public'
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
