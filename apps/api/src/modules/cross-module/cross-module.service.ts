import { Injectable } from '@nestjs/common'
import {
  ChainStatus,
  type CrossModuleChain,
  type CrossModuleContext,
  type CrossModuleValidationResult,
  type ValidationStage,
  toValidationSummary,
  isAllVerified,
  hasBrokenChain
} from './cross-module.entity'

/**
 * 跨模块验证服务
 *
 * 管理跨模块 E2E 验证链路的生命周期：
 * - 列出所有链路及其状态
 * - 执行验证并对接各个模块
 */
@Injectable()
export class CrossModuleService {
  /**
   * 内置的 4 条跨模块验证链路
   */
  private readonly chains: CrossModuleChain[] = [
    {
      name: 'admin-to-consumer',
      description: '管理端创建 → API 存储 → B 端展示 → C 端消费',
      modules: ['tenant', 'bootstrap', 'foundation', 'portal', 'market', 'miniapp'],
      status: ChainStatus.Defined
    },
    {
      name: 'sdk-to-api',
      description: 'SDK 调用 → API 处理 → LYT 服务 → 会员数据',
      modules: ['sdk', 'api', 'lyt', 'member'],
      status: ChainStatus.Defined
    },
    {
      name: 'governance-chain',
      description: '配置治理 → 身份访问 → 信任治理 → 运行时治理 → 韧性运营',
      modules: [
        'configuration-governance',
        'identity-access',
        'trust-governance',
        'runtime-governance',
        'resilience-operations'
      ],
      status: ChainStatus.Defined
    },
    {
      name: 'multi-client-consistency',
      description: '管理端 Web → 企业端 Web → 门店 Web → 小程序 → API 一致性',
      modules: ['admin-web', 'tob-web', 'storefront-web', 'miniapp', 'api'],
      status: ChainStatus.Defined
    }
  ]

  /**
   * 列出所有跨模块链路
   */
  listChains(filter?: { chainName?: string; status?: string }): CrossModuleChain[] {
    let result = this.chains

    if (filter?.chainName) {
      result = result.filter((c) => c.name === filter.chainName)
    }
    if (filter?.status) {
      result = result.filter((c) => c.status === filter.status)
    }

    return result
  }

  /**
   * 获取链路状态摘要
   */
  getSummary(): ReturnType<typeof toValidationSummary> {
    return toValidationSummary(this.chains)
  }

  /**
   * 执行跨模块验证
   */
  async validate(
    chainNames: string[] | undefined,
    context?: CrossModuleContext
  ): Promise<CrossModuleValidationResult[]> {
    const targets = chainNames
      ? this.chains.filter((c) => chainNames.includes(c.name))
      : this.chains

    const results: CrossModuleValidationResult[] = []

    for (const chain of targets) {
      const result = await this.validateChain(chain, context)
      results.push(result)

      // 更新链路状态
      chain.status = result.passed ? ChainStatus.Verified : ChainStatus.Broken
      chain.lastVerifiedAt = new Date().toISOString()
      if (!result.passed) {
        chain.brokenNodes = result.stages
          .filter((s) => !s.passed)
          .map((s) => `${s.from} → ${s.to}`)
      }
    }

    return results
  }

  /**
   * 验证单条链路
   */
  private async validateChain(
    chain: CrossModuleChain,
    context?: CrossModuleContext
  ): Promise<CrossModuleValidationResult> {
    const startTime = Date.now()
    const stages: ValidationStage[] = []

    // 为每个相邻模块对创建验证阶段
    for (let i = 0; i < chain.modules.length - 1; i++) {
      const stageStart = Date.now()
      const from = chain.modules[i]
      const to = chain.modules[i + 1]

      try {
        const passed = await this.simulateModuleConnection(from, to, context)
        stages.push({
          stage: `stage-${i + 1}`,
          from,
          to,
          passed,
          durationMs: Date.now() - stageStart
        })
      } catch (err: unknown) {
        stages.push({
          stage: `stage-${i + 1}`,
          from,
          to,
          passed: false,
          error: err instanceof Error ? err.message : 'Unknown validation error',
          durationMs: Date.now() - stageStart
        })
      }
    }

    const allPassed = stages.every((s) => s.passed)

    return {
      chainName: chain.name,
      passed: allPassed,
      stages,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime
    }
  }

  /**
   * 模拟模块间连接检查
   */
  private async simulateModuleConnection(
    _from: string,
    _to: string,
    _context?: CrossModuleContext
  ): Promise<boolean> {
    // 在 mock 环境中所有模块连接都返回 true
    // 生产环境将替换为实际的 E2E 连接检查
    return true
  }

  /**
   * 检查所有链路是否全部验证通过
   */
  checkAllVerified(): boolean {
    return isAllVerified(this.chains)
  }

  /**
   * 检查是否存在断开的链路
   */
  checkHasBroken(): boolean {
    return hasBrokenChain(this.chains)
  }

  /**
   * 重置所有链路状态
   */
  resetAll(): void {
    for (const chain of this.chains) {
      chain.status = ChainStatus.Defined
      chain.lastVerifiedAt = undefined
      chain.brokenNodes = undefined
    }
  }
}
