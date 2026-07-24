/**
 * system-config.service.ts — SaaS 系统配置管理
 * 从 controller 中提取纯业务逻辑
 */
import { Injectable } from '@nestjs/common'

export interface SystemSetting {
  key: string
  value: any
  description: string
  updatedAt: string
  updatedBy: string
}

@Injectable()
export class SystemConfigService {
  private readonly settings = new Map<string, SystemSetting>()

  get(key: string): SystemSetting | undefined {
    return this.settings.get(key)
  }

  getAll(): SystemSetting[] {
    return Array.from(this.settings.values())
  }

  set(key: string, value: any, description: string, operator: string): SystemSetting {
    const setting: SystemSetting = {
      key,
      value,
      description,
      updatedAt: new Date().toISOString(),
      updatedBy: operator,
    }
    this.settings.set(key, setting)
    return setting
  }

  delete(key: string): boolean {
    return this.settings.delete(key)
  }
}
