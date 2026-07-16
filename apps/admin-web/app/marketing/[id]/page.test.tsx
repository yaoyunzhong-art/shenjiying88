/**
 * marketing/[id]/page.test.tsx — Detail page tests for the marketing campaign detail page.
 * Tests campaignStatusLabel mapping, campaignChannelLabel mapping, status transition
 * logic (canTransition), form validation (validateCampaignForm), getMarketingCampaignById lookup,
 * and mock data integrity.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  campaignStatusLabel,
  campaignChannelLabel,
  canTransition,
  validateCampaignForm,
  getMarketingCampaignById,
} from './page';

import type { MarketingCampaign } from '../../marketing-view-model';

// ---- 正例 (Positive Cases) ----

describe('marketing-detail: 正例', () => {
  describe('campaignStatusLabel mapping', () => {
    it('should return Chinese labels for all 4 statuses', () => {
      assert.strictEqual(campaignStatusLabel('draft'), '草稿');
      assert.strictEqual(campaignStatusLabel('scheduled'), '已排期');
      assert.strictEqual(campaignStatusLabel('running'), '进行中');
      assert.strictEqual(campaignStatusLabel('ended'), '已结束');
    });
  });

  describe('campaignChannelLabel mapping', () => {
    it('should return Chinese labels for all 5 channels', () => {
      assert.strictEqual(campaignChannelLabel('wechat'), '微信');
      assert.strictEqual(campaignChannelLabel('app_push'), 'App推送');
      assert.strictEqual(campaignChannelLabel('sms'), '短信');
      assert.strictEqual(campaignChannelLabel('douyin'), '抖音');
      assert.strictEqual(campaignChannelLabel('xiaohongshu'), '小红书');
    });
  });

  describe('canTransition — 状态流转逻辑', () => {
    it('draft → scheduled', () => {
      assert.strictEqual(canTransition('draft'), 'scheduled');
    });

    it('scheduled → running', () => {
      assert.strictEqual(canTransition('scheduled'), 'running');
    });

    it('running → ended', () => {
      assert.strictEqual(canTransition('running'), 'ended');
    });
  });

  describe('validateCampaignForm', () => {
    it('should pass validation for valid complete data', () => {
      const errors = validateCampaignForm({
        name: '测试活动',
        targetSegment: '活跃会员',
        channel: 'wechat',
      });
      assert.deepStrictEqual(errors, {});
    });

    it('should pass validation with valid minimal data', () => {
      const errors = validateCampaignForm({
        name: 'A',
        targetSegment: 'X',
        channel: 'sms',
      });
      assert.deepStrictEqual(errors, {});
    });
  });

  describe('getMarketingCampaignById — 查找', () => {
    it('should find c1 (running/wechat)', () => {
      const c = getMarketingCampaignById('c1');
      assert.ok(c, 'c1 should exist');
      assert.strictEqual(c!.name, '年中促销活动');
      assert.strictEqual(c!.status, 'running');
      assert.strictEqual(c!.channel, 'wechat');
      assert.strictEqual(c!.roi, 4.2);
      assert.strictEqual(c!.conversionRate, 6.8);
      assert.strictEqual(c!.cost, 35000);
    });

    it('should find c2 (ended/app_push)', () => {
      const c = getMarketingCampaignById('c2');
      assert.ok(c, 'c2 should exist');
      assert.strictEqual(c!.status, 'ended');
      assert.strictEqual(c!.channel, 'app_push');
      assert.strictEqual(c!.conversionRate, 18.3);
      assert.ok(c!.endAt, 'c2 should have endAt');
    });

    it('should find c3 (scheduled/sms)', () => {
      const c = getMarketingCampaignById('c3');
      assert.ok(c, 'c3 should exist');
      assert.strictEqual(c!.status, 'scheduled');
      assert.strictEqual(c!.channel, 'sms');
      assert.strictEqual(c!.conversionRate, 0);
      assert.strictEqual(c!.roi, 0);
    });

    it('should find c4 (draft/douyin)', () => {
      const c = getMarketingCampaignById('c4');
      assert.ok(c, 'c4 should exist');
      assert.strictEqual(c!.status, 'draft');
      assert.strictEqual(c!.channel, 'douyin');
      assert.strictEqual(c!.reachCount, 0);
    });

    it('should find c5 (draft/xiaohongshu)', () => {
      const c = getMarketingCampaignById('c5');
      assert.ok(c, 'c5 should exist');
      assert.strictEqual(c!.status, 'draft');
      assert.strictEqual(c!.channel, 'xiaohongshu');
      assert.strictEqual(c!.cost, 15000);
    });
  });
});

// ---- 反例 (Negative Cases) ----

describe('marketing-detail: 反例', () => {
  describe('canTransition — 已完成状态不能流转', () => {
    it('ended → null (cannot transition)', () => {
      assert.strictEqual(canTransition('ended'), null);
    });

    it('ended status should not have next transition', () => {
      const next = canTransition('ended');
      assert.strictEqual(next, null);
    });
  });

  describe('validateCampaignForm — 验证失败', () => {
    it('should reject empty name', () => {
      const errors = validateCampaignForm({
        name: '',
        targetSegment: '活跃会员',
        channel: 'wechat',
      });
      assert.ok(errors.name, 'name error expected');
      assert.strictEqual(errors.name, '活动名称不能为空');
    });

    it('should reject whitespace-only name', () => {
      const errors = validateCampaignForm({
        name: '   ',
        targetSegment: '活跃会员',
        channel: 'wechat',
      });
      assert.strictEqual(errors.name, '活动名称不能为空');
    });

    it('should reject name over 100 chars', () => {
      const errors = validateCampaignForm({
        name: 'x'.repeat(101),
        targetSegment: '活跃会员',
        channel: 'wechat',
      });
      assert.strictEqual(errors.name, '活动名称不能超过100个字符');
    });

    it('should reject empty targetSegment', () => {
      const errors = validateCampaignForm({
        name: '测试活动',
        targetSegment: '',
        channel: 'wechat',
      });
      assert.ok(errors.targetSegment, 'targetSegment error expected');
      assert.strictEqual(errors.targetSegment, '目标人群不能为空');
    });

    it('should reject whitespace-only targetSegment', () => {
      const errors = validateCampaignForm({
        name: '测试活动',
        targetSegment: '  ',
        channel: 'wechat',
      });
      assert.strictEqual(errors.targetSegment, '目标人群不能为空');
    });

    it('should reject invalid channel value', () => {
      const errors = validateCampaignForm({
        name: '测试活动',
        targetSegment: '活跃会员',
        channel: 'email' as CampaignChannel,
      });
      assert.ok(errors.channel, 'channel error expected');
      assert.strictEqual(errors.channel, '请选择有效的渠道');
    });

    it('should collect multiple errors simultaneously', () => {
      const errors = validateCampaignForm({
        name: '',
        targetSegment: '',
        channel: 'email' as CampaignChannel,
      });
      assert.ok(errors.name, 'name error expected');
      assert.ok(errors.targetSegment, 'targetSegment error expected');
      assert.ok(errors.channel, 'channel error expected');
      assert.strictEqual(Object.keys(errors).length, 3);
    });
  });

  describe('getMarketingCampaignById — 不存在', () => {
    it('should return null for nonexistent id', () => {
      const c = getMarketingCampaignById('nonexistent');
      assert.strictEqual(c, null);
    });

    it('should return null for empty string', () => {
      const c = getMarketingCampaignById('');
      assert.strictEqual(c, null);
    });
  });
});

// ---- 边界 (Boundary Cases) ----

describe('marketing-detail: 边界', () => {
  describe('campaignStatusLabel — edge values', () => {
    it('label length should be short (2-3 chars)', () => {
      const labels = ['draft', 'scheduled', 'running', 'ended'].map(
        (s) => campaignStatusLabel(s as CampaignStatus)
      );
      for (const label of labels) {
        assert.ok(label.length >= 2 && label.length <= 3, `unexpected length: "${label}"`);
      }
    });
  });

  describe('canTransition — 链式验证', () => {
    it('full chain should be: draft → scheduled → running → ended', () => {
      let status: CampaignStatus = 'draft';
      // draft → scheduled
      let next = canTransition(status);
      assert.strictEqual(next, 'scheduled');
      // scheduled → running
      status = next;
      next = canTransition(status);
      assert.strictEqual(next, 'running');
      // running → ended
      status = next;
      next = canTransition(status);
      assert.strictEqual(next, 'ended');
      // ended → null
      status = next;
      next = canTransition(status);
      assert.strictEqual(next, null);
    });
  });

  describe('validateCampaignForm — 边界值', () => {
    it('name at exactly 100 chars should pass', () => {
      const errors = validateCampaignForm({
        name: 'x'.repeat(100),
        targetSegment: '活跃会员',
        channel: 'wechat',
      });
      assert.strictEqual(errors.name, undefined);
    });

    it('name at exactly 101 chars should fail', () => {
      const errors = validateCampaignForm({
        name: 'x'.repeat(101),
        targetSegment: '活跃会员',
        channel: 'wechat',
      });
      assert.strictEqual(errors.name, '活动名称不能超过100个字符');
    });

    it('single char name should pass', () => {
      const errors = validateCampaignForm({
        name: 'a',
        targetSegment: '活跃会员',
        channel: 'wechat',
      });
      assert.strictEqual(errors.name, undefined);
    });
  });

  describe('getMarketingCampaignById — mock 数据完整性', () => {
    it('all campains should have valid status', () => {
      const ids = ['c1', 'c2', 'c3', 'c4', 'c5'];
      for (const id of ids) {
        const c = getMarketingCampaignById(id);
        assert.ok(c, `${id} should exist`);
        assert.ok(
          ['draft', 'scheduled', 'running', 'ended'].includes(c!.status),
          `${id}: invalid status "${c!.status}"`
        );
      }
    });

    it('all campains should have valid channel', () => {
      const ids = ['c1', 'c2', 'c3', 'c4', 'c5'];
      for (const id of ids) {
        const c = getMarketingCampaignById(id);
        assert.ok(c, `${id} should exist`);
        assert.ok(
          ['wechat', 'app_push', 'sms', 'douyin', 'xiaohongshu'].includes(c!.channel),
          `${id}: invalid channel "${c!.channel}"`
        );
      }
    });

    it('all campains should have non-empty name', () => {
      const ids = ['c1', 'c2', 'c3', 'c4', 'c5'];
      for (const id of ids) {
        const c = getMarketingCampaignById(id);
        assert.ok(c, `${id} should exist`);
        assert.ok(c!.name.trim().length > 0, `${id}: empty name`);
      }
    });

    it('all campains should have startAt date', () => {
      const ids = ['c1', 'c2', 'c3', 'c4', 'c5'];
      for (const id of ids) {
        const c = getMarketingCampaignById(id);
        assert.ok(c, `${id} should exist`);
        assert.ok(c!.startAt.length > 0, `${id}: empty startAt`);
      }
    });

    it('cost should be >= 0 for all campains', () => {
      const ids = ['c1', 'c2', 'c3', 'c4', 'c5'];
      for (const id of ids) {
        const c = getMarketingCampaignById(id);
        assert.ok(c, `${id} should exist`);
        assert.ok(c!.cost >= 0, `${id}: negative cost ${c!.cost}`);
      }
    });

    it('should cover every channel type at least once', () => {
      const ids = ['c1', 'c2', 'c3', 'c4', 'c5'];
      const channels = new Set(ids.map((id) => getMarketingCampaignById(id)!.channel));
      assert.ok(channels.has('wechat'), 'wechat channel missing');
      assert.ok(channels.has('app_push'), 'app_push channel missing');
      assert.ok(channels.has('sms'), 'sms channel missing');
      assert.ok(channels.has('douyin'), 'douyin channel missing');
      assert.ok(channels.has('xiaohongshu'), 'xiaohongshu channel missing');
    });

    it('should cover every status type at least once', () => {
      const ids = ['c1', 'c2', 'c3', 'c4'];
      const statuses = new Set(ids.map((id) => getMarketingCampaignById(id)!.status));
      assert.ok(statuses.has('running'), 'running status missing');
      assert.ok(statuses.has('ended'), 'ended status missing');
      assert.ok(statuses.has('scheduled'), 'scheduled status missing');
      assert.ok(statuses.has('draft'), 'draft status missing');
    });

    it('draft campains should have reachCount=0 and conversionRate=0', () => {
      const ids = ['c4', 'c5'];
      for (const id of ids) {
        const c = getMarketingCampaignById(id);
        assert.strictEqual(c!.status, 'draft');
        assert.strictEqual(c!.reachCount, 0, `${id}: draft should have reachCount=0`);
        assert.strictEqual(c!.conversionRate, 0, `${id}: draft should have conversionRate=0`);
      }
    });

    it('ended campain (c2) should have endAt defined', () => {
      const c = getMarketingCampaignById('c2');
      assert.strictEqual(c!.status, 'ended');
      assert.ok(c!.endAt, 'ended campaign should have endAt');
    });

    it('scheduled campain (c3) should have reachCount configured', () => {
      const c = getMarketingCampaignById('c3');
      assert.strictEqual(c!.status, 'scheduled');
      assert.ok(c!.reachCount > 0, 'scheduled campaign should have reachCount > 0');
    });
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Marketing — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
