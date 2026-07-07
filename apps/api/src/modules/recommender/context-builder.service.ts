// context-builder.service.ts - Phase-19 T31
// 用途: 构建 Champion 推荐上下文 (历史贡献 + 当前任务 + 关联 Champion)
// 关联: phase-19-intelligence/spec.md §Phase 3
import { Injectable } from '@nestjs/common';

export interface ChampionSummary {
  championId: string;
  name: string;
  role: string;
  totalScore: number;
  topModules: string[];
  recentContributions: Array<{
    kind: string;
    refId: string;
    occurredAt: string;
    weight: number;
  }>;
}

export interface RecommendationContext {
  /** 当前 Champion */
  champion: ChampionSummary;
  /** 当前任务 (从 git branch / commit msg 提取) */
  currentTask: {
    branch?: string;
    files: string[];
    module: string;
    description?: string;
  };
  /** 关联 Champion (相同模块的活跃 Champion) */
  relatedChampions: ChampionSummary[];
  /** 历史 30 天贡献摘要 */
  recentSummary: {
    totalContributions: number;
    byKind: Record<string, number>;
    topRefIds: string[];
  };
  builtAt: string;
}

@Injectable()
export class ContextBuilderService {
  /**
   * 从原始数据构建 recommendation context
   */
  build(input: {
    champion: ChampionSummary;
    currentFiles: string[];
    branch?: string;
    allChampions: ChampionSummary[];
  }): RecommendationContext {
    const module = this.inferModule(input.currentFiles);
    const related = this.findRelatedChampions(input.allChampions, input.champion.championId, module);

    const recent = input.champion.recentContributions.slice(0, 30);
    const byKind: Record<string, number> = {};
    const refCounts: Record<string, number> = {};
    for (const c of recent) {
      byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
      refCounts[c.refId] = (refCounts[c.refId] ?? 0) + 1;
    }
    const topRefIds = Object.entries(refCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((x) => x[0]);

    return {
      champion: input.champion,
      currentTask: {
        branch: input.branch,
        files: input.currentFiles,
        module,
      },
      relatedChampions: related,
      recentSummary: {
        totalContributions: recent.length,
        byKind,
        topRefIds,
      },
      builtAt: new Date().toISOString(),
    };
  }

  /**
   * 从文件路径推断模块 (apps/api/src/modules/X/...)
   */
  private inferModule(files: string[]): string {
    for (const f of files) {
      const match = f.match(/modules\/([^/]+)/);
      if (match) return match[1];
    }
    return 'unknown';
  }

  /**
   * 找同模块的活跃 Champion (排除自己)
   */
  private findRelatedChampions(champions: ChampionSummary[], excludeId: string, module: string): ChampionSummary[] {
    return champions
      .filter((c) => c.championId !== excludeId && c.topModules.includes(module))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);
  }
}
