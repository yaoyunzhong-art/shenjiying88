/**
 * tournament-handicap.service.ts
 * BS-0281: 擂台让分机制
 *
 * 根据玩家历史胜率差自动计算让分：
 * - 胜率差 > 20% → 弱势方+5分
 * - 胜率差 > 40% → 弱势方+10分
 * - 胜率差 > 60% → 弱势方+20分
 * - 最大让分不超过20分
 */

import { Injectable } from '@nestjs/common'
import type {
  HandicapConfig,
  HandicapResult,
  PlayerWinRate,
  Ranking,
} from './tournament.entity'

const DEFAULT_HANDICAP_CONFIG: HandicapConfig = {
  enabled: true,
  maxHandicap: 20,
  winRateDiffThreshold: 0.2,
}

@Injectable()
export class TournamentHandicapService {
  /**
   * 计算两位选手之间的让分
   *
   * @param player1Id 选手1
   * @param player2Id 选手2
   * @param rankings 当前比赛排名数据
   * @param config 让分配置（可选，使用默认值）
   * @returns 让分结果，如果不需要让分则返回null
   */
  calculateHandicap(
    player1Id: string,
    player2Id: string,
    rankings: Ranking[],
    config: HandicapConfig = DEFAULT_HANDICAP_CONFIG
  ): HandicapResult | null {
    if (!config.enabled) return null

    const player1 = rankings.find(r => r.memberId === player1Id)
    const player2 = rankings.find(r => r.memberId === player2Id)

    // 至少需要一方的比赛数据
    if (!player1 && !player2) return null

    const winRate1 = this.calcWinRate(player1)
    const winRate2 = this.calcWinRate(player2)

    const winRateDiff = Math.abs(winRate1 - winRate2)

    // 胜率差未达阈值，无需让分
    if (winRateDiff < config.winRateDiffThreshold) return null

    // 确定弱势方和强势方
    const [underdog, favorite] =
      winRate1 <= winRate2
        ? [{ memberId: player1Id, winRate: winRate1 }, { memberId: player2Id, winRate: winRate2 }]
        : [{ memberId: player2Id, winRate: winRate2 }, { memberId: player1Id, winRate: winRate1 }]

    // 根据胜率差计算让分
    let handicapPoints = 0
    if (winRateDiff > 0.6) {
      handicapPoints = config.maxHandicap // 20分
    } else if (winRateDiff > 0.4) {
      handicapPoints = 10
    } else if (winRateDiff > 0.2) {
      handicapPoints = 5
    }

    if (handicapPoints <= 0) return null

    return {
      handicapPoints,
      winRateDiff,
      underdogId: underdog.memberId,
      favoriteId: favorite.memberId,
      adjustedScore: handicapPoints,
    }
  }

  /**
   * 将让分应用到比赛结果
   * 在记录比赛成绩时调用此方法得到调整后的分数
   */
  applyHandicapToScore(
    matchPlayer1Id: string,
    matchPlayer2Id: string,
    score1: number,
    score2: number,
    handicap: HandicapResult,
  ): { adjustedScore1: number; adjustedScore2: number } {
    if (handicap.underdogId === matchPlayer1Id) {
      return {
        adjustedScore1: score1 + handicap.handicapPoints,
        adjustedScore2: score2,
      }
    }
    return {
      adjustedScore1: score1,
      adjustedScore2: score2 + handicap.handicapPoints,
    }
  }

  /**
   * 计算选手胜率
   */
  getPlayerWinRate(memberId: string, rankings: Ranking[]): PlayerWinRate {
    const ranking = rankings.find(r => r.memberId === memberId)
    return {
      memberId,
      totalMatches: ranking ? ranking.wins + ranking.losses : 0,
      wins: ranking?.wins ?? 0,
      winRate: this.calcWinRate(ranking ?? null),
    }
  }

  /**
   * 批量获取所有选手胜率
   */
  getAllPlayerWinRates(rankings: Ranking[]): PlayerWinRate[] {
    return rankings.map(r => ({
      memberId: r.memberId,
      totalMatches: r.wins + r.losses,
      wins: r.wins,
      winRate: this.calcWinRate(r),
    }))
  }

  /**
   * 计算胜率（处理除以0）
   */
  private calcWinRate(ranking: Ranking | null | undefined): number {
    if (!ranking) return 0
    const total = ranking.wins + ranking.losses
    if (total === 0) return 0
    return ranking.wins / total
  }
}
