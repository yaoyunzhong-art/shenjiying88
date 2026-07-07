// sandbox.service.ts - T116-2
// 沙箱环境管理服务：为不同租户提供隔离的开发环境

import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SandboxEnvironment {
  envId: string;
  tenantId: string;
  name: string;
  status: 'CREATING' | 'RUNNING' | 'STOPPED' | 'ERROR';
  createdAt: string;
  config: Record<string, unknown>;
}

export interface SandboxEnvironmentConfig {
  name: string;
  resources?: {
    cpu?: number;
    memory?: number;
    disk?: number;
  };
  tags?: string[];
}

// ── SandboxService ─────────────────────────────────────────────────────────────

@Injectable()
export class SandboxService {
  private readonly logger = new Logger(SandboxService.name);
  private readonly environments = new Map<string, SandboxEnvironment>();

  /**
   * 为指定租户创建沙箱环境
   */
  createEnvironment(
    tenantId: string,
    config: SandboxEnvironmentConfig,
  ): SandboxEnvironment {
    const env: SandboxEnvironment = {
      envId: `env-${randomUUID()}`,
      tenantId,
      name: config.name,
      status: 'CREATING',
      createdAt: new Date().toISOString(),
      config: config as unknown as Record<string, unknown>,
    };

    // 模拟创建过程
    env.status = 'RUNNING';

    this.environments.set(env.envId, env);
    this.logger.log(
      `[environment ${env.envId}] created for tenant=${tenantId}, name="${config.name}"`,
    );
    return env;
  }

  /**
   * 列出指定租户的所有沙箱环境
   */
  listEnvironments(tenantId: string): SandboxEnvironment[] {
    return Array.from(this.environments.values()).filter(
      (env) => env.tenantId === tenantId,
    );
  }

  /**
   * 获取指定环境
   */
  getEnvironment(envId: string): SandboxEnvironment | undefined {
    return this.environments.get(envId);
  }

  /**
   * 停止沙箱环境
   */
  stopEnvironment(envId: string): boolean {
    const env = this.environments.get(envId);
    if (!env) {
      this.logger.warn(`[environment ${envId}] not found`);
      return false;
    }
    env.status = 'STOPPED';
    this.logger.log(`[environment ${envId}] stopped`);
    return true;
  }

  /**
   * 启动沙箱环境
   */
  startEnvironment(envId: string): boolean {
    const env = this.environments.get(envId);
    if (!env) {
      this.logger.warn(`[environment ${envId}] not found`);
      return false;
    }
    env.status = 'RUNNING';
    this.logger.log(`[environment ${envId}] started`);
    return true;
  }

  /**
   * 删除沙箱环境
   */
  deleteEnvironment(envId: string): boolean {
    const existed = this.environments.has(envId);
    if (!existed) {
      this.logger.warn(`[environment ${envId}] not found`);
      return false;
    }
    this.environments.delete(envId);
    this.logger.log(`[environment ${envId}] deleted`);
    return true;
  }
}
