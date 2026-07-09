/**
 * Mock for tenant.guard — Vitest 别名解析
 *
 * llm-config.service.ts / controller.ts 使用 @ts-ignore 从
 * '../../agent/tenant.guard' 导入 TenantScopeGuard，但该文件实际
 * 只 export TenantGuard。此 mock 提供 TenantScopeGuard 供测试使用。
 */

import { Injectable } from '@nestjs/common'

@Injectable()
export class TenantScopeGuard {
  canActivate(): boolean {
    return true
  }
}
