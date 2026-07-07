/**
 * member-level 模块对外契约
 *
 * 负责 6阶18级会员等级体系评估
 * 核心方法：
 *  - evaluateMemberLevel(input): 单次等级评估
 *  - batchEvaluate(input): 批量评估
 *  - getAllLevelConfig(): 获取等级全量配置
 */

import type { LevelInfo, BatchLevelOutput, AllLevelConfig, LevelEvaluationInput, BatchLevelInput, LevelChangeRecord } from './member-level.entity'

export interface MemberLevelContract {
  evaluateMemberLevel(input: LevelEvaluationInput): LevelInfo
  batchEvaluate(input: BatchLevelInput): BatchLevelOutput
  getAllLevelConfig(): AllLevelConfig
  getUpgradePath(fromTier: string, fromSub: string, toTier: string, toSub: string): LevelChangeRecord[]
}

export type { LevelInfo, BatchLevelOutput, AllLevelConfig, LevelEvaluationInput, BatchLevelInput, LevelChangeRecord }
