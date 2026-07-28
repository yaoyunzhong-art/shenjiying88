/**
 * markets/[id]/page.test.ts — Page-level tests for markets detail page.
 * Tests detail lookup, form validation, status/region label display, not-found handling.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: markets-data.ts, markets/[id]/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_MARKETS,
  MARKET_STATUS_MAP,
  MARKET_REGION_MAP,
  MARKET_STATUSES,
  MARKET_REGIONS,
  getMarketById,
  getMarketStatusLabel,
  getMarketRegionLabel,
  getMarketStatusVariant,
  getMarketRegionVariant,
  computeMarketStats,
  computeMarketRegionDistribution,
  MARKET_DETAIL_LABELS,
  type MarketStatus,
  type MarketRegion,
} from '../../markets-data';

// ---- Form validation (mirrors validateForm in page.tsx) ----

interface EditFormData {
  name: string;
  description: string;
  locale: string;
  currency: string;
  timezone: string;
  contactName: string;
  contactEmail: string;
}

interface EditFormErrors {
  name?: string;
  description?: string;
  locale?: string;
  currency?: string;
  timezone?: string;
  contactName?: string;
  contactEmail?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '市场名称不能为空';
  if (!data.description.trim()) errors.description = '描述不能为空';
  if (!data.locale.trim()) errors.locale = '语言不能为空';
  if (!data.currency.trim()) errors.currency = '货币不能为空';
  if (!data.timezone.trim()) errors.timezone = '时区不能为空';
  if (!data.contactName.trim()) errors.contactName = '联系人不能为空';
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    errors.contactEmail = '邮箱格式不正确';
  }
  return errors;
}

function getEmptyEditForm(): EditFormData {
  return { name: '', description: '', locale: '', currency: '', timezone: '', contactName: '', contactEmail: '' };
}

// ---- 正例 ----

describe('markets/[id]: 正例 (positive cases)', () => {
  describe('detail lookup', () => {
    it('should find market by existing id', () => {
      const market = getMarketById('m1');
      assert.ok(market, 'should find m1');
      assert.strictEqual(market!.code, 'cn-mainland');
      assert.strictEqual(market!.name, '中国大陆');
    });

    it('should find market with another valid id', () => {
      const market = getMarketById('m3');
      assert.ok(market, 'should find m3');
      assert.strictEqual(market!.code, 'us-default');
      assert.strictEqual(market!.name, '美国');
    });

    it('should find all detail entries in MOCK_MARKET_DETAILS', () => {
      const detailKeys = Object.keys(MOCK_MARKETS.reduce<Record<string, boolean>>((acc, m) => {
        const detail = getMarketById(m.id);
        if (detail) acc[m.id] = true;
        return acc;
      }, {}));
      // At least the markets with details should be findable
      assert.ok(detailKeys.length >= 5, `expected >= 5 detail entries, got ${detailKeys.length}`);
    });

    it('market detail should have all extended fields', () => {
      const market = getMarketById('m1');
      assert.ok(market, 'should have m1 detail');
      assert.ok(typeof market!.description === 'string' && market!.description.length > 0, 'description exists');
      assert.ok(Array.isArray(market!.regulatoryBodies), 'regulatoryBodies array exists');
      assert.ok(Array.isArray(market!.paymentMethods), 'paymentMethods array exists');
      assert.ok(market!.paymentMethods.length >= 3, 'at least 3 payment methods');
    });
  });

  describe('status labels', () => {
    it('should return correct Chinese status labels via data-layer', () => {
      assert.strictEqual(getMarketStatusLabel('active'), '运营中');
      assert.strictEqual(getMarketStatusLabel('inactive'), '已停用');
      assert.strictEqual(getMarketStatusLabel('pending'), '待激活');
    });

    it('MARKET_STATUS_MAP should have labels and variants', () => {
      for (const s of MARKET_STATUSES) {
        assert.ok(MARKET_STATUS_MAP[s]?.label, `status ${s} should have label`);
        assert.ok(MARKET_STATUS_MAP[s]?.variant, `status ${s} should have variant`);
      }
    });
  });

  describe('region labels', () => {
    it('should return correct Chinese region labels via data-layer', () => {
      assert.strictEqual(getMarketRegionLabel('asia-pacific'), '亚太');
      assert.strictEqual(getMarketRegionLabel('north-america'), '北美');
      assert.strictEqual(getMarketRegionLabel('europe'), '欧洲');
      assert.strictEqual(getMarketRegionLabel('middle-east'), '中东');
      assert.strictEqual(getMarketRegionLabel('latin-america'), '拉美');
    });

    it('MARKET_REGION_MAP should have correct variant assignments', () => {
      assert.strictEqual(MARKET_REGION_MAP['asia-pacific']?.variant, 'success');
      assert.strictEqual(MARKET_REGION_MAP['middle-east']?.variant, 'danger');
    });
  });

  describe('region variant helpers', () => {
    it('getMarketRegionVariant should return correct variants', () => {
      assert.strictEqual(getMarketRegionVariant('asia-pacific'), 'success');
      assert.strictEqual(getMarketRegionVariant('europe'), 'warning');
      assert.strictEqual(getMarketRegionVariant('middle-east'), 'danger');
    });

    it('getMarketStatusVariant should return correct variants', () => {
      assert.strictEqual(getMarketStatusVariant('active'), 'success');
      assert.strictEqual(getMarketStatusVariant('inactive'), 'neutral');
      assert.strictEqual(getMarketStatusVariant('pending'), 'warning');
    });
  });

  describe('market detail fields', () => {
    it('all markets should have non-empty names and codes', () => {
      for (const m of MOCK_MARKETS) {
        assert.ok(m.code.length > 0, `empty code for ${m.id}`);
        assert.ok(m.name.length > 0, `empty name for ${m.id}`);
        assert.ok(MARKET_REGIONS.includes(m.region), `invalid region for ${m.id}: ${m.region}`);
      }
    });

    it('active markets should have storeCount > 0', () => {
      for (const m of MOCK_MARKETS) {
        if (m.status === 'active') {
          assert.ok(m.storeCount > 0, `active ${m.id} should have storeCount > 0, got ${m.storeCount}`);
        }
      }
    });
  });

  describe('form validation', () => {
    it('should pass for valid form data', () => {
      const errors = validateForm({
        name: '中国大陆',
        description: 'M5 中国核心市场',
        locale: 'zh-CN',
        currency: 'CNY',
        timezone: 'Asia/Shanghai',
        contactName: '张大陆',
        contactEmail: 'zhangdl@m5.cn.com',
      });
      assert.strictEqual(Object.keys(errors).length, 0);
    });

    it('should accept empty contactEmail as valid (optional field)', () => {
      const errors = validateForm({
        name: '测试市场',
        description: '测试描述',
        locale: 'en-US',
        currency: 'USD',
        timezone: 'America/New_York',
        contactName: '测试',
        contactEmail: '',
      });
      assert.strictEqual(Object.keys(errors).length, 0);
    });
  });

  describe('computeMarketStats', () => {
    it('should compute correct aggregate counts', () => {
      const stats = computeMarketStats(MOCK_MARKETS);
      assert.strictEqual(stats.total, MOCK_MARKETS.length);
      assert.strictEqual(stats.active, MOCK_MARKETS.filter((m) => m.status === 'active').length);
      assert.strictEqual(stats.pending, MOCK_MARKETS.filter((m) => m.status === 'pending').length);
      assert.ok(stats.regionCount >= 4, `expected >= 4 regions, got ${stats.regionCount}`);
    });

    it('computeMarketStats for empty array should return zeros', () => {
      const stats = computeMarketStats([]);
      assert.deepStrictEqual(stats, { total: 0, active: 0, pending: 0, regionCount: 0, totalResources: 0 });
    });
  });

  describe('computeMarketRegionDistribution', () => {
    it('should return distribution across regions', () => {
      const dist = computeMarketRegionDistribution(MOCK_MARKETS);
      assert.ok((dist['asia-pacific'] ?? 0) >= 7, 'asia-pacific should have most markets');
      assert.ok((dist['north-america'] ?? 0) >= 1, 'north-america should have markets');
    });
  });

  describe('MARKET_DETAIL_LABELS', () => {
    it('should have Chinese labels for key fields', () => {
      assert.strictEqual(MARKET_DETAIL_LABELS.code, '市场编码');
      assert.strictEqual(MARKET_DETAIL_LABELS.name, '市场名称');
      assert.strictEqual(MARKET_DETAIL_LABELS.region, '区域');
      assert.strictEqual(MARKET_DETAIL_LABELS.status, '运营状态');
      assert.strictEqual(MARKET_DETAIL_LABELS.editTitle, '编辑市场信息');
      assert.strictEqual(MARKET_DETAIL_LABELS.saveButton, '保存修改');
    });

    it('notFound should generate string from id', () => {
      const msg = MARKET_DETAIL_LABELS.notFound('unknown-123');
      assert.ok(msg.includes('unknown-123'), 'notFound should include the id');
    });
  });
});

// ---- 反例 ----

describe('markets/[id]: 反例 (negative cases)', () => {
  it('should return undefined for nonexistent id', () => {
    const market = getMarketById('nonexistent');
    assert.strictEqual(market, undefined);
  });

  it('should return undefined for empty string id', () => {
    const market = getMarketById('');
    assert.strictEqual(market, undefined);
  });

  describe('form validation', () => {
    it('should reject empty name', () => {
      const errors = validateForm({ ...getEmptyEditForm(), description: 'desc', locale: 'en', currency: 'USD', timezone: 'UTC', contactName: 'test' });
      assert.ok(errors.name, 'name error expected');
      assert.ok(errors.name!.includes('不能为空'), 'name must mention not-empty');
    });

    it('should reject empty description', () => {
      const errors = validateForm({ ...getEmptyEditForm(), name: 'test', locale: 'en', currency: 'USD', timezone: 'UTC', contactName: 'test' });
      assert.ok(errors.description, 'description error expected');
    });

    it('should reject empty contactName', () => {
      const errors = validateForm({ ...getEmptyEditForm(), name: 'test', description: 'desc', locale: 'en', currency: 'USD', timezone: 'UTC' });
      assert.ok(errors.contactName, 'contactName error expected');
    });

    it('should reject invalid email format', () => {
      const errors = validateForm({
        name: '市场', description: 'desc', locale: 'zh-CN', currency: 'CNY', timezone: 'Asia/Shanghai',
        contactName: '测试', contactEmail: 'not-an-email',
      });
      assert.ok(errors.contactEmail, 'email error expected');
    });

    it('should reject email with missing TLD', () => {
      const errors = validateForm({
        name: '市场', description: 'desc', locale: 'zh-CN', currency: 'CNY', timezone: 'Asia/Shanghai',
        contactName: '测试', contactEmail: 'user@domain',
      });
      assert.ok(errors.contactEmail, 'email error expected for user@domain');
    });
  });
});

// ---- 边界 ----

describe('markets/[id]: 边界 (boundary cases)', () => {
  it('validateForm should return multiple errors when all required fields empty', () => {
    const errors = validateForm(getEmptyEditForm());
    const keys = Object.keys(errors);
    assert.ok(keys.length >= 6, `expected >= 6 errors for completely empty form, got ${keys.length}`);
  });

  it('every defined MARKET_STATUSES value should have at least one market', () => {
    for (const s of MARKET_STATUSES) {
      const count = MOCK_MARKETS.filter((m) => m.status === s).length;
      assert.ok(count >= 1, `status ${s} has 0 markets`);
    }
  });

  it('pending markets should have lower store counts than active markets', () => {
    const pendingMaxStores = Math.max(...MOCK_MARKETS.filter((m) => m.status === 'pending').map((m) => m.storeCount));
    const activeMinStores = Math.min(...MOCK_MARKETS.filter((m) => m.status === 'active').map((m) => m.storeCount));
    assert.ok(pendingMaxStores <= activeMinStores,
      `pending max stores ${pendingMaxStores} should be <= active min stores ${activeMinStores}`);
  });

  it('pending markets with storeCount=0 should have lastDeployed "-"', () => {
    const zeroStorePending = MOCK_MARKETS.filter((m) => m.status === 'pending' && m.storeCount === 0);
    for (const m of zeroStorePending) {
      assert.strictEqual(m.lastDeployed, '-', `${m.id} with 0 stores should have lastDeployed "-"`);
    }
  });

  it('all markets across 5 regions should be represented', () => {
    const regions = new Set(MOCK_MARKETS.map((m) => m.region));
    for (const r of MARKET_REGIONS) {
      assert.ok(regions.has(r), `region ${r} should have at least one market`);
    }
  });

  it('currency should be a 3-letter uppercase code for all markets', () => {
    for (const m of MOCK_MARKETS) {
      assert.ok(/^[A-Z]{3}$/.test(m.currency), `${m.id}: currency "${m.currency}" not 3-letter code`);
    }
  });

  it('locale should be in xx-XX format for all markets', () => {
    for (const m of MOCK_MARKETS) {
      assert.ok(/^[a-z]{2}-[A-Z]{2}$/.test(m.locale), `${m.id}: locale "${m.locale}" not xx-XX format`);
    }
  });

  it('timezone should be valid IANA format for all markets', () => {
    for (const m of MOCK_MARKETS) {
      assert.ok(m.timezone.includes('/'), `${m.id}: timezone "${m.timezone}" should be IANA format`);
    }
  });
});
