/**
 * member-level-decay.service.ts
 * BS-0276: 成长值衰减曲线
 *
 * 90天未消费成长值按衰减曲线下降：
 * - 月度衰减：每月降20%（第90~179天）
 * - 季度衰减：每季降50%（第180~269天）
 * - 半年归零：第270天起归零
 */

import { Injectable } from '@nestjs/common'
import type { DecayConfig, DecayResult, DecayPeriod } from './member-level.entity'

const DAYS_UNTIL_DECAY_START = 90 // 90天未消费开始衰减
const DAYS_MONTHLY_END = 179       // 月度衰减结束
const DAYS_QUARTERLY_END = 269     // 季度衰减结束

@Injectable()
export class MemberLevelDecayService {
  /**
   * 计算成长值衰减
   * @param config 衰减配置
   * @returns 衰减结果
   */
  calculateDecay(config: DecayConfig): DecayResult {
    const { lastConsumptionDate, currentGrowth, idleDays } = config

    // 未到衰减期
    if (idleDays < DAYS_UNTIL_DECAY_START) {
      return {
        originalGrowth: currentGrowth,
        decayedGrowth: currentGrowth,
        decayRate: 0,
        decayAmount: 0,
        period: 'monthly',
        idleDays,
        nextDecayDate: this.calcNextDecayDate(lastConsumptionDate, 'monthly')
      }
    }

    // 超过半年（270天），归零
    if (idleDays >= 270) {
      return {
        originalGrowth: currentGrowth,
        decayedGrowth: 0,
        decayRate: 1,
        decayAmount: currentGrowth,
        period: 'halfYear',
        idleDays,
        nextDecayDate: '已归零'
      }
    }

    // 季度衰减（180~269天）：每90天降50%，最多降100%
    if (idleDays >= 180) {
      const quartersElapsed = Math.floor((idleDays - 179 + 89) / 90)
      const decayRate = Math.min(1, quartersElapsed * 0.5)
      const decayAmount = Math.round(currentGrowth * decayRate)
      const decayedGrowth = currentGrowth - decayAmount

      return {
        originalGrowth: currentGrowth,
        decayedGrowth: Math.max(0, decayedGrowth),
        decayRate,
        decayAmount,
        period: 'quarterly',
        idleDays,
        nextDecayDate: this.calcNextDecayDate(lastConsumptionDate, 'quarterly')
      }
    }

    // 月度衰减（90~179天）：每30天降20%
    const monthsElapsed = Math.floor((idleDays - 89 + 29) / 30)
    const decayRate = Math.min(1, monthsElapsed * 0.2)
    const decayAmount = Math.round(currentGrowth * decayRate)
    const decayedGrowth = currentGrowth - decayAmount

    return {
      originalGrowth: currentGrowth,
      decayedGrowth: Math.max(0, decayedGrowth),
      decayRate,
      decayAmount,
      period: 'monthly',
      idleDays,
      nextDecayDate: this.calcNextDecayDate(lastConsumptionDate, 'monthly')
    }
  }

  /**
   * 应用衰减并返回衰减后的成长值
   */
  applyDecay(config: DecayConfig): number {
    return this.calculateDecay(config).decayedGrowth
  }

  /**
   * 计算下次衰减日期
   */
  private calcNextDecayDate(lastConsumptionDate: string, period: DecayPeriod): string {
    const base = new Date(lastConsumptionDate)
    const addDays = period === 'monthly' ? 30 : period === 'quarterly' ? 90 : 180
    // 从90天起算
    base.setDate(base.getDate() + DAYS_UNTIL_DECAY_START + addDays)
    return base.toISOString().slice(0, 10)
  }
}
