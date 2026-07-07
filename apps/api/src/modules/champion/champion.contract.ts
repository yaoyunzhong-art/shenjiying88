/**
 * Champion 模块跨边界通信契约
 *
 * 定义其他模块消费 Champion 数据的稳定表面层。
 */

import type { ChampionProfile, ChampionRankingEntry, KnowledgeMap } from './champion.entity';

/** Champion 契约（跨模块安全子集） */
export interface ChampionContract {
  id: string;
  name: string;
  role: string;
  joinedAt: string;
  contributions: number;
  totalScore: number;
}

/** 排行榜契约 */
export interface ChampionRankingContract {
  entries: Array<{
    championId: string;
    name: string;
    role: string;
    totalScore: number;
    commits: number;
    reviews: number;
    rfcs: number;
    pulseReviews: number;
    retros: number;
    rank: number;
  }>;
  totalChampions: number;
}

/** 知识地图契约 */
export interface KnowledgeMapContract {
  totalChampions: number;
  totalContributions: number;
  totalScore: number;
  byKind: Record<string, number>;
  byRole: Record<string, number>;
}

/**
 * 将 ChampionProfile 转换为跨模块契约
 */
export function toChampionContract(profile: ChampionProfile): ChampionContract {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    joinedAt: profile.joinedAt instanceof Date ? profile.joinedAt.toISOString() : String(profile.joinedAt),
    contributions: profile.contributions.length,
    totalScore: profile.totalScore,
  };
}

/**
 * 将 ChampionRankingEntry[] 转换为排行榜契约
 */
export function toChampionRankingContract(entries: ChampionRankingEntry[]): ChampionRankingContract {
  return {
    entries: entries.map((e) => ({
      championId: e.championId,
      name: e.name,
      role: e.role,
      totalScore: e.totalScore,
      commits: e.commits,
      reviews: e.reviews,
      rfcs: e.rfcs,
      pulseReviews: e.pulseReviews,
      retros: e.retros,
      rank: e.rank,
    })),
    totalChampions: entries.length,
  };
}

/**
 * 将 KnowledgeMap 转换为知识地图契约
 */
export function toKnowledgeMapContract(map: KnowledgeMap): KnowledgeMapContract {
  return {
    totalChampions: map.totalChampions,
    totalContributions: map.totalContributions,
    totalScore: map.totalScore,
    byKind: { ...map.byKind },
    byRole: { ...map.byRole },
  };
}
