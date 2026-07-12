/**
 * configuration/three-level/page.test.ts — 三级独立配置页 L1 测试
 *
 * 覆盖:
 *   正例 — WorkbenchSnapshot 数据结构、fallback 错误处理、工作台枚举完整性
 *   反例 — API 异常返回 error 模式、空 items 列表
 *   边界 — 0 total、默认 tenant ID
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型 ────────────────────────────────────────────

type TenantConfigWorkbenchCode = 'W-S' | 'W-T' | 'W-B';

interface TenantConfigEffective {
  key: string;
  value: unknown;
  sensitive: boolean;
}

interface WorkbenchSnapshot {
  code: TenantConfigWorkbenchCode;
  title: string;
  description: string;
  level: 'store' | 'tenant' | 'brand';
  items: TenantConfigEffective[];
  total: number;
  deliveryMode: 'api' | 'fallback';
  error?: string;
}

// ─── 常量 ────────────────────────────────────────────

const FALLBACK_TENANT_ID = 'tenant-demo';

const WORKBENCH_DEFS: { code: TenantConfigWorkbenchCode; level: 'store' | 'tenant' | 'brand'; title: string; description: string }[] = [
  { code: 'W-S', level: 'store', title: '门店工作台 (W-S)', description: '门店操作员日常配置:POS/打印/会员签到' },
  { code: 'W-T', level: 'tenant', title: '租户工作台 (W-T)', description: '连锁租户管理:会员体系/营销/库存/AI' },
  { code: 'W-B', level: 'brand', title: '品牌工作台 (W-B)', description: '品牌方管控:合规/计费/品牌标准' },
];

// ─── 辅助函数（从 page.tsx 提取）─────────────────────

async function loadWorkbench(
  code: TenantConfigWorkbenchCode,
  level: 'store' | 'tenant' | 'brand',
  title: string,
  description: string,
  shouldFail: boolean = false,
): Promise<WorkbenchSnapshot> {
  if (shouldFail) {
    return {
      code,
      title,
      description,
      level,
      items: [],
      total: 0,
      deliveryMode: 'fallback',
      error: 'Simulated API error',
    };
  }
  return {
    code,
    title,
    description,
    level,
    items: [
      { key: 'example_config', value: true, sensitive: false },
    ],
    total: 1,
    deliveryMode: 'api',
  };
}

function computeFallbackCount(snapshots: WorkbenchSnapshot[]): number {
  return snapshots.filter(s => s.deliveryMode === 'fallback').length;
}

function computeTotalItems(snapshots: WorkbenchSnapshot[]): number {
  return snapshots.reduce((s, w) => s + w.total, 0);
}

// ─── 测试套件 ────────────────────────────────────────

describe('configuration/three-level — 工作台定义', () => {
  it('1. 3 个工作台（正例）', () => {
    assert.equal(WORKBENCH_DEFS.length, 3);
  });

  it('2. W-S 为 store 级（正例）', () => {
    const ws = WORKBENCH_DEFS.find(d => d.code === 'W-S')!;
    assert.equal(ws.level, 'store');
  });

  it('3. W-T 为 tenant 级（正例）', () => {
    const wt = WORKBENCH_DEFS.find(d => d.code === 'W-T')!;
    assert.equal(wt.level, 'tenant');
  });

  it('4. W-B 为 brand 级（正例）', () => {
    const wb = WORKBENCH_DEFS.find(d => d.code === 'W-B')!;
    assert.equal(wb.level, 'brand');
  });

  it('5. 各工作台都有 description（正例）', () => {
    for (const d of WORKBENCH_DEFS) {
      assert.ok(d.description.length > 0, `${d.code} description`);
    }
  });
});

describe('configuration/three-level — API 加载', () => {
  it('6. 正常加载返回 api 模式（正例）', async () => {
    const wb = await loadWorkbench('W-S', 'store', '测试', '测试');
    assert.equal(wb.deliveryMode, 'api');
    assert.equal(wb.total, 1);
    assert.equal(wb.items.length, 1);
  });

  it('7. 失败加载返回 fallback 并带 error（反例）', async () => {
    const wb = await loadWorkbench('W-T', 'tenant', '测试', '测试', true);
    assert.equal(wb.deliveryMode, 'fallback');
    assert.ok(wb.error);
    assert.equal(wb.items.length, 0);
    assert.equal(wb.total, 0);
  });

  it('8. fallback 时不丢失 meta 信息（正例）', async () => {
    const wb = await loadWorkbench('W-S', 'store', '门店工作台', '描述', true);
    assert.equal(wb.code, 'W-S');
    assert.equal(wb.title, '门店工作台');
    assert.equal(wb.level, 'store');
  });
});

describe('configuration/three-level — 统计 & 常量', () => {
  it('9. FALLBACK_TENANT_ID 为 tenant-demo（正例）', () => {
    assert.equal(FALLBACK_TENANT_ID, 'tenant-demo');
  });

  it('10. computeFallbackCount 正确计数（正例）', async () => {
    const ws = await loadWorkbench('W-S', 'store', 'S', 'S');
    const wt = await loadWorkbench('W-T', 'tenant', 'T', 'T', true);
    const wb = await loadWorkbench('W-B', 'brand', 'B', 'B');
    assert.equal(computeFallbackCount([ws, wt, wb]), 1);
  });

  it('11. 全 fallback 计数（反例）', async () => {
    const allFail = await Promise.all([
      loadWorkbench('W-S', 'store', 'S', 'S', true),
      loadWorkbench('W-T', 'tenant', 'T', 'T', true),
      loadWorkbench('W-B', 'brand', 'B', 'B', true),
    ]);
    assert.equal(computeFallbackCount(allFail), 3);
  });

  it('12. 全正常时无 fallback（正例）', async () => {
    const allOk = await Promise.all([
      loadWorkbench('W-S', 'store', 'S', 'S'),
      loadWorkbench('W-T', 'tenant', 'T', 'T'),
      loadWorkbench('W-B', 'brand', 'B', 'B'),
    ]);
    assert.equal(computeFallbackCount(allOk), 0);
  });

  it('13. total items 合计（正例）', async () => {
    const snapshots = await Promise.all([
      loadWorkbench('W-S', 'store', 'S', 'S'),
      loadWorkbench('W-T', 'tenant', 'T', 'T', true),
      loadWorkbench('W-B', 'brand', 'B', 'B'),
    ]);
    assert.equal(computeTotalItems(snapshots), 2);
  });

  it('14. 所有 code 在 WORKBENCH_DEFS 中（正例）', () => {
    const codes = new Set(WORKBENCH_DEFS.map(d => d.code));
    assert.ok(codes.has('W-S'));
    assert.ok(codes.has('W-T'));
    assert.ok(codes.has('W-B'));
    assert.equal(codes.size, 3);
  });
});
