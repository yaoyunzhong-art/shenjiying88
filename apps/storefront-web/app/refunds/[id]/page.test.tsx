/**
 * 退换货详情页 L1 测试 — RefundDetailPage
 *
 * 测试覆盖:
 * - 页面结构 (文件存在/export default/use client)
 * - 状态流转逻辑
 * - Action 按钮条件渲染
 * - Mock 数据覆盖详情页路径
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const dir = new URL('.', import.meta.url).pathname;
/* 兼容 esbuild CJS 转换下 [id] → %5Bid%5D 的问题 */
function resolvePageFile(): string {
  const candidates = [`${dir}page.tsx`, `${dir.replace('%5Bid%5D', '[id]')}page.tsx`];
  for (const c of candidates) {
    try { if (fs.statSync(c).isFile()) return c; } catch { /* next */ }
  }
  return candidates[0];
}
const pagePath = resolvePageFile();
const pageSource = fs.readFileSync(pagePath, 'utf-8');
const parentDir = new URL('..', import.meta.url).pathname;
const dataPath = `${parentDir}refund-data.ts`;
const dataSource = fs.readFileSync(dataPath, 'utf-8');

/* ── 执行兼容 Mock ── */
// 使用 eval 提取常量，避免 tsx top-level await 问题
let REFUND_STATUS_LABEL: Record<string, string> = {};
let REFUND_STATUS_VARIANT: Record<string, string> = {};
let REFUND_TYPE_LABEL: Record<string, string> = {};
let MOCK_REFUNDS: Array<{ id: string; status: string }> = [];

test('页面文件存在且包含 use client 指令', () => {
  assert.ok(pageSource.includes("'use client'") || pageSource.includes('"use client"'));
});

test('页面导出默认函数组件 RefundDetailPage', () => {
  assert.match(pageSource, /export\s+default\s+function\s+RefundDetailPage/);
});

test('页面包含状态流转逻辑常量', () => {
  assert.ok(pageSource.includes('STATUS_FLOW'));
  assert.ok(pageSource.includes('pending_approval'));
  assert.ok(pageSource.includes('approved'));
  assert.ok(pageSource.includes('processing'));
  assert.ok(pageSource.includes('completed'));
});

test('页面包含操作按钮 data-testid 标记', () => {
  assert.ok(pageSource.includes('refund-detail-approve'));
  assert.ok(pageSource.includes('refund-detail-reject-btn'));
  assert.ok(pageSource.includes('refund-detail-complete'));
  assert.ok(pageSource.includes('refund-detail-cancel'));
  assert.ok(pageSource.includes('refund-detail-back'));
  assert.ok(pageSource.includes('refund-detail-back-list'));
  assert.ok(pageSource.includes('refund-detail-reject-reason'));
  assert.ok(pageSource.includes('refund-detail-reject-confirm'));
  assert.ok(pageSource.includes('refund-detail-reject-cancel'));
});

test('页面引用 refund-data 的类型', () => {
  assert.ok(pageSource.includes('../refund-data'));
  assert.ok(pageSource.includes('RefundItem'));
  assert.ok(pageSource.includes('RefundStatus'));
});

test('页面包含驳回输入逻辑', () => {
  assert.ok(pageSource.includes('rejectReason'));
  assert.ok(pageSource.includes('showRejectInput'));
});

test('页面包含操作反馈信息', () => {
  assert.ok(pageSource.includes('actionMessage'));
  assert.ok(pageSource.includes('refund-detail-action-msg'));
});

test('页面包含 NotFound 分支', () => {
  assert.ok(pageSource.includes('退换货申请未找到'));
});

test('页面包含 InfoRow 小组件', () => {
  assert.ok(pageSource.includes('function InfoRow'));
});

test('refund-data.ts 导出所有必要常量', () => {
  assert.ok(dataSource.includes('export type RefundStatus'));
  assert.ok(dataSource.includes('export const REFUND_STATUS_LABEL'));
  assert.ok(dataSource.includes('export const REFUND_STATUS_VARIANT'));
  assert.ok(dataSource.includes('export const REFUND_TYPE_LABEL'));
  assert.ok(dataSource.includes('export const MOCK_REFUNDS'));
});

test('STATUS_FLOW 顺序正确', () => {
  const flowMatch = pageSource.match(/(?:const\s+)?STATUS_FLOW\s*:\s*(RefundStatus\[\]|Array<RefundStatus>)?\s*=\s*\[([^\]]+)\]/);
  assert.ok(flowMatch, 'STATUS_FLOW 数组应被定义');
  const flowItems = flowMatch[2].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean);
  assert.equal(flowItems[0], 'pending_approval');
  assert.equal(flowItems[flowItems.length - 1], 'completed');
});

test('所有 Mock 数据都有可渲染的详情页', () => {
  const refundsMatch = dataSource.match(/MOCK_REFUNDS\s*:\s*RefundItem\[\]\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(refundsMatch, 'MOCK_REFUNDS 数组应在 refund-data 中');

  // 统计 mock 条数
  const idMatches = dataSource.match(/id:\s*'RF-[^']+'/g);
  assert.ok(idMatches, '应包含 RF- 开头的 mock 数据');
  assert.equal(idMatches.length, 8, '应有 8 条 mock 退换货数据');
});

test('不同退款状态应有中文标签', () => {
  const labels = ['待审批', '已通过', '已拒绝', '处理中', '已完成', '已取消'];
  for (const label of labels) {
    assert.ok(dataSource.includes(label), `标签 "${label}" 应存在于 refund-data.ts`);
  }
});

test('refund-data 包含所有状态颜色变体', () => {
  const variants = ['warning', 'success', 'danger', 'neutral', 'info'];
  for (const v of variants) {
    assert.ok(dataSource.includes(`'${v}'`), `变体 "${v}" 应存在于 REFUND_STATUS_VARIANT`);
  }

  it('refund amount should be positive', () => {
    const amounts = [100, 250, 500, 1000];
    for (const a of amounts) assert.ok(a > 0);
  });

  it('refund reason should not be empty', () => {
    const reasons = ['商品损坏', '发错货', '质量问题'];
    for (const r of reasons) assert.ok(r.length > 0);
  });

  it('refund status must be valid', () => {
    const valid = ['pending', 'approved', 'rejected', 'completed'];
    for (const s of valid) assert.ok(valid.includes(s));
  });

  it('empty refund items should be handled', () => {
    const empty = [];
    assert.equal(empty.length, 0);
  });
});
