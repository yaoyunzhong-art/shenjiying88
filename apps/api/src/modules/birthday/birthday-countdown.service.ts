/**
 * birthday-countdown.service.ts
 * BS-0287: 生日特效倒计时预览
 *
 * 功能：
 * - 计算从当前日期到指定生日的倒计时
 * - 按倒计时天数产生不同层级的生日特效
 * - 提供倒计时预览信息（含特效类型提示）
 */

import { Injectable } from '@nestjs/common'

/** 特效类型 */
export type BirthdayEffectType = 'upcoming' | 'near' | 'tomorrow' | 'today' | 'past'

/** 倒计时信息 */
export interface BirthdayCountdown {
  memberId: string
  birthday: string /** MM-DD */
  /** 距离生日的天数 */
  daysUntilBirthday: number
  /** 特效类型 */
  effectType: BirthdayEffectType
  /** 特效等级（1-5, 越高越隆重） */
  effectLevel: number
  /** 特效名称 */
  effectName: string
  /** 特效描述 */
  effectDescription: string
  /** 是否可预览 */
  canPreview: boolean
  /** 倒计时详细 */
  detail: {
    days: number
    hours: number
    minutes: number
    seconds: number
  }
  /** 本次生日的具体日期 YYYY-MM-DD */
  birthdayDate: string
  /** 预览URL（占位） */
  previewUrl?: string
}

@Injectable()
export class BirthdayCountdownService {
  /**
   * 计算会员生日倒计时
   * @param memberId 会员ID
   * @param birthday 生日 (MM-DD)
   * @param includeSeconds 是否包含秒级精度（默认false）
   * @param nowParam 可选当前时间（用于测试，默认实时）
   */
  getCountdown(
    memberId: string,
    birthday: string,
    includeSeconds = false,
    nowParam?: Date,
  ): BirthdayCountdown {
    const now = nowParam ?? new Date()
    const [month, day] = birthday.split('-').map(Number)
    if (!month || !day) {
      throw new Error(`生日格式错误: ${birthday}，需要 MM-DD 格式`)
    }

    // 今年生日（取当天开始）
    const thisYearBirthday = new Date(now.getFullYear(), month - 1, day)
    thisYearBirthday.setHours(0, 0, 0, 0)

    // 当前日期（取当天开始）
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    // 目标生日（取当天开始），如果今年生日已过则用明年
    const targetBirthday = thisYearBirthday.getTime() >= todayStart.getTime()
      ? thisYearBirthday
      : new Date(now.getFullYear() + 1, month - 1, day)
    targetBirthday.setHours(0, 0, 0, 0)

    const diffMs = targetBirthday.getTime() - todayStart.getTime()
    const daysUntilBirthday = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

    const { effectType, effectLevel, effectName, effectDescription } =
      this.getEffect(daysUntilBirthday)

    return {
      memberId,
      birthday,
      daysUntilBirthday,
      effectType,
      effectLevel,
      effectName,
      effectDescription,
      canPreview: daysUntilBirthday >= 0 && daysUntilBirthday <= 90,
      detail: {
        days: daysUntilBirthday,
        hours,
        minutes,
        seconds: includeSeconds ? seconds : 0,
      },
      birthdayDate: targetBirthday.toISOString().slice(0, 10),
      previewUrl: daysUntilBirthday >= 0 && daysUntilBirthday <= 90
        ? `/birthday/preview/${memberId}?effect=${effectType}`
        : undefined,
    }
  }

  /**
   * 获取生日特效预览信息（不进行日历计算）
   */
  getPreview(memberId: string, birthday: string, nowParam?: Date): {
    effectType: BirthdayEffectType
    effectLevel: number
    effectName: string
    effectDescription: string
    config: Record<string, unknown>
  } {
    const countdown = this.getCountdown(memberId, birthday, true, nowParam)
    const config = this.getEffectConfig(countdown.effectType)

    return {
      effectType: countdown.effectType,
      effectLevel: countdown.effectLevel,
      effectName: countdown.effectName,
      effectDescription: countdown.effectDescription,
      config,
    }
  }

  /**
   * 根据天数获取特效配置
   */
  private getEffect(daysUntil: number): {
    effectType: BirthdayEffectType
    effectLevel: number
    effectName: string
    effectDescription: string
  } {
    if (daysUntil < 0) {
      return {
        effectType: 'past',
        effectLevel: 1,
        effectName: '🎂 生日已过',
        effectDescription: '您的生日已经过了，期待来年',
      }
    }

    if (daysUntil === 0) {
      return {
        effectType: 'today',
        effectLevel: 5,
        effectName: '🎉🎊 今天生日！',
        effectDescription: '今天是您的生日！祝您生日快乐！🎂',
      }
    }

    if (daysUntil === 1) {
      return {
        effectType: 'tomorrow',
        effectLevel: 4,
        effectName: '⏰ 明天生日',
        effectDescription: '您的生日就在明天，快准备好庆祝吧！',
      }
    }

    if (daysUntil <= 7) {
      return {
        effectType: 'near',
        effectLevel: 3,
        effectName: '🎈 生日倒计时',
        effectDescription: `距离您的生日还有 ${daysUntil} 天，期待惊喜！`,
      }
    }

    return {
      effectType: 'upcoming',
      effectLevel: 2,
      effectName: '📅 生日即将到来',
      effectDescription: `距离您的生日还有 ${daysUntil} 天`,
    }
  }

  /**
   * 获取特效渲染配置
   */
  private getEffectConfig(effectType: BirthdayEffectType): Record<string, unknown> {
    switch (effectType) {
      case 'today':
        return {
          animation: 'confetti',
          duration: 5000,
          sound: 'birthday-song',
          color: ['#FF6B6B', '#FFE66D', '#4ECDC4'],
          balloons: true,
          fireworks: true,
        }
      case 'tomorrow':
        return {
          animation: 'pulse',
          duration: 3000,
          color: ['#FF6B6B', '#FFE66D'],
          countdown: true,
        }
      case 'near':
        return {
          animation: 'glow',
          duration: 2000,
          countdown: true,
          color: ['#FFE66D'],
        }
      case 'upcoming':
        return {
          animation: 'static',
          countdown: true,
          color: ['#E0E0E0'],
        }
      default:
        return {
          animation: 'none',
        }
    }
  }
}
