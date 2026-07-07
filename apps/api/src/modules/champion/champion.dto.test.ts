import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [champion] [A] dto.test.ts 补全
 *
 * Champion DTO 定义测试
 */

import assert from 'node:assert/strict';
import { ChampionRole, ContributionKind } from './champion.entity';
import {
  RegisterChampionDto,
  RecordContributionDto,
  RankingQueryDto,
  TimelineQueryDto,
} from './champion.dto';

describe('RegisterChampionDto', () => {
  it('必填字段：name + role', () => {
    const dto = Object.assign(new RegisterChampionDto(), {
      name: 'Alice',
      role: ChampionRole.Champion,
    });
    assert.equal(dto.name, 'Alice');
    assert.equal(dto.role, ChampionRole.Champion);
  });

  it('可选字段 joinedAt', () => {
    const dto = Object.assign(new RegisterChampionDto(), {
      name: 'Bob',
      role: ChampionRole.Approver,
      joinedAt: '2026-06-01T00:00:00.000Z',
    });
    assert.equal(dto.joinedAt, '2026-06-01T00:00:00.000Z');
  });

  it('所有角色类型均可赋值', () => {
    for (const role of Object.values(ChampionRole)) {
      const dto = Object.assign(new RegisterChampionDto(), {
        name: `User-${role}`,
        role,
      });
      assert.equal(dto.role, role);
    }
  });

  it('joinedAt 未提供时为 undefined', () => {
    const dto = Object.assign(new RegisterChampionDto(), {
      name: 'Carol',
      role: ChampionRole.Observer,
    });
    assert.equal(dto.joinedAt, undefined);
  });
});

describe('RecordContributionDto', () => {
  it('必填字段：championId + kind + refId', () => {
    const dto = Object.assign(new RecordContributionDto(), {
      championId: 'champ-001',
      kind: ContributionKind.Commit,
      refId: 'abc123',
    });
    assert.equal(dto.championId, 'champ-001');
    assert.equal(dto.kind, ContributionKind.Commit);
    assert.equal(dto.refId, 'abc123');
  });

  it('可选字段 description', () => {
    const dto = Object.assign(new RecordContributionDto(), {
      championId: 'champ-001',
      kind: ContributionKind.Rfc,
      refId: 'DR-005',
      description: '决策记录 #5',
    });
    assert.equal(dto.description, '决策记录 #5');
  });

  it('可选字段 occurredAt', () => {
    const dto = Object.assign(new RecordContributionDto(), {
      championId: 'champ-001',
      kind: ContributionKind.Retro,
      refId: 'phase-18',
      occurredAt: '2026-06-25T10:00:00.000Z',
    });
    assert.equal(dto.occurredAt, '2026-06-25T10:00:00.000Z');
  });

  it('所有贡献类型均可赋值', () => {
    for (const kind of Object.values(ContributionKind)) {
      const dto = Object.assign(new RecordContributionDto(), {
        championId: 'champ-001',
        kind,
        refId: 'ref-' + kind,
      });
      assert.equal(dto.kind, kind);
    }
  });

  it('description 和 occurredAt 均为可选', () => {
    const dto = Object.assign(new RecordContributionDto(), {
      championId: 'champ-001',
      kind: ContributionKind.Review,
      refId: 'pr-42',
    });
    assert.equal(dto.description, undefined);
    assert.equal(dto.occurredAt, undefined);
  });
});

describe('RankingQueryDto', () => {
  it('role 可选 — 未提供时为 undefined', () => {
    const dto = new RankingQueryDto();
    assert.equal(dto.role, undefined);
  });

  it('role 可指定过滤角色', () => {
    const dto = Object.assign(new RankingQueryDto(), {
      role: ChampionRole.Approver,
    });
    assert.equal(dto.role, ChampionRole.Approver);
  });
});

describe('TimelineQueryDto', () => {
  it('所有字段可选 — 未提供时为 undefined', () => {
    const dto = new TimelineQueryDto();
    assert.equal(dto.championId, undefined);
    assert.equal(dto.sinceDate, undefined);
  });

  it('championId 可指定过滤', () => {
    const dto = Object.assign(new TimelineQueryDto(), {
      championId: 'champ-001',
    });
    assert.equal(dto.championId, 'champ-001');
  });

  it('sinceDate 可指定时间过滤', () => {
    const dto = Object.assign(new TimelineQueryDto(), {
      sinceDate: '2026-06-01T00:00:00.000Z',
    });
    assert.equal(dto.sinceDate, '2026-06-01T00:00:00.000Z');
  });
});
