/**
 * Champion 实体定义
 *
 * 用途: Champion Dashboard 知识贡献评分实体
 * 关联: phase-18-experience-ai/spec.md §3
 */

/** Champion 角色 */
export enum ChampionRole {
  Approver = 'APPROVER',
  Champion = 'CHAMPION',
  Observer = 'OBSERVER',
}

/** 知识贡献类型 */
export enum ContributionKind {
  Commit = 'COMMIT',
  Review = 'REVIEW',
  Rfc = 'RFC',
  PulseReview = 'PULSE_REVIEW',
  Retro = 'RETRO',
}

/** 知识贡献权重映射 */
export const CONTRIBUTION_WEIGHTS: Record<ContributionKind, number> = {
  [ContributionKind.Commit]: 2,
  [ContributionKind.Review]: 3,
  [ContributionKind.Rfc]: 8,
  [ContributionKind.PulseReview]: 4,
  [ContributionKind.Retro]: 6,
};

/** 知识贡献记录 */
export interface ChampionContribution {
  id: string;
  kind: ContributionKind;
  weight: number;
  refId: string;
  occurredAt: Date;
  description?: string;
}

/** Champion 档案 */
export interface ChampionProfile {
  id: string;
  name: string;
  role: ChampionRole;
  joinedAt: Date;
  contributions: ChampionContribution[];
  totalScore: number;
}

/** Champion 排行榜条目 */
export interface ChampionRankingEntry {
  championId: string;
  name: string;
  role: ChampionRole;
  totalScore: number;
  commits: number;
  reviews: number;
  rfcs: number;
  pulseReviews: number;
  retros: number;
  rank: number;
}

/** 决策时间线条目 */
export interface DecisionTimelineEntry {
  date: string;
  championId: string;
  name: string;
  action: string;
  refId: string;
}

/** 知识地图聚合结果 */
export interface KnowledgeMap {
  totalChampions: number;
  totalContributions: number;
  totalScore: number;
  byKind: Record<ContributionKind, number>;
  byRole: Record<ChampionRole, number>;
}
