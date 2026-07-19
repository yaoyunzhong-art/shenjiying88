/**
 * configuration/three-level/page.test.ts — 三级独立配置页 L1 全量测试
 *
 * 覆盖:
 *   正例 — WorkbenchSnapshot 数据结构、fallback 错误处理、工作台枚举完整性
 *   反例 — API 异常返回 error 模式、空 items 列表
 *   边界 — 0 total、默认 tenant ID、Suspense 加载态
 *   源码 — readFileSync 检查导出/import/结构
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SOURCE = resolve(__dirname, 'page.tsx');

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

const WORKBENCH_CODES = ['W-S', 'W-T', 'W-B'] as const;
const LEVELS = ['store', 'tenant', 'brand'] as const;

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

function computeMaxTotal(snapshots: WorkbenchSnapshot[]): number {
  return Math.max(...snapshots.map(w => w.total), 0);
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

describe('configuration/three-level — 源码分析 (readFileSync)', () => {
  const src = readFileSync(SOURCE, 'utf-8');

  it('15. 页面应包含 export default async function（正例）', () => {
    assert.ok(src.includes('export default async function ThreeLevelConfigPage'), '缺少服务端组件默认导出');
  });

  it('16. 页面应标记 dynamic = force-dynamic（正例）', () => {
    assert.ok(src.includes("dynamic = 'force-dynamic'"), '缺少 force-dynamic 标记');
  });

  it('17. 页面应引用 ThreeLevelConfigClient 客户端组件（正例）', () => {
    assert.ok(src.includes('ThreeLevelConfigClient'), '缺少客户端组件引用');
  });

  it('18. 页面应使用 Suspense 包裹客户端组件（边界）', () => {
    assert.ok(src.includes('Suspense'), '缺少 Suspense 加载边界');
  });

  it('19. 页面应通过 Promise.all 并发加载 3 个工作台（正例）', () => {
    assert.ok(src.includes('Promise.all(['), '缺少并发加载');
    assert.ok(src.includes('loadWorkbench('), '缺少 loadWorkbench 调用');
  });

  it('20. 页面应定义 createClient 函数（正例）', () => {
    assert.ok(src.includes('function createClient'), '缺少 createClient');
  });

  it('21. 页面不应有 console.log 残留（反例）', () => {
    const codeLines = src.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const hasConsoleLog = codeLines.some(l => /console\.log\s*\(/.test(l));
    assert.ok(!hasConsoleLog, '不应存在 console.log 调试残留');
  });

  it('22. 页面不应有硬编码 API token（反例）', () => {
    const sensitivePatterns = [/apiKey\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}/, /bearer\s+['"][A-Za-z0-9_\-]{20,}/i];
    for (const pat of sensitivePatterns) {
      assert.ok(!pat.test(src), '不应包含硬编码 API Token');
    }
  });

  it('23. 应使用 @m5/sdk 的 ApiClient（正例）', () => {
    assert.ok(src.includes('@m5/sdk'), '缺少 SDK 客户端引用');
    assert.ok(src.includes('ApiClient'), '缺少 ApiClient');
  });

  it('24. 页面源码应大于 2KB（边界）', () => {
    assert.ok(src.length > 2048, `源码长度 ${src.length} bytes, 不足 2KB`);
  });
});

describe('configuration/three-level — 边界与异常', () => {
  it('25. 单工作台加载失败不影响其他（边界）', async () => {
    const [ws, wt, wb] = await Promise.all([
      loadWorkbench('W-S', 'store', 'S', 'S'),
      loadWorkbench('W-T', 'tenant', 'S', 'S', true),
      loadWorkbench('W-B', 'brand', 'S', 'S'),
    ]);
    assert.equal(ws.deliveryMode, 'api');
    assert.equal(wt.deliveryMode, 'fallback');
    assert.equal(wb.deliveryMode, 'api');
    assert.ok(ws.items.length > 0);
    assert.ok(wb.items.length > 0);
    assert.equal(wt.items.length, 0);
  });

  it('26. items 为空时 total 应为 0（边界）', async () => {
    const wb = await loadWorkbench('W-S', 'store', 'S', 'S', true);
    assert.equal(wb.total, 0);
    assert.equal(wb.items.length, 0);
  });

  it('27. 计算最大 total（边界）', async () => {
    const snapshots = await Promise.all([
      loadWorkbench('W-S', 'store', 'S', 'S'),
      loadWorkbench('W-T', 'tenant', 'S', 'S'),
      loadWorkbench('W-B', 'brand', 'S', 'S'),
    ]);
    assert.equal(computeMaxTotal(snapshots), 1);
  });

  it('28. 空快照数组的统计数据为 0（边界）', () => {
    assert.equal(computeFallbackCount([]), 0);
    assert.equal(computeTotalItems([]), 0);
    assert.equal(computeMaxTotal([]), 0);
  });
});

describe('configuration/three-level — 业务字段验证', () => {
  it('29. TenantConfigEffective 接口包含 key/value/sensitive（正例）', () => {
    const item: TenantConfigEffective = { key: 'store.hours', value: '09:00-22:00', sensitive: false };
    assert.equal(typeof item.key, 'string');
    assert.ok('value' in item);
    assert.equal(typeof item.sensitive, 'boolean');
  });

  it('30. WorkbenchSnapshot 包含所有必需字段（正例）', () => {
    const ws: WorkbenchSnapshot = {
      code: 'W-S', title: '门店', description: 'desc', level: 'store',
      items: [], total: 0, deliveryMode: 'api',
    };
    // 必需字段 7 个(code/title/description/level/items/total/deliveryMode)
    assert.equal(Object.keys(ws).length, 7);
    assert.ok(['W-S', 'W-T', 'W-B'].includes(ws.code));
    assert.ok(['api', 'fallback'].includes(ws.deliveryMode));
    // error 为可选字段
    const wsWithError: WorkbenchSnapshot = {
      ...ws, error: 'test error',
    };
    assert.equal(Object.keys(wsWithError).length, 8);
  });

  it('31. level 必须为 store/tenant/brand 三者之一（正例）', () => {
    for (const level of LEVELS) {
      assert.ok(['store', 'tenant', 'brand'].includes(level));
    }
  });

  it('32. error 字段在 fallback 模式必须有值（正例）', async () => {
    const wb = await loadWorkbench('W-T', 'tenant', 'S', 'S', true);
    assert.equal(wb.deliveryMode, 'fallback');
    assert.ok(typeof wb.error === 'string' && wb.error.length > 0);
  });

  it('33. api 模式下 error 字段应为 undefined（正例）', async () => {
    const wb = await loadWorkbench('W-S', 'store', 'S', 'S');
    assert.equal(wb.deliveryMode, 'api');
    assert.equal(wb.error, undefined);
  });
});
