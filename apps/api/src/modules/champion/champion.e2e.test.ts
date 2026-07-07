import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 用途: Champion Dashboard e2e 验证
import { ChampionService } from './champion.service';
import { ContributionKind } from './champion.entity';

describe('ChampionService · Phase-18 T19-T20', () => {
  let service: ChampionService;

  beforeEach(() => {
    service = new ChampionService();
  });

  // AC-1: 3 个 Champion 注册,角色分布正确
  it('AC-1 registerChampion: roles & listing', () => {
    const alice = service.registerChampion({ name: 'Alice', role: 'APPROVER' });
    const bob = service.registerChampion({ name: 'Bob', role: 'CHAMPION' });
    const carol = service.registerChampion({ name: 'Carol', role: 'OBSERVER' });
    expect(alice.role).toBe('APPROVER');
    expect(bob.role).toBe('CHAMPION');
    expect(carol.role).toBe('OBSERVER');
    expect(service.listChampions('CHAMPION').map((c) => c.name)).toEqual(['Bob']);
    expect(service.listChampions().length).toBe(3);
  });

  // AC-2: 评分权重 - COMMIT=2,REVIEW=3,RFC=8,PULSE_REVIEW=4,RETRO=6
  it('AC-2 recordContribution: scoring weights', () => {
    const alice = service.registerChampion({ name: 'Alice', role: 'APPROVER' });
    service.recordContribution({ championId: alice.id, kind: ContributionKind.Commit, refId: 'c1' });
    service.recordContribution({ championId: alice.id, kind: ContributionKind.Rfc, refId: 'DR-005' });
    service.recordContribution({ championId: alice.id, kind: ContributionKind.PulseReview, refId: 'pulse-71' });
    service.recordContribution({ championId: alice.id, kind: ContributionKind.Retro, refId: 'phase-17' });
    const fresh = service.getChampion(alice.id)!;
    expect(fresh.contributions.length).toBe(4);
    const total = fresh.contributions.reduce((s, c) => s + c.weight, 0);
    expect(total).toBe(2 + 8 + 4 + 6);
  });

  // AC-3: 排行榜按总分降序,rank 字段正确
  it('AC-3 getRanking: ordered + rank', () => {
    const a = service.registerChampion({ name: 'Alice', role: 'CHAMPION' });
    const b = service.registerChampion({ name: 'Bob', role: 'CHAMPION' });
    const c = service.registerChampion({ name: 'Carol', role: 'OBSERVER' });
    service.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'c1' });
    service.recordContribution({ championId: a.id, kind: ContributionKind.Rfc, refId: 'DR-A' });
    service.recordContribution({ championId: b.id, kind: ContributionKind.Review, refId: 'r1' });
    service.recordContribution({ championId: b.id, kind: ContributionKind.PulseReview, refId: 'p1' });
    service.recordContribution({ championId: b.id, kind: ContributionKind.Retro, refId: 'r-phase' });
    const ranking = service.getRanking();
    expect(ranking[0].name).toBe('Bob');
    expect(ranking[0].totalScore).toBe(13);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[1].name).toBe('Alice');
    expect(ranking[1].rank).toBe(2);
    expect(ranking[2].name).toBe('Carol');
    expect(ranking[2].rank).toBe(3);
    expect(ranking[2].totalScore).toBe(0);
  });

  // AC-4: Decision Timeline 按 occurredAt 倒序 + filter
  it('AC-4 getDecisionTimeline: order + filter', () => {
    const a = service.registerChampion({ name: 'Alice', role: 'APPROVER' });
    const b = service.registerChampion({ name: 'Bob', role: 'CHAMPION' });
    service.recordContribution({
      championId: a.id,
      kind: ContributionKind.Commit,
      refId: 'c1',
      occurredAt: '2026-06-01T10:00:00Z',
    });
    service.recordContribution({
      championId: b.id,
      kind: ContributionKind.Rfc,
      refId: 'DR-005',
      occurredAt: '2026-06-15T14:00:00Z',
    });
    service.recordContribution({
      championId: a.id,
      kind: ContributionKind.Retro,
      refId: 'phase-17',
      occurredAt: '2026-06-26T08:00:00Z',
    });
    const timeline = service.getDecisionTimeline();
    expect(timeline[0].refId).toBe('phase-17');
    expect(timeline[2].refId).toBe('c1');
    const sinceJune10 = service.getDecisionTimeline({ sinceDate: '2026-06-10' });
    expect(sinceJune10.length).toBe(2);
    const onlyBob = service.getDecisionTimeline({ championId: b.id });
    expect(onlyBob.length).toBe(1);
    expect(onlyBob[0].name).toBe('Bob');
  });

  // AC-5: Knowledge Map 聚合 + byKind/byRole 统计
  it('AC-5 getKnowledgeMap: aggregation', () => {
    const a = service.registerChampion({ name: 'Alice', role: 'APPROVER' });
    const b = service.registerChampion({ name: 'Bob', role: 'CHAMPION' });
    service.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'c1' });
    service.recordContribution({ championId: a.id, kind: ContributionKind.Commit, refId: 'c2' });
    service.recordContribution({ championId: a.id, kind: ContributionKind.Rfc, refId: 'DR-005' });
    service.recordContribution({ championId: b.id, kind: ContributionKind.Review, refId: 'r1' });
    const map = service.getKnowledgeMap();
    expect(map.totalChampions).toBe(2);
    expect(map.totalContributions).toBe(4);
    expect(map.totalScore).toBe(2 + 2 + 8 + 3);
    expect(map.byKind[ContributionKind.Commit]).toBe(2);
    expect(map.byKind[ContributionKind.Rfc]).toBe(1);
    expect(map.byKind[ContributionKind.Review]).toBe(1);
    expect(map.byRole['APPROVER']).toBe(1);
    expect(map.byRole['CHAMPION']).toBe(1);
    expect(map.byRole['OBSERVER']).toBe(0);
  });
});
