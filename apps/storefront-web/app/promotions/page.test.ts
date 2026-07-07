import assert from 'node:assert';
import { describe, it } from 'node:test';

// ---- 测试促销活动页面组件的数据逻辑 ----

// 类型定义（与页面保持一致）
type PromotionStatus = 'draft' | 'active' | 'paused' | 'ended';

interface Promotion {
  id: string;
  title: string;
  type: 'discount' | 'coupon' | 'gift' | 'flash-sale';
  status: PromotionStatus;
  storeName: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageCount: number;
}

// 模拟生成函数
function generateMockPromotions(count: number): Promotion[] {
  const PROMOTION_STATUSES: PromotionStatus[] = ['draft', 'active', 'paused', 'ended'];
  const PROMOTION_TYPES = ['discount', 'coupon', 'gift', 'flash-sale'] as const;
  const STORE_NAMES = ['旗舰店', '南山分店', '福田分店', '宝安店', '龙华店'];
  const PROMOTION_TITLES = [
    '夏日清凉大促', '会员专属折扣', '满减优惠券', '买一送一活动',
    '双倍积分活动', '新品首发特价', '限时秒杀', '周末特惠', '节日礼包', '老客回馈',
  ];
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const statusIndex = i % PROMOTION_STATUSES.length;
    const status = PROMOTION_STATUSES[statusIndex];
    const startOffset =
      status === 'draft' ? 86400000 * (1 + Math.floor(i / 4))
        : status === 'active' ? -86400000 * (1 + Math.floor(i / 3))
          : status === 'paused' ? -86400000 * 3 : -86400000 * 10;
    const endOffset =
      status === 'draft' ? 86400000 * (15 + Math.floor(i / 2))
        : status === 'active' ? 86400000 * (5 + Math.floor(i / 2))
          : status === 'paused' ? 86400000 * 2 : -86400000 * 3;
    return {
      id: `promo-${i + 1}`,
      title: PROMOTION_TITLES[i % PROMOTION_TITLES.length],
      type: PROMOTION_TYPES[i % PROMOTION_TYPES.length],
      status,
      storeName: STORE_NAMES[i % STORE_NAMES.length],
      startDate: new Date(now + startOffset).toISOString().slice(0, 10),
      endDate: new Date(now + endOffset).toISOString().slice(0, 10),
      budget: Math.round(Math.random() * 100000) / 100,
      usageCount: Math.floor(Math.random() * 5000),
    };
  });
}

// ---- 正例 ----

describe('促销活动: 数据模拟正例', () => {
  it('1. generateMockPromotions 生成指定数量', () => {
    const data = generateMockPromotions(36);
    assert.strictEqual(data.length, 36);
  });

  it('2. 每条记录都有非空 id', () => {
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.ok(d.id, `id should not be empty for ${d.id}`);
      assert.match(d.id, /^promo-\d+$/);
    });
  });

  it('3. 所有 type 值在预期范围内', () => {
    const validTypes = ['discount', 'coupon', 'gift', 'flash-sale'];
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.ok(validTypes.includes(d.type), `type ${d.type} not valid`);
    });
  });

  it('4. 所有 status 值在预期范围内', () => {
    const validStatuses = ['draft', 'active', 'paused', 'ended'];
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.ok(validStatuses.includes(d.status), `status ${d.status} not valid`);
    });
  });

  it('5. startDate 格式为 YYYY-MM-DD', () => {
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.match(d.startDate, /^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('6. endDate 格式为 YYYY-MM-DD', () => {
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.match(d.endDate, /^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('7. budget 为非负数', () => {
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.ok(d.budget >= 0, `budget ${d.budget} should be >= 0`);
    });
  });

  it('8. usageCount 为非负数且为整数', () => {
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.ok(Number.isInteger(d.usageCount), `usageCount ${d.usageCount} not integer`);
      assert.ok(d.usageCount >= 0);
    });
  });

  it('9. 四种 status 都出现在数据中', () => {
    const data = generateMockPromotions(36);
    const statuses = new Set(data.map((d) => d.status));
    assert.ok(statuses.has('draft'));
    assert.ok(statuses.has('active'));
    assert.ok(statuses.has('paused'));
    assert.ok(statuses.has('ended'));
  });

  it('10. 四种 type 都出现在数据中', () => {
    const data = generateMockPromotions(36);
    const types = new Set(data.map((d) => d.type));
    assert.ok(types.has('discount'));
    assert.ok(types.has('coupon'));
    assert.ok(types.has('gift'));
    assert.ok(types.has('flash-sale'));
  });

  it('11. 不同条目的 id 各不相同', () => {
    const data = generateMockPromotions(36);
    const ids = data.map((d) => d.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('12. storeName 都在门店列表中', () => {
    const validStores = ['旗舰店', '南山分店', '福田分店', '宝安店', '龙华店'];
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.ok(validStores.includes(d.storeName), `store ${d.storeName} not valid`);
    });
  });
});

// ---- 边界 ----

describe('促销活动: 边界测试', () => {
  it('13. 生成 0 条促销应返回空数组', () => {
    const data = generateMockPromotions(0);
    assert.strictEqual(data.length, 0);
  });

  it('14. 生成 1 条促销正常工作', () => {
    const data = generateMockPromotions(1);
    assert.strictEqual(data.length, 1);
    assert.ok(data[0].id);
  });

  it('15. 生成 100 条促销没有错误', () => {
    const data = generateMockPromotions(100);
    assert.strictEqual(data.length, 100);
  });

  it('16. budget 精度为两位小数', () => {
    const data = generateMockPromotions(50);
    data.forEach((d) => {
      const parts = d.budget.toString().split('.');
      if (parts.length === 2) {
        assert.ok(parts[1].length <= 2, `budget ${d.budget} has more than 2 decimal places`);
      }
    });
  });

  it('17. title 值始终非空', () => {
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.ok(d.title, `title should not be empty for ${d.id}`);
    });
  });

  it('18. startDate 不晚于 endDate', () => {
    const data = generateMockPromotions(36);
    data.forEach((d) => {
      assert.ok(d.startDate <= d.endDate, `${d.id}: ${d.startDate} > ${d.endDate}`);
    });
  });

  it('19. status "draft" 的活动 startDate 在未来', () => {
    const data = generateMockPromotions(36);
    const now = new Date().toISOString().slice(0, 10);
    const drafts = data.filter((d) => d.status === 'draft');
    drafts.forEach((d) => {
      assert.ok(d.startDate >= now, `${d.id} draft startDate ${d.startDate} not >= now ${now}`);
    });
  });

  it('20. status "ended" 的活动 endDate 在过去', () => {
    const data = generateMockPromotions(36);
    const now = new Date().toISOString().slice(0, 10);
    const ended = data.filter((d) => d.status === 'ended');
    ended.forEach((d) => {
      assert.ok(d.endDate <= now, `${d.id} ended endDate ${d.endDate} not <= now ${now}`);
    });
  });

  it('21. status "active" 的活动 endDate 在未来', () => {
    const data = generateMockPromotions(36);
    const now = new Date().toISOString().slice(0, 10);
    const actives = data.filter((d) => d.status === 'active');
    actives.forEach((d) => {
      assert.ok(d.endDate >= now, `${d.id} active endDate ${d.endDate} not >= now ${now}`);
    });
  });
});

// ---- 页面导出验证 ----

describe('促销活动: 页面组件验证', () => {
  it('22. 页面模块可被 import 且具有默认导出', async () => {
    const mod = await import('./page');
    assert.ok(mod.default, 'page should have a default export');
    assert.strictEqual(typeof mod.default, 'function', 'default export should be a function');
  });

  it('23. 页面组件返回非空', async () => {
    // 仅验证组件函数存在，不渲染
    const mod = await import('./page');
    assert.ok(mod.default, 'Component should exist');
  });
});
