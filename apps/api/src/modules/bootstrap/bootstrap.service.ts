import { Injectable, Logger } from '@nestjs/common';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { toBootstrapFoundationMetadata } from './bootstrap.contract';

export interface BootstrapHealthResponse {
  status: 'ok';
  uptime: number;
  phase: 'scaffold' | 'initialized' | 'running';
  /** @deprecated 兼容旧契约 */
  initializedAt?: string;
  uptimeReadable?: string;
  cpuUsage?: NodeJS.CpuUsage;
  memoryUsage?: NodeJS.MemoryUsage;
}

export interface BootstrapMetadataResponse {
  tenantContext: RequestTenantContext;
  foundationDependencies: string[];
  foundationContracts: string[];
  phase: 'scaffold' | 'initialized' | 'running';
  startedAt?: string;
  version?: string;
  environment?: string;
}

export interface FoundReadyStatus {
  module: string;
  status: 'ready' | 'pending' | 'error';
  details?: string;
}

export interface BootstrapSummaryResponse {
  healthy: boolean;
  uptime: number;
  phase: string;
  modules: FoundReadyStatus[];
  initializedAt: string;
  version: string;
}

@Injectable()
export class BootstrapService {
  private readonly logger = new Logger(BootstrapService.name);
  private readonly initializedAt = new Date().toISOString();
  private phase: 'scaffold' | 'initialized' | 'running' = 'scaffold';
  private moduleStatuses = new Map<string, FoundReadyStatus>();

  constructor() {
    this.registerModule('bootstrap', 'ready', '自举服务已启动');
  }

  /** 注册模块状态 */
  registerModule(module: string, status: FoundReadyStatus['status'], details?: string): void {
    this.moduleStatuses.set(module, { module, status, details });
    this.logger.log(`模块状态: ${module} → ${status}${details ? ` (${details})` : ''}`);
  }

  /** 标记系统可运行 */
  markRunning(): void {
    this.phase = 'running';
    this.logger.log('系统进入运行态');
  }

  getHealth(): BootstrapHealthResponse {
    const uptime = process.uptime();
    return {
      status: 'ok',
      uptime,
      phase: this.phase,
      initializedAt: this.initializedAt,
      uptimeReadable: `${Math.floor(uptime / 3600)}h${Math.floor((uptime % 3600) / 60)}m${Math.floor(uptime % 60)}s`,
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
    };
  }

  getBootstrapMetadata(tenantContext: RequestTenantContext): BootstrapMetadataResponse {
    const foundation = toBootstrapFoundationMetadata(undefined);
    return {
      tenantContext,
      ...foundation,
      phase: this.phase,
      startedAt: this.initializedAt,
      version: process.env.APP_VERSION ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
    };
  }

  /** 获取所有注册模块就绪状态 */
  getModuleStatuses(): FoundReadyStatus[] {
    return Array.from(this.moduleStatuses.values());
  }

  /** 获取指定模块状态 */
  getModuleStatus(module: string): FoundReadyStatus | null {
    return this.moduleStatuses.get(module) ?? null;
  }

  /** 获取系统启动摘要 */
  getSummary(): BootstrapSummaryResponse {
    const modules = this.getModuleStatuses();
    const allReady = modules.every(m => m.status === 'ready');
    return {
      healthy: allReady,
      uptime: process.uptime(),
      phase: this.phase,
      modules,
      initializedAt: this.initializedAt,
      version: process.env.APP_VERSION ?? '1.0.0',
    };
  }

  /** 重置（测试用） */
  reset(): void {
    this.moduleStatuses.clear();
    this.phase = 'scaffold';
    this.registerModule('bootstrap', 'ready', '已重置');
    this.phase = 'initialized';
  }
}
