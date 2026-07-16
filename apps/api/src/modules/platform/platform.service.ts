import { Injectable, Logger } from '@nestjs/common';

export interface PlatformMetric {
  name: string;
  value: number;
  unit: string;
  updatedAt: string;
}

export interface PlatformHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  services: string[];
  lastCheck: string;
}

export interface PlatformVersion {
  version: string;
  build: string;
  commit: string;
  deployedAt: string;
}

export interface PlatformOverview {
  version: PlatformVersion;
  health: PlatformHealth;
  metrics: PlatformMetric[];
  activeTenants: number;
  servicesCount: number;
  uptimeHours: number;
}

@Injectable()
export class PlatformService {
  private readonly logger = new Logger(PlatformService.name);
  private metrics: PlatformMetric[] = [];
  private startedAt = Date.now();

  /** 获取平台概览 */
  getOverview(): PlatformOverview {
    return {
      version: {
        version: process.env.APP_VERSION ?? '1.0.0',
        build: process.env.BUILD_NUMBER ?? 'local',
        commit: process.env.GIT_COMMIT ?? 'unknown',
        deployedAt: new Date().toISOString(),
      },
      health: {
        status: 'healthy',
        uptime: process.uptime(),
        services: ['api', 'redis', 'postgres', 'clickhouse'],
        lastCheck: new Date().toISOString(),
      },
      metrics: this.metrics,
      activeTenants: Math.floor((process.uptime() / 3600) * 3) + 1, // 模拟
      servicesCount: 4,
      uptimeHours: Math.round(process.uptime() / 3600),
    };
  }

  /** 记录指标 */
  recordMetric(name: string, value: number, unit: string): PlatformMetric {
    const metric: PlatformMetric = { name, value, unit, updatedAt: new Date().toISOString() };
    const idx = this.metrics.findIndex(m => m.name === name);
    if (idx >= 0) this.metrics[idx] = metric;
    else this.metrics.push(metric);
    return metric;
  }

  /** 模拟健康检查 */
  async checkHealth(): Promise<PlatformHealth> {
    const services = ['api', 'redis', 'postgres', 'clickhouse'];
    return {
      status: 'healthy',
      uptime: process.uptime(),
      services,
      lastCheck: new Date().toISOString(),
    };
  }

  /** 获取uptime */
  getUptime(): string {
    const seconds = Math.floor(process.uptime());
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h${m}m${s}s`;
  }

  /** 重置（测试用） */
  reset(): void {
    this.metrics = [];
    this.startedAt = Date.now();
  }
}
