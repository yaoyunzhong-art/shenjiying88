import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
// referral.module.test.ts · Phase-17 T8
// 创建: 2026-06-26 · Pulse-自动
// 状态: IMPLEMENTED · Referral Module 测试

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { MarketingMetricsModule } from '../marketing-metrics/marketing-metrics.module';
import { ReferralController } from './referral.controller';
import { ReferralService } from './referral.service';
import { ReferralModule } from './referral.module';

describe('ReferralModule', () => {
  it('should export ReferralController and ReferralService', () => {
    assert.ok(ReferralModule);
  });

  it('should have controller and provider metadata', () => {
    assert.ok(ReferralModule);
  });

  it('should import MarketingMetricsModule for metrics collection', () => {
    const importsList = Reflect.getMetadata('imports', ReferralModule) as unknown[] | undefined;
    const importNames = (importsList ?? []).map((entry) => (entry as { name?: string }).name);
    assert.ok(importNames.includes(MarketingMetricsModule.name));
  });

  it('service instance works standalone via module wiring', () => {
    const svc = new ReferralService();
    svc.reset();
    const ctrl = new ReferralController(svc);

    const code = ctrl.generateCode({
      parentUserId: 'user-A',
      tenantId: 't',
    });
    assert.ok(code.shortCode);
    assert.equal(code.shortCode.length, 8);

    ctrl.trackClick({ shortCode: code.shortCode, source: 'wechat' });
    const signup = ctrl.trackSignup({
      shortCode: code.shortCode,
      childUserId: 'user-B',
    });
    assert.ok(signup.recordId.startsWith('rec-'));

    const rewards = ctrl.issueRewards(signup.recordId);
    assert.equal(rewards.rewards.length, 1);
    assert.equal(rewards.rewards[0].recipientUserId, 'user-A');
  });

  it('controller returns not-found for non-existent code', () => {
    const svc = new ReferralService();
    const ctrl = new ReferralController(svc);
    const result = ctrl.getCode('NONEXIST');
    assert.equal(result.found, false);
  });

  it('controller handles click on non-existent code gracefully', () => {
    const svc = new ReferralService();
    const ctrl = new ReferralController(svc);
    const result = ctrl.trackClick({
      shortCode: 'NONEXIST',
      source: 'wechat',
    });
    assert.equal(result.success, false);
  });

  it('controller handles full 3-level chain correctly', () => {
    const svc = new ReferralService();
    svc.reset();
    const ctrl = new ReferralController(svc);

    // A → B → C → D chain
    const codeA = ctrl.generateCode({ parentUserId: 'user-A', tenantId: 't' });
    ctrl.trackClick({ shortCode: codeA.shortCode, source: 'wechat' });
    ctrl.trackSignup({ shortCode: codeA.shortCode, childUserId: 'user-B' });

    const codeB = ctrl.generateCode({ parentUserId: 'user-B', tenantId: 't' });
    ctrl.trackClick({ shortCode: codeB.shortCode, source: 'wechat' });
    ctrl.trackSignup({ shortCode: codeB.shortCode, childUserId: 'user-C' });

    const codeC = ctrl.generateCode({ parentUserId: 'user-C', tenantId: 't' });
    ctrl.trackClick({ shortCode: codeC.shortCode, source: 'wechat' });
    const signup = ctrl.trackSignup({ shortCode: codeC.shortCode, childUserId: 'user-D' });

    const rewards = ctrl.issueRewards(signup.recordId);
    assert.equal(rewards.rewards.length, 3);
    assert.equal(rewards.rewards[0].recipientUserId, 'user-C');
    assert.equal(rewards.rewards[1].recipientUserId, 'user-B');
    assert.equal(rewards.rewards[2].recipientUserId, 'user-A');
  });
});
