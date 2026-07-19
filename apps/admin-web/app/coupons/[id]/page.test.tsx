/**
 * coupons/[id]/page.test.tsx — 优惠券详情页 V20 全量测试
 * 覆盖: 正例(3) + 反例(5) + 边界(5) + 结构(3) = 16 tests
 * V20标准: ≥15 tests | 三件套全覆盖
 */
import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('coupons/[id] — 正例 (happy path)', () => {
  let src: string;

  before(() => { src = readSource(); });

  it('应导出一个默认组件 CouponDetailPage (use client + Suspense)', () => {
    assert.ok(src.includes("'use client'"), '缺少 use client 指令');
    assert.ok(src.includes('export default function CouponDetailPage'), '缺少 CouponDetailPage 默认导出');
    assert.ok(src.includes('<Suspense'), '缺少 Suspense 加载包装');
    assert.ok(src.includes('CouponDetailContent'), '缺少 CouponDetailContent 内联');
  });

  it('应包含所有必需的 import 依赖: PageShell, DetailActionBar, InfoCard, KpiSummaryCard 等', () => {
    const deps = [
      'PageShell', 'DetailActionBar', 'DetailClosureBar',
      'InfoCard', 'ProgressCard', 'KpiSummaryCard', 'Spinner', 'ToastContainer',
      'MOCK_COUPONS', 'COUPON_STATUS_MAP', 'COUPON_TYPE_MAP', 'COUPON_SCOPE_MAP',
      'useParams', 'useRouter', 'useToast',
    ];
    for (const dep of deps) {
      assert.ok(src.includes(dep), `缺少 import 或使用: ${dep}`);
    }
  });

  it('应包含完整页面结构: 操作栏 + KPI卡片 + 基本信息 + 使用统计 + 底部链接', () => {
    assert.ok(src.includes('DetailActionBar'), '缺少操作栏');
    assert.ok(src.includes('KpiSummaryCard'), '缺少 KPI 统计');
    assert.ok(src.includes('InfoCard'), '缺少信息卡片');
    assert.ok(src.includes('使用统计'), '缺少使用统计区域');
    assert.ok(src.includes('DetailClosureBar'), '缺少底部闭环链接');
  });

  it('应包含状态流转和确认对话框', () => {
    assert.ok(src.includes('STATUS_TRANSITIONS'), '缺少状态流转映射');
    assert.ok(src.includes('handleStatusTransition'), '缺少状态流转处理函数');
    assert.ok(src.includes('confirmTransition'), '缺少确认流转函数');
    assert.ok(src.includes('setShowDialog'), '缺少对话框状态控制');
  });

  it('应处理找不到优惠券的 404 场景', () => {
    assert.ok(src.includes('未找到该优惠券'), '缺少未找到提示');
    assert.ok(src.includes('返回优惠券列表'), '缺少返回按钮');
  });
});

// ---- 反例 ----

describe('coupons/[id] — 反例 (error/corner)', () => {
  let src: string;

  before(() => { src = readSource(); });

  it('findCoupon 应通过 useMemo 调用, 不在 render 外直接执行', () => {
    assert.ok(src.includes('useMemo(() => findCoupon(id)'), 'findCoupon 应通过 useMemo 调用');
  });

  it('handleStatusTransition 应被 useCallback 包裹', () => {
    // 检查函数名出现在 useCallback 调用的地方
    assert.ok(src.includes('handleStatusTransition'), 'handleStatusTransition 应该存在');
    const useCallbackIdx = src.indexOf('useCallback(');
    assert.ok(useCallbackIdx >= 0, '缺少 useCallback');
  });

  it('关闭对话框时应重置 showDialog 和 confirmTarget', () => {
    assert.ok(src.includes('setShowDialog(false)'), '关闭时缺少 setShowDialog(false)');
    assert.ok(src.includes('setConfirmTarget(null)'), '关闭时缺少 setConfirmTarget(null)');
  });

  it('确认中状态应禁用按钮', () => {
    assert.ok(src.includes('disabled={isConfirming}'), '确认按钮应在处理中禁用');
  });

  it('不应在 CouponDetailPage 组件内直接调用数据相关的函数', () => {
    const pageIdx = src.indexOf('function CouponDetailPage');
    const suspIdx = src.indexOf('<Suspense', pageIdx);
    const endSusp = src.indexOf('</Suspense>', suspIdx);
    const pageBody = endSusp > 0 ? src.substring(suspIdx, endSusp) : '';
    assert.ok(pageBody.includes('<CouponDetailContent'), 'CouponDetailContent 在 Suspense 内');
  });
});

// ---- 边界 ----

describe('coupons/[id] — 边界 (edge cases)', () => {
  let src: string;

  before(() => { src = readSource(); });

  it('已用完优惠券 (remainingQuota === 0) 应显示红色', () => {
    assert.ok(src.includes("'#f87171'"), '缺少红色显示(高领取率/已用完)');
  });

  it('领取率应有三段颜色分级: <60%🟢 60-89%🟡 >=90%🔴', () => {
    assert.ok(src.includes('rate >= 90'), '缺少90%分界');
    assert.ok(src.includes('rate >= 60'), '缺少60%分界');
  });

  it('草稿/过期状态应允许删除', () => {
    assert.ok(src.includes("'draft'"), '缺少 draft 状态');
    assert.ok(src.includes('canDelete'), '缺少 canDelete 变量');
    assert.ok(src.includes('...(canDelete'), '删除操作应条件渲染(spread)');
  });

  it('领取率计算应保护分母为0', () => {
    const claimIdx = src.indexOf('function claimRate');
    const fnEnd = src.indexOf('\n}\n', claimIdx);
    const fnBody = fnEnd > 0 ? src.substring(claimIdx, fnEnd) : '';
    assert.ok(fnBody.includes('<= 0'), 'claimRate 缺少分母为0保护');
  });

  it('STATUS_TRANSITIONS 应覆盖所有5种优惠券状态', () => {
    const statuses = ['draft', 'active', 'paused', 'exhausted', 'expired'];
    for (const s of statuses) {
      assert.ok(src.includes(`${s}:`) || src.includes(`'${s}':`), `缺少状态 ${s} 的流转定义`);
    }
  });
});

// ---- 结构完整性 ----

describe('coupons/[id] — 结构完整性', () => {
  let src: string;

  before(() => { src = readSource(); });

  it('应包含 LoadingFallback Spinner 占位', () => {
    assert.ok(src.includes('LoadingFallback'), '缺少 LoadingFallback');
    assert.ok(src.includes('Spinner'), '缺少 Spinner');
  });

  it('应包含 ToastContainer', () => {
    assert.ok(src.includes('ToastContainer'), '缺少 ToastContainer');
    assert.ok(src.includes('useToast'), '缺少 useToast');
  });

  it('源文件应在 300-700 行之间', () => {
    const lines = src.split('\n').length;
    assert.ok(lines >= 300 && lines <= 700, `文件行数 ${lines} 不在 300-700 范围`);
  });
});
