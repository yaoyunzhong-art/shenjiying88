/**
 * champion.service.ts - Phase-18 T19-T20
 * 用途: Champion Dashboard 数据采集 + 排行榜
 * 关联: phase-18-experience-ai/spec.md §3
 */
import { Injectable, Logger } from '@nestjs/common';
import { CONTRIBUTION_WEIGHTS } from './champion.entity';

export const CHAMPION_ROLES = ['APPROVER', 'CHAMPION', 'OBSERVER'] as const;
export type ChampionRole = (typeof CHAMPION_ROLES)[number];

export type ContributionKind = keyof typeof CONTRIBUTION_WEIGHTS;

export interface KnowledgeContribution {
  kind: ContributionKind;
  weight: number;
  refId: string;
  occurredAt: string;
  description?: string;
}

export interface ChampionProfile {
  id: string;
  name: string;
  role: ChampionRole;
  joinedAt: string;
  contributions: KnowledgeContribution[];
  totalScore: number;
}

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

export interface DecisionTimelineEntry {
  date: string;
  championId: string;
  name: string;
  action: string;
  refId: string;
}

export interface KnowledgeMap {
  totalChampions: number;
  totalContributions: number;
  totalScore: number;
  byKind: Record<ContributionKind, number>;
  byRole: Record<ChampionRole, number>;
}

/**
 * ChampionService - 收集 / 聚合 Champion 知识贡献
 *
 * 数据源抽象 (V1 用内存,V2 接 git log / GitLab API / Pulse DB):
 * - commit: git log 解析
 * - review: review_request 表
 * - RFC: decision-records/DR-*.md 解析 frontmatter
 * - pulse_review: pulse-review 提交记录
 * - retro: lessons-learned/*.md author
 *
 * 评分 (V1):
 * - commit: 2 分
 * - review: 3 分
 * - RFC: 8 分 (高价值决策)
 * - pulse_review: 4 分
 * - retro: 6 分
 */
@Injectable()
export class ChampionService {
  private readonly logger = new Logger(ChampionService.name);
  private readonly champions = new Map<string, ChampionProfile>();
  private readonly weights = { ...CONTRIBUTION_WEIGHTS };

  // ── Profile management ──

  registerChampion(input: {
    id?: string;
    name: string;
    role: ChampionRole;
    joinedAt?: string;
  }): ChampionProfile {
    const champion: ChampionProfile = {
      id: input.id ?? `champion-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: input.name,
      role: input.role,
      joinedAt: input.joinedAt ?? new Date().toISOString(),
      contributions: [],
      totalScore: 0,
    };
    this.champions.set(champion.id, champion);
    return champion;
  }

  getChampion(id: string): ChampionProfile | undefined {
    return this.champions.get(id);
  }

  listChampions(role?: ChampionRole): ChampionProfile[] {
    const all = Array.from(this.champions.values());
    return role ? all.filter((c) => c.role === role) : all;
  }

  // ── Contribution recording ──

  recordContribution(input: {
    championId: string;
    kind: ContributionKind;
    refId: string;
    description?: string;
    occurredAt?: string;
  }): ChampionProfile {
    const champion = this.champions.get(input.championId);
    if (!champion) throw new Error(`Champion not found: ${input.championId}`);

    // 幂等性: 相同 refId 应更新而非新增
    const existingIdx = champion.contributions.findIndex(c => c.refId === input.refId);
    if (existingIdx !== -1) {
      // 更新已有贡献
      const existing = champion.contributions[existingIdx];
      existing.kind = input.kind;
      existing.weight = this.weights[input.kind];
      existing.occurredAt = input.occurredAt ?? new Date().toISOString();
      if (input.description !== undefined) existing.description = input.description;
      this.logger.log(
        `[${champion.name}] update +${existing.weight} (${existing.kind} ${existing.refId})`,
      );
    } else {
      const contribution: KnowledgeContribution = {
        kind: input.kind,
        weight: this.weights[input.kind],
        refId: input.refId,
        occurredAt: input.occurredAt ?? new Date().toISOString(),
        description: input.description,
      };
      champion.contributions.push(contribution);
      this.logger.log(
        `[${champion.name}] +${contribution.weight} (${contribution.kind} ${contribution.refId})`,
      );
    }
    champion.totalScore = champion.contributions.reduce((sum, c) => sum + c.weight, 0);
    return champion;
  }

  // ── Aggregations ──

  /** Champion 排行榜 - 按总分降序 */
  getRanking(): ChampionRankingEntry[] {
    const entries: ChampionRankingEntry[] = Array.from(this.champions.values()).map((c) => {
      const counts = {
        commits: c.contributions.filter((x) => x.kind === 'COMMIT').length,
        reviews: c.contributions.filter((x) => x.kind === 'REVIEW').length,
        rfcs: c.contributions.filter((x) => x.kind === 'RFC').length,
        pulseReviews: c.contributions.filter((x) => x.kind === 'PULSE_REVIEW').length,
        retros: c.contributions.filter((x) => x.kind === 'RETRO').length,
      };
      const totalScore = c.contributions.reduce((sum, x) => sum + x.weight, 0);
      return {
        championId: c.id,
        name: c.name,
        role: c.role,
        totalScore,
        ...counts,
        rank: 0,
      };
    });
    entries.sort((a, b) => b.totalScore - a.totalScore);
    entries.forEach((e, i) => (e.rank = i + 1));
    return entries;
  }

  /** 决策时间线 - 按 occurredAt 倒序 */
  getDecisionTimeline(filter?: { championId?: string; sinceDate?: string }): DecisionTimelineEntry[] {
    const timeline: DecisionTimelineEntry[] = [];
    for (const champion of this.champions.values()) {
      if (filter?.championId && champion.id !== filter.championId) continue;
      for (const c of champion.contributions) {
        if (filter?.sinceDate && c.occurredAt < filter.sinceDate) continue;
        timeline.push({
          date: c.occurredAt,
          championId: champion.id,
          name: champion.name,
          action: `${c.kind} (${c.weight}pts)`,
          refId: c.refId,
        });
      }
    }
    timeline.sort((a, b) => b.date.localeCompare(a.date));
    return timeline;
  }

  /** Knowledge Map - 按 kind 聚合的总量统计 */
  getKnowledgeMap(): KnowledgeMap {
    const byKind: Record<ContributionKind, number> = {
      COMMIT: 0,
      REVIEW: 0,
      RFC: 0,
      PULSE_REVIEW: 0,
      RETRO: 0,
    };
    const byRole: Record<ChampionRole, number> = {
      APPROVER: 0,
      CHAMPION: 0,
      OBSERVER: 0,
    };
    let totalScore = 0;
    let totalContributions = 0;
    for (const champion of this.champions.values()) {
      byRole[champion.role] += 1;
      for (const c of champion.contributions) {
        byKind[c.kind] += 1;
        totalScore += c.weight;
        totalContributions += 1;
      }
    }
    return {
      totalChampions: this.champions.size,
      totalContributions,
      totalScore,
      byKind,
      byRole,
    };
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.champions.clear();
  }
}
