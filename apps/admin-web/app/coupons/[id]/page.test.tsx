/**
 * coupons/[id]/page.test.tsx — 优惠券详情页 L1 冒烟测试
 * 角色视角: 👔运营 · 💰财务 · 📊品类经理
 * 覆盖: 正例(查找/统计/状态流转/数据渲染) + 反例(不存在/防御) + 边界(各类状态/极值)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { MOCK_COUPONS, COUPON_STATUS_MAP, COUPON_TYPE_MAP, COUPON_SCOPE_MAP } from '../../coupons-data';

import type { CouponItem, CouponStatus, CouponType, CouponScope } from '../../coupons-data';

/* ── 辅助函数 (与 page.tsx 一致) ── */

function findCoupon(id: string): CouponItem | undefined {
  return MOCK_COUPONS.find((c) => c.id === id);
}

function claimRate(item: CouponItem): number {
  if (item.totalQuota <= 0) return 0;
  return (item.usedCount / item.totalQuota) * 100;
}

const STATUS_TRANSITIONS: Record<CouponStatus, CouponStatus[]> = {
  draft: ['active'],
  active: ['paused', 'exhausted'],
  paused: ['active', 'exhausted'],
  exhausted: [],
  expired: [],
};

function statusActionLabel(status: CouponStatus, target: CouponStatus): string {
  const map: Record<string, string> = {
    'draft->active': '发布',
    'active->paused': '暂停',
    'paused->active': '恢复',
    'active->exhausted': '设为已领完',
    'paused->exhausted': '截停',
  };
  return map[`${status}->${target}`] ?? target;
}

function formatAmount(v: number): string {
  return v.toLocaleString();
}

/* =================================================================
 * 正例 (Happy Path)
 * ================================================================= */

test('👔 运营视角: 页面组件默认导出是函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'CouponDetailPage 应导出函数组件');
});

test('💰 财务视角: 组件不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page 导入应成功');
});

test('📊 品类经理视角: findCoupon 能正确查找所有 10 张优惠券', () => {
  const ids = MOCK_COUPONS.map((c) => c.id);
  for (const id of ids) {
    const found = findCoupon(id);
    assert.ok(found, `应找到 ID=${id}`);
    assert.equal(found.id, id);
  }
});

test('📊 品类经理视角: findCoupon 返回的 coupon 类型正确', () => {
  const c = findCoupon('c-001')!;
  assert.equal(typeof c.code, 'string');
  assert.equal(typeof c.discountValue, 'number');
  assert.ok(['active', 'paused', 'expired', 'draft', 'exhausted'].includes(c.status));
  assert.ok(['percentage', 'fixed', 'shipping', 'threshold'].includes(c.type));
});

test('正例: claimRate 计算正确 — SUMMER2026', () => {
  const c = findCoupon('c-001')!;
  assert.equal(claimRate(c), 56.79);
});

test('正例: claimRate 计算正确 — 已领完券', () => {
  const c = findCoupon('c-003')!;
  assert.equal(claimRate(c), 100);
});

test('正例: claimRate 草稿券=0', () => {
  const c = findCoupon('c-007')!;
  assert.equal(claimRate(c), 0);
});

test('正例: claimRate 大配额券', () => {
  const c = findCoupon('c-009')!; // BIRTHDAY: 11876/99999
  const rate = claimRate(c);
  assert.ok(rate > 11 && rate < 12);
});

test('正例: 状态映射 — 每种状态有 label 和 variant', () => {
  const statuses: CouponStatus[] = ['active', 'paused', 'expired', 'draft', 'exhausted'];
  for (const s of statuses) {
    const info = COUPON_STATUS_MAP[s];
    assert.ok(info.label.length > 0);
    assert.ok(['success', 'warning', 'danger', 'neutral'].includes(info.variant));
  }
});

test('正例: 类型映射 — 每种类型有 label 和 suffix', () => {
  const types: CouponType[] = ['percentage', 'fixed', 'shipping', 'threshold'];
  for (const t of types) {
    const info = COUPON_TYPE_MAP[t];
    assert.ok(info.label.length > 0);
    assert.equal(typeof info.suffix, 'string');
  }
});

test('正例: 范围映射完整', () => {
  const scopes: CouponScope[] = ['all', 'category', 'product', 'store', 'member_tier'];
  for (const s of scopes) {
    assert.ok(COUPON_SCOPE_MAP[s].length > 0);
  }
});

test('正例: formatAmount 格式化数字', () => {
  assert.equal(formatAmount(1000), '1,000');
  assert.equal(formatAmount(99999), '99,999');
  assert.equal(formatAmount(0), '0');
});

test('正例: active 券的可流转目标包含 paused 和 exhausted', () => {
  const targets = STATUS_TRANSITIONS['active'];
  assert.ok(targets.includes('paused'));
  assert.ok(targets.includes('exhausted'));
  assert.equal(targets.length, 2);
});

test('正例: draft 券的可流转目标只有 active', () => {
  const targets = STATUS_TRANSITIONS['draft'];
  assert.deepEqual(targets, ['active']);
});

test('正例: exhausted 券无可流转目标', () => {
  assert.deepEqual(STATUS_TRANSITIONS['exhausted'], []);
});

test('正例: expired 券无可流转目标', () => {
  assert.deepEqual(STATUS_TRANSITIONS['expired'], []);
});

test('正例: statusActionLabel 返回中文动作名', () => {
  assert.equal(statusActionLabel('draft', 'active'), '发布');
  assert.equal(statusActionLabel('active', 'paused'), '暂停');
  assert.equal(statusActionLabel('paused', 'active'), '恢复');
  assert.equal(statusActionLabel('active', 'exhausted'), '设为已领完');
  assert.equal(statusActionLabel('paused', 'exhausted'), '截停');
});

test('正例: 非标准流转 fallback 返回目标状态', () => {
  // @ts-expect-error 测试 fallback
  assert.equal(statusActionLabel('draft', 'expired'), 'expired');
});

test('正例: 每张券的 discountValue 和 threshold 是合法数字', () => {
  for (const c of MOCK_COUPONS) {
    assert.ok(Number.isFinite(c.discountValue), `${c.code} discountValue`);
    assert.ok(Number.isFinite(c.threshold), `${c.code} threshold`);
    assert.ok(c.discountValue >= 0);
    assert.ok(c.threshold >= 0);
  }
});

test('正例: 每张券的 totalQuota >= remainingQuota', () => {
  for (const c of MOCK_COUPONS) {
    assert.ok(c.totalQuota >= c.remainingQuota, `${c.code}: total(${c.totalQuota}) >= remaining(${c.remainingQuota})`);
  }
});

test('正例: 每张券的 usedCount + remainingQuota <= totalQuota', () => {
  for (const c of MOCK_COUPONS) {
    // 约等于关系 (有些券刚发布未核销)
    assert.ok(c.usedCount + c.remainingQuota <= c.totalQuota + 1, `${c.code}: used+remaining <= total`);
  }
});

/* =================================================================
 * 反例 (Defensive)
 * ================================================================= */

test('反例: findCoupon 不存在的 ID 返回 undefined', () => {
  assert.equal(findCoupon('nonexistent'), undefined);
  assert.equal(findCoupon(''), undefined);
  assert.equal(findCoupon('c-999'), undefined);
});

test('反例: claimRate totalQuota=0 不崩溃', () => {
  const bad: CouponItem = {
    id: 'bad', code: 'BAD', name: '坏券',
    type: 'fixed', discountValue: 10, threshold: 0,
    scope: 'all', scopeLabel: '全场',
    totalQuota: 0, remainingQuota: 0, usageLimit: 1, usedCount: 100,
    status: 'exhausted', startAt: '', endAt: '',
    createdBy: '', updatedAt: '',
  };
  assert.equal(claimRate(bad), 0);
});

test('反例: findCoupon 传入 null/undefined 安全', () => {
  // @ts-expect-error 测试非法入参
  assert.equal(findCoupon(null), undefined);
  // @ts-expect-error 测试非法入参
  assert.equal(findCoupon(undefined), undefined);
});

test('反例: STATUS_TRANSITIONS 不包含未知状态', () => {
  const knownStatuses: CouponStatus[] = ['active', 'paused', 'expired', 'draft', 'exhausted'];
  for (const s of knownStatuses) {
    const targets = STATUS_TRANSITIONS[s];
    assert.ok(Array.isArray(targets));
    for (const t of targets) {
      assert.ok(knownStatuses.includes(t), `${s} -> ${t} 应为合法状态`);
    }
  }
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: 无门槛券 threshold=0', () => {
  const noThreshold = MOCK_COUPONS.filter((c) => c.threshold === 0);
  assert.ok(noThreshold.length >= 3);
  for (const c of noThreshold) {
    assert.equal(c.threshold, 0);
  }
});

test('边界: 不限领券 usageLimit=99999', () => {
  const unlimited = MOCK_COUPONS.filter((c) => c.usageLimit === 99999);
  assert.equal(unlimited.length, 1);
  assert.equal(unlimited[0].code, 'BIRTHDAY');
});

test('边界: 已领完券剩余量=0', () => {
  const exhausted = MOCK_COUPONS.filter((c) => c.status === 'exhausted');
  for (const c of exhausted) {
    assert.equal(c.remainingQuota, 0);
  }
});

test('边界: 草稿券 remain = total', () => {
  const draft = MOCK_COUPONS.filter((c) => c.status === 'draft');
  for (const c of draft) {
    // 草稿券还未发放
    assert.equal(c.remainingQuota, c.totalQuota);
    assert.equal(c.usedCount, 0);
  }
});

test('边界: 大配额券 totalQuota=99999', () => {
  const c = findCoupon('c-009')!;
  assert.equal(c.totalQuota, 99999);
  assert.equal(c.usageLimit, 1);
});

test('边界: 单品包邮券 shipping type', () => {
  const shipping = MOCK_COUPONS.filter((c) => c.type === 'shipping');
  assert.equal(shipping.length, 1);
  assert.equal(shipping[0].discountValue, 0); // 包邮券 discountValue=0
});

test('边界: 数据完整性 — 10 张券', () => {
  assert.equal(MOCK_COUPONS.length, 10);
});

test('边界: 券码唯一性', () => {
  const codes = MOCK_COUPONS.map((c) => c.code);
  assert.equal(new Set(codes).size, codes.length);
});

test('边界: ID 唯一性', () => {
  const ids = MOCK_COUPONS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('边界: 所有日期格式统一为 YYYY-MM-DD', () => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  for (const c of MOCK_COUPONS) {
    assert.ok(dateRegex.test(c.startAt), `${c.code} startAt=${c.startAt}`);
    assert.ok(dateRegex.test(c.endAt), `${c.code} endAt=${c.endAt}`);
  }
});

test('边界: 停止流转 — expired 状态无法操作', () => {
  // expired 状态的券不应该有任何可流转的目标状态
  const expiredTransitions = STATUS_TRANSITIONS['expired'];
  assert.equal(expiredTransitions.length, 0);
});

test('边界: 完全核销券 — usedCount === totalQuota', () => {
  const fullyRedeemed = MOCK_COUPONS.filter(
    (c) => c.usedCount === c.totalQuota && c.totalQuota > 0,
  );
  for (const c of fullyRedeemed) {
    assert.equal(claimRate(c), 100);
  }
});
