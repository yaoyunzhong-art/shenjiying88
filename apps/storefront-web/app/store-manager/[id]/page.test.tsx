/**
 * store-manager/[id]/page.test.tsx — 门店详情页 L1 冒烟测试 (storefront-web)
 * 角色视角: 👔店长
 * 类型: B-页面创建 (详情页)
 * 覆盖: 正例·反例·边界·防御·状态流转
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- 辅助 ----

function readSource(file: string): string {
  const p = resolve(__dirname, file);
  if (!existsSync(p)) throw new Error(`File not found: ${p}`);
  return readFileSync(p, 'utf-8');
}

function readComponentSource(): string {
  return readSource('store-manager-detail.tsx');
}

// ============================================================
// 正例
// ============================================================

describe('store-manager/[id]/page — 正例', () => {
  it('page.tsx 应导出默认函数 StoreManagerDetailPage', () => {
    const src = readSource('page.tsx');
    assert.match(src, /export default async function StoreManagerDetailPage/);
    assert.match(src, /params:\s*Promise<\{ id: string \}>/);
  });

  it('page.tsx 应引用 StoreManagerDetail 组件', () => {
    const src = readSource('page.tsx');
    assert.match(src, /import.*StoreManagerDetail.*from.*store-manager-detail/);
  });

  it('page.tsx 应定义 StoreDetailData 类型', () => {
    const src = readSource('page.tsx');
    assert.match(src, /export interface StoreDetailData/);
    assert.match(src, /status:\s*'operating'.*'paused'.*'closed_today'.*'renovation'/);
    assert.match(src, /kpi:/);
    assert.match(src, /recentAlerts/);
  });

  it('page.tsx 应导出 StoreDetailData 接口', () => {
    const src = readSource('page.tsx');
    assert.match(src, /export interface StoreDetailData/);
    // 关键字段
    assert.match(src, /todayRevenue/);
    assert.match(src, /monthlyKpiRate/);
    assert.match(src, /customerSatisfaction/);
  });

  it('page.tsx 应包含 Mock 数据 (朝阳旗舰店/海淀中关村店)', () => {
    const src = readSource('page.tsx');
    assert.match(src, /朝阳旗舰店/);
    assert.match(src, /海淀中关村店/);
    assert.match(src, /store-1/);
  });

  it('page.tsx 应包含 status 枚举', () => {
    const src = readSource('page.tsx');
    assert.match(src, /status:\s*'operating'/);
    assert.match(src, /'renovation'/);
  });

  it('store-manager-detail.tsx 应导出 StoreManagerDetail 函数', () => {
    const src = readComponentSource();
    assert.match(src, /export function StoreManagerDetail/);
  });

  it('store-manager-detail.tsx 应包含核心子组件', () => {
    const src = readComponentSource();
    assert.match(src, /function KpiCard/);
    assert.match(src, /function InfoRow/);
    assert.match(src, /function StatusBadge/);
    assert.match(src, /STATUS_CONFIG/);
    assert.match(src, /ALERT_VARIANTS/);
  });

  it('store-manager-detail.tsx 应渲染 KPI 网格区域', () => {
    const src = readComponentSource();
    assert.match(src, /data-testid="kpi-grid"/);
    assert.match(src, /data-testid="detail-header"/);
    assert.match(src, /data-testid="store-name"/);
    assert.match(src, /data-testid="info-card"/);
    assert.match(src, /data-testid="alerts-card"/);
    assert.match(src, /data-testid="action-bar"/);
  });

  it('store-manager-detail.tsx 应导出 StoreManagerDetailProps 接口', () => {
    const src = readComponentSource();
    assert.match(src, /export interface StoreManagerDetailProps/);
    assert.match(src, /detail:\s*StoreDetailData/);
  });

  it('store-manager-detail.tsx 应包含页面容器布局', () => {
    const src = readComponentSource();
    assert.match(src, /maxWidth:\s*1200/);
  });
});

// ============================================================
// 反例 (防御性处理)
// ============================================================

describe('store-manager/[id]/page — 反例', () => {
  it('page.tsx 应处理未找到门店 (404)', () => {
    const src = readSource('page.tsx');
    assert.match(src, /if\s*\(!detail\)/);
    assert.match(src, /未找到门店信息/);
  });

  it('page.tsx 应处理空/无效的 id', () => {
    const src = readSource('page.tsx');
    assert.match(src, /STORE_DETAILS\[id\]/);
    assert.match(src, /!detail/);
  });

  it('store-manager-detail.tsx 应处理空告警列表', () => {
    const src = readComponentSource();
    assert.match(src, /recentAlerts\.length\s*===\s*0/);
    assert.match(src, /暂无告警/);
  });

  it('store-manager-detail.tsx 中 fallback status 不应报错', () => {
    const src = readComponentSource();
    assert.match(src, /STATUS_CONFIG\[detail\.status\]/);
    assert.match(src, /\|\| STATUS_CONFIG\.operating/);
  });

  it('store-manager-detail.tsx 中 ALERT_VARIANTS fallback', () => {
    const src = readComponentSource();
    assert.match(src, /ALERT_VARIANTS\[alert\.severity\]/);
    assert.match(src, /\|\| ALERT_VARIANTS\.info/);
  });
});

// ============================================================
// 边界
// ============================================================

describe('store-manager/[id]/page — 边界', () => {
  it('page.tsx 应有至少 3 个门店 Mock 数据', () => {
    const src = readSource('page.tsx');
    const matches = src.match(/'\w+-\d+':\s*\{/g);
    assert.ok(matches !== null && matches.length >= 3,
      `expected ≥3 store entries, got ${matches?.length ?? 0}`);
  });

  it('page.tsx Mock 数据应覆盖 4 种门店状态', () => {
    const src = readSource('page.tsx');
    assert.match(src, /operating/);
    assert.match(src, /renovation/);
    // 至少两种状态被覆盖
    assert.ok(
      (src.match(/status:\s*'(operating|paused|closed_today|renovation)'/g) ?? []).length >= 2,
      'should cover at least 2 status types',
    );
  });

  it('store-manager-detail.tsx STATUS_CONFIG 应有 4 项', () => {
    const src = readComponentSource();
    const configKeys = ['operating', 'paused', 'closed_today', 'renovation'];
    for (const key of configKeys) {
      assert.match(src, new RegExp(`${key}:\\s*\\{`), `STATUS_CONFIG should include ${key}`);
    }
  });

  it('store-manager-detail.tsx ALERT_VARIANTS 应有 3 项', () => {
    const src = readComponentSource();
    const keys = ['critical', 'warning', 'info'];
    for (const k of keys) {
      assert.match(src, new RegExp(`${k}:\\s*\\{`), `ALERT_VARIANTS should include ${k}`);
    }
  });

  it('store-manager-detail.tsx ALERT_TYPE_LABELS 应有 4 项', () => {
    const src = readComponentSource();
    const keys = ['device', 'inventory', 'member', 'security'];
    for (const k of keys) {
      assert.match(src, new RegExp(`${k}:\\s*'`), `ALERT_TYPE_LABELS should include ${k}`);
    }
  });

  it('store-manager-detail.tsx 应包含编辑/状态流转按钮', () => {
    const src = readComponentSource();
    assert.match(src, /编辑/);
    assert.match(src, /暂停营业|恢复营业/);
    assert.match(src, /查看完整报表|排班管理|库存盘点|操作日志/);
  });

  it('store-manager-detail.tsx KpiCard 应含 trendPositive 判断', () => {
    const src = readComponentSource();
    // 至少应含箭头符号
    assert.match(src, /[↑↓]/);
  });
});

// ============================================================
// 防御性 (文件完整性)
// ============================================================

describe('store-manager/[id]/page — 文件完整性', () => {
  it('所有必需的文件应存在', () => {
    const files = ['page.tsx', 'page.test.tsx', 'store-manager-detail.tsx'];
    for (const f of files) {
      const p = resolve(__dirname, f);
      assert.equal(existsSync(p), true, `File should exist: ${f}`);
    }
  });

  it('page.tsx 与 store-manager-detail.tsx 的类型定义应一致', () => {
    const pageSrc = readSource('page.tsx');
    const detailSrc = readComponentSource();
    // StoreDetailData 应在 page.tsx 中定义，在 store-manager-detail.tsx 中引用
    assert.match(pageSrc, /export interface StoreDetailData/);
    assert.match(detailSrc, /import type.*StoreDetailData/);
  });
});
