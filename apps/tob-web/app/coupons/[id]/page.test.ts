/**
 * coupons/[id]/page.test.ts — 优惠券详情页 L1 冒烟测试
 * 覆盖：正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('coupon-detail — 正例', () => {
  it('应导出一个默认组件 CouponDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CouponDetailPage'), '缺少默认导出');
  });

  it('应使用 useParams 获取 ID', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), '缺少 useParams');
  });

  it('应使用 useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), '缺少 useRouter');
  });

  it('应使用 useToast', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), '缺少 useToast');
  });

  it('应处理未找到优惠券的兜底', () => {
    const src = readSource();
    assert.ok(src.includes('未找到 ID'), '缺少未找到文案');
  });

  it('应包含 DescriptionList 展示基本信息', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionList'), '缺少 DescriptionList');
    assert.ok(src.includes('优惠券名称'), '缺少名称列');
    assert.ok(src.includes('面值'), '缺少面值列');
  });

  it('应包含 StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应包含 Timeline 操作日志', () => {
    const src = readSource();
    assert.ok(src.includes('Timeline'), '缺少 Timeline');
    assert.ok(src.includes('操作日志'), '缺少操作日志标题');
  });

  it('应包含核销统计（总发放/已核销/核销率）', () => {
    const src = readSource();
    assert.ok(src.includes('总发放'), '缺少总发放');
    assert.ok(src.includes('已核销'), '缺少已核销');
    assert.ok(src.includes('核销率'), '缺少核销率');
  });

  it('应包含确认弹窗 ConfirmDialog', () => {
    const src = readSource();
    assert.ok(src.includes('ConfirmDialog'), '缺少 ConfirmDialog');
    assert.ok(src.includes('确认删除'), '缺少确认删除');
  });

  it('应包含 DetailClosureBar 返回导航', () => {
    const src = readSource();
    assert.ok(src.includes('DetailClosureBar'), '缺少 DetailClosureBar');
    assert.ok(src.includes('返回优惠券列表'), '缺少返回文案');
  });

  it('应包含 DetailActionBar 状态流转', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), '缺少 DetailActionBar');
    assert.ok(src.includes('状态流转'), '缺少状态流转标题');
  });

  it('应使用面包屑 breadcrumbs', () => {
    const src = readSource();
    assert.ok(src.includes('breadcrumbs'), '缺少 breadcrumbs');
    assert.ok(src.includes('首页'), '缺少首页面包屑');
  });

  it('应包含 DetailShell actions', () => {
    const src = readSource();
    assert.ok(src.includes('variant: \'primary\''), '含 primary variant');
    assert.ok(src.includes('variant: \'danger\''), '含 danger variant');
  });

  it('应包含有效期展示', () => {
    const src = readSource();
    assert.ok(src.includes('生效日期'), '缺少生效日期');
    assert.ok(src.includes('截止日期'), '缺少截止日期');
  });
});

describe('coupon-detail — 边界', () => {
  it('当 coupon 为 null 时应有兜底处理', () => {
    const src = readSource();
    assert.ok(src.includes('!coupon'), '缺少空值判断');
    assert.ok(src.includes('优惠券不存在'), '缺少不存在文案');
  });

  it('应能处理停用/激活状态切换', () => {
    const src = readSource();
    assert.ok(src.includes('handleStatusChange'), '缺少状态切换函数');
    assert.ok(src.includes('STATUS_TRANSITIONS'), '缺少状态流转映射');
    assert.ok(src.includes('disabled'), '包含 disabled');
    assert.ok(src.includes('active'), '包含 active');
  });

  it('应能处理删除操作', () => {
    const src = readSource();
    assert.ok(src.includes('handleDelete'), '缺少删除函数');
    assert.ok(src.includes('setIsDeleting'), '缺少删除状态');
    assert.ok(src.includes('isDeleting'), '缺少 isDeleting');
  });

  it('应包含 useCallback 优化', () => {
    const src = readSource();
    const callbacks = src.match(/useCallback/g);
    assert.ok(callbacks && callbacks.length >= 3, `useCallback 数量 ${callbacks?.length} 应 >= 3`);
  });

  it('所有可能的状态流转都已定义', () => {
    const src = readSource();
    assert.ok(src.includes('active:') && src.includes('disabled:') && src.includes('expired:'), '应包含所有状态流转');
    assert.ok(src.includes('disabled'), '包含 disabled 状态');
    assert.ok(src.includes('active'), '包含 active 状态');
    assert.ok(src.includes('STATUS_TRANSITIONS'), 'STATUS_TRANSITIONS 已定义');
  });

  it('核销率应有颜色标记', () => {
    const src = readSource();
    assert.ok(src.includes('redeemRate > 60'), '60% 以上绿色');
    assert.ok(src.includes('redeemRate > 20'), '20% 以上黄色');
  });

  it('按状态流转生成的 action labels', () => {
    const src = readSource();
    assert.ok(src.includes('激活') && src.includes('停用'), '应有激活和停用标签');
  });
});

describe('coupon-detail — 防御', () => {
  it('应包含 "use client" 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应从 coupons-data 导入共享数据', () => {
    const src = readSource();
    assert.ok(src.includes('./coupons-data'), '应引用共享数据模块');
    assert.ok(src.includes('MOCK_COUPONS'), '应引用 MOCK_COUPONS');
    assert.ok(src.includes('TYPE_LABELS'), '应引用类型标签');
    assert.ok(src.includes('STATUS_LABELS'), '应引用状态标签');
  });

  it('构建日志函数应有逻辑分支', () => {
    const src = readSource();
    assert.ok(src.includes("coupon.status === 'active'"), '活跃状态条件');
    assert.ok(src.includes("coupon.status === 'expired'"), '过期状态条件');
    assert.ok(src.includes("coupon.status === 'disabled'"), '停用状态条件');
    assert.ok(src.includes('coupon.usedCount > 0'), '核销条件');
  });

  it('不应使用已废弃的 meta/backUrl props', () => {
    const src = readSource();
    assert.ok(!src.includes('meta={{') && !src.includes('backUrl'), '不应使用已废弃 prop');
  });

  it('应使用 getCouponById 辅助函数', () => {
    const src = readSource();
    assert.ok(src.includes('getCouponById'), '缺少 getCouponById');
  });

  it('DetailShell 使用 subtitle prop', () => {
    const src = readSource();
    assert.ok(src.includes('subtitle=') && src.includes('TYPE_LABELS'), '应有 subtitle 展示类型');
  });
});
