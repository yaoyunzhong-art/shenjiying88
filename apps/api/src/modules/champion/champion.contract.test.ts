import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [champion] [A] contract.test.ts 补全
 *
 * 覆盖:
 *   ChampionContract / ChampionRankingContract / KnowledgeMapContract 接口形状
 *   toChampionContract / toChampionRankingContract / toKnowledgeMapContract 转换函数
 *   包含正常流程 + 边界条件
 */

import assert from 'node:assert/strict';
import { ChampionRole, ContributionKind, type ChampionProfile, type ChampionRankingEntry, type KnowledgeMap } from './champion.entity';
import {
  toChampionContract,
  toChampionRankingContract,
  toKnowledgeMapContract,
} from './champion.contract';

// ── 辅助工厂 ──

function makeChampionProfile(overrides?: Partial<ChampionProfile>): ChampionProfile {
  return {
    id: 'champ-001',
    name: 'Alice',
    role: ChampionRole.Champion,
    joinedAt: new Date('2026-06-01T00:00:00.000Z'),
    contributions: [
      {
        id: 'c-1',
        kind: ContributionKind.Commit,
        weight: 2,
        refId: 'abc123',
        occurredAt: new Date('2026-06-10T00:00:00.000Z'),
        description: 'Initial commit',
      },
    ],
    totalScore: 2,
    ...overrides,
  };
}

function makeRankingEntry(overrides?: Partial<ChampionRankingEntry>): ChampionRankingEntry {
  return {
    championId: 'champ-001',
    name: 'Alice',
    role: ChampionRole.Champion,
    totalScore: 100,
    commits: 10,
    reviews: 15,
    rfcs: 3,
    pulseReviews: 5,
    retros: 2,
    rank: 1,
    ...overrides,
  };
}

function makeKnowledgeMap(overrides?: Partial<KnowledgeMap>): KnowledgeMap {
  return {
    totalChampions: 3,
    totalContributions: 20,
    totalScore: 120,
    byKind: {
      [ContributionKind.Commit]: 10,
      [ContributionKind.Review]: 5,
      [ContributionKind.Rfc]: 2,
      [ContributionKind.PulseReview]: 2,
      [ContributionKind.Retro]: 1,
    },
    byRole: {
      [ChampionRole.Approver]: 1,
      [ChampionRole.Champion]: 1,
      [ChampionRole.Observer]: 1,
    },
    ...overrides,
  };
}

// ── toChampionContract ──

describe('toChampionContract', () => {
  it('完整档案转换', () => {
    const profile = makeChampionProfile();
    const contract = toChampionContract(profile);

    assert.equal(contract.id, 'champ-001');
    assert.equal(contract.name, 'Alice');
    assert.equal(contract.role, ChampionRole.Champion);
    assert.equal(contract.joinedAt, '2026-06-01T00:00:00.000Z');
    assert.equal(contract.contributions, 1);
    assert.equal(contract.totalScore, 2);
  });

  it('零贡献 Champion', () => {
    const profile = makeChampionProfile({
      id: 'champ-002',
      name: 'Bob',
      role: ChampionRole.Observer,
      contributions: [],
      totalScore: 0,
    });
    const contract = toChampionContract(profile);

    assert.equal(contract.contributions, 0);
    assert.equal(contract.totalScore, 0);
  });

  it('高分数 Champion', () => {
    const profile = makeChampionProfile({
      id: 'champ-003',
      name: 'Carol',
      role: ChampionRole.Approver,
      contributions: Array(10).fill(null).map((_, i) => ({
        id: `c-${i}`,
        kind: ContributionKind.Rfc,
        weight: 8,
        refId: `DR-${i}`,
        occurredAt: new Date(),
      })),
      totalScore: 80,
    });
    const contract = toChampionContract(profile);

    assert.equal(contract.contributions, 10);
    assert.equal(contract.totalScore, 80);
  });

  it('所有角色类型均可转换', () => {
    for (const role of Object.values(ChampionRole)) {
      const profile = makeChampionProfile({ role, name: `User-${role}` });
      const contract = toChampionContract(profile);
      assert.equal(contract.role, role);
    }
  });
});

// ── toChampionRankingContract ──

describe('toChampionRankingContract', () => {
  it('空排行榜', () => {
    const contract = toChampionRankingContract([]);
    assert.equal(contract.totalChampions, 0);
    assert.equal(contract.entries.length, 0);
  });

  it('单条排行榜记录', () => {
    const entries = [makeRankingEntry()];
    const contract = toChampionRankingContract(entries);

    assert.equal(contract.totalChampions, 1);
    assert.equal(contract.entries[0].championId, 'champ-001');
    assert.equal(contract.entries[0].rank, 1);
  });

  it('多条排行榜记录保持顺序', () => {
    const entries = [
      makeRankingEntry({ championId: 'c1', name: 'Alice', totalScore: 100, rank: 1 }),
      makeRankingEntry({ championId: 'c2', name: 'Bob', totalScore: 80, rank: 2 }),
      makeRankingEntry({ championId: 'c3', name: 'Carol', totalScore: 60, rank: 3 }),
    ];
    const contract = toChampionRankingContract(entries);

    assert.equal(contract.totalChampions, 3);
    assert.equal(contract.entries[0].name, 'Alice');
    assert.equal(contract.entries[1].name, 'Bob');
    assert.equal(contract.entries[2].name, 'Carol');
  });

  it('统计字段正确映射', () => {
    const entries = [makeRankingEntry({
      commits: 10,
      reviews: 5,
      rfcs: 2,
      pulseReviews: 3,
      retros: 1,
    })];
    const contract = toChampionRankingContract(entries);

    assert.equal(contract.entries[0].commits, 10);
    assert.equal(contract.entries[0].reviews, 5);
    assert.equal(contract.entries[0].rfcs, 2);
    assert.equal(contract.entries[0].pulseReviews, 3);
    assert.equal(contract.entries[0].retros, 1);
  });
});

// ── toKnowledgeMapContract ──

describe('toKnowledgeMapContract', () => {
  it('完整知识地图转换', () => {
    const map = makeKnowledgeMap();
    const contract = toKnowledgeMapContract(map);

    assert.equal(contract.totalChampions, 3);
    assert.equal(contract.totalContributions, 20);
    assert.equal(contract.totalScore, 120);
    assert.equal(contract.byKind.COMMIT, 10);
    assert.equal(contract.byKind.REVIEW, 5);
    assert.equal(contract.byRole.APPROVER, 1);
    assert.equal(contract.byRole.CHAMPION, 1);
    assert.equal(contract.byRole.OBSERVER, 1);
  });

  it('零数据知识地图', () => {
    const map = makeKnowledgeMap({
      totalChampions: 0,
      totalContributions: 0,
      totalScore: 0,
      byKind: {
        [ContributionKind.Commit]: 0,
        [ContributionKind.Review]: 0,
        [ContributionKind.Rfc]: 0,
        [ContributionKind.PulseReview]: 0,
        [ContributionKind.Retro]: 0,
      },
      byRole: {
        [ChampionRole.Approver]: 0,
        [ChampionRole.Champion]: 0,
        [ChampionRole.Observer]: 0,
      },
    });
    const contract = toKnowledgeMapContract(map);

    assert.equal(contract.totalChampions, 0);
    assert.equal(contract.totalContributions, 0);
    assert.equal(contract.totalScore, 0);
  });
});
