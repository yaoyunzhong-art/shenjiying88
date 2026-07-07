import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [champion] [A] entity.test.ts 补全
 *
 * Champion 实体定义测试
 */

import assert from 'node:assert/strict';
import {
  ChampionRole,
  ContributionKind,
  CONTRIBUTION_WEIGHTS,
} from './champion.entity';

describe('ChampionEntity', () => {
  it('ChampionRole 枚举定义完整', () => {
    assert.equal(ChampionRole.Approver, 'APPROVER');
    assert.equal(ChampionRole.Champion, 'CHAMPION');
    assert.equal(ChampionRole.Observer, 'OBSERVER');
  });

  it('ContributionKind 枚举定义完整', () => {
    assert.equal(ContributionKind.Commit, 'COMMIT');
    assert.equal(ContributionKind.Review, 'REVIEW');
    assert.equal(ContributionKind.Rfc, 'RFC');
    assert.equal(ContributionKind.PulseReview, 'PULSE_REVIEW');
    assert.equal(ContributionKind.Retro, 'RETRO');
  });

  it('CONTRIBUTION_WEIGHTS 权值符合预期', () => {
    assert.equal(CONTRIBUTION_WEIGHTS[ContributionKind.Commit], 2);
    assert.equal(CONTRIBUTION_WEIGHTS[ContributionKind.Review], 3);
    assert.equal(CONTRIBUTION_WEIGHTS[ContributionKind.Rfc], 8);
    assert.equal(CONTRIBUTION_WEIGHTS[ContributionKind.PulseReview], 4);
    assert.equal(CONTRIBUTION_WEIGHTS[ContributionKind.Retro], 6);
  });

  it('所有 ContributionKind 都有权值映射', () => {
    const kinds = Object.values(ContributionKind);
    for (const kind of kinds) {
      assert.ok(
        CONTRIBUTION_WEIGHTS[kind] !== undefined,
        `${kind} 缺少权值定义`,
      );
    }
  });

  it('所有权值均为正整数', () => {
    const weights = Object.values(CONTRIBUTION_WEIGHTS);
    for (const w of weights) {
      assert.ok(Number.isInteger(w) && w > 0);
    }
  });
});
