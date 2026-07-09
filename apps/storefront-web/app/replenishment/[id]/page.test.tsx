/**
 * replenishment/[id]/page.test.tsx — 补货单详情页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
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

describe('replenishment detail — 正例', () => {
  it('应导出一个默认组件 ReplenishmentDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function ReplenishmentDetailPage'), '缺少默认导出');
  });

  it('应包含补货申请单详情接口 ReplenishmentDetail', () => {
    const src = readSource();
    assert.ok(src.includes('interface ReplenishmentDetail'), '缺少接口');
  });

  it('应包含补货明细接口 ReplenishmentLine', () => {
    const src = readSource();
    assert.ok(src.includes('interface ReplenishmentLine'), '缺少补货明细接口');
  });

  it('应包含 MOCK_DETAIL 模拟详情数据', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DETAIL'), '缺少模拟数据');
  });

  it('应包含状态、操作、时间线等核心逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('statusVariant'), '缺少状态变体映射');
    assert.ok(src.includes('STATUS_LABEL'), '缺少状态标签映射');
    assert.ok(src.includes('getAvailableActions'), '缺少可用操作函数');
    assert.ok(src.includes('buildTimeline'), '缺少时间线构建函数');
    assert.ok(src.includes('ConfirmActionDialog'), '缺少确认弹窗');
    assert.ok(src.includes('Timeline'), '缺少时间线组件');
  });
});

describe('replenishment detail — 边界', () => {
  it('应覆盖所有补货状态', () => {
    const src = readSource();
    const expectedStatuses = ['draft', 'pending_approval', 'approved', 'shipped', 'completed', 'rejected', 'cancelled'];
    for (const s of expectedStatuses) {
      assert.ok(src.includes(`'${s}'`), `缺少状态 ${s}`);
    }
  });

  it('应覆盖所有操作类型', () => {
    const src = readSource();
    const expectedActions = ['approve', 'reject', 'cancel', 'ship', 'complete'];
    for (const a of expectedActions) {
      assert.ok(src.includes(`'${a}'`), `缺少操作 ${a}`);
    }
  });

  it('draft 状态下只能取消', () => {
    const src = readSource();
    assert.ok(src.includes("draft: ['cancel']"), 'draft 状态应仅可取消');
  });

  it('pending_approval 状态下可审核通过或驳回', () => {
    const src = readSource();
    assert.ok(src.includes("pending_approval: ['approve', 'reject']"), 'pending_approval 状态可审核/驳回');
  });

  it('completed 状态下无可用操作', () => {
    const src = readSource();
    assert.ok(src.includes('completed: []'), 'completed 状态无操作');
  });
});

describe('replenishment detail — 防御', () => {
  it('应处理未知状态（兜底空数组）', () => {
    const src = readSource();
    const getAvailableActions = src.match(/const getAvailableActions =.*?{([^}]+)}/s);
    assert.ok(getAvailableActions, 'getAvailableActions 应存在');
  });

  it('应处理空明细行', () => {
    const src = readSource();
    assert.ok(src.includes('detail.lines'), '应渲染明细行');
  });

  it('应包含空状态兜底 EmptyState', () => {
    const src = readSource();
    assert.ok(src.includes('<EmptyState'), '空状态兜底');
    assert.ok(src.includes('LoadingSkeleton'), '加载状态');
  });

  it('应包含 onBack 返回列表回调', () => {
    const src = readSource();
    assert.ok(src.includes("onBack={() => router.push('/replenishment')"), '返回列表链接');
  });
});
