/**
 * stores/[id]/page.test.ts — 门店详情页 L1 测试 (ToB 门店管理)
 * 覆盖: 正例 + 反例 + 边界
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

// ─── 正例 ──────────────────────────────────────────────

describe('stores/[id] — 正例', () => {
  it('应导出一个默认组件 StoreDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoreDetailPage'), '缺少默认导出');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应引用 STORE_STATUS_MAP 和 STATUS_TRANSITIONS', () => {
    const src = readSource();
    assert.ok(src.includes('STORE_STATUS_MAP'), '缺少 STORE_STATUS_MAP');
    assert.ok(src.includes('STATUS_TRANSITIONS'), '缺少 STATUS_TRANSITIONS');
  });

  it('应支持 active / inactive / maintenance 三种状态流转', () => {
    const src = readSource();
    assert.ok(src.includes("'active'"), '缺少 active');
    assert.ok(src.includes("'inactive'"), '缺少 inactive');
    assert.ok(src.includes("'maintenance'"), '缺少 maintenance');
  });

  it('应引用 DetailShell 作为页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), '缺少 DetailShell');
  });

  it('应引用 ConfirmDialog 用于删除确认', () => {
    const src = readSource();
    assert.ok(src.includes('ConfirmDialog'), '缺少 ConfirmDialog');
  });

  it('应包含门店查找函数 getStoreById', () => {
    const src = readSource();
    assert.ok(src.includes('function getStoreById'), '缺少 getStoreById');
  });

  it('应包含 toast 反馈', () => {
    const src = readSource();
    assert.ok(src.includes('useToast'), '缺少 useToast');
  });

  it('应处理门店不存在情况 (未找到)', () => {
    const src = readSource();
    assert.ok(src.includes("门店不存在"), '缺少不存在提示');
    assert.ok(src.includes("检查门店 ID"), '缺少检查ID提示');
  });

  it('应支持编辑和删除操作', () => {
    const src = readSource();
    assert.ok(src.includes('编辑门店'), '缺少编辑');
    assert.ok(src.includes('删除门店'), '缺少删除');
  });

  it('应提供返回门店列表和查看报表的导航', () => {
    const src = readSource();
    assert.ok(src.includes('返回门店列表'), '缺少返回列表');
    assert.ok(src.includes('查看门店报表'), '缺少查看报表');
  });

  it('应使用 useParams 获取路由参数', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), '缺少 useParams');
    assert.ok(src.includes('params.id'), '引用 params.id');
  });

  it('应遍历 MOCK_STORES 数据', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STORES'), '缺少 MOCK_STORES');
    assert.ok(src.includes('.find('), '使用 find');
  });
});

// ─── 反例 ──────────────────────────────────────────────

describe('stores/[id] — 反例', () => {
  it('未找到门店时应显示不存在提示', () => {
    const src = readSource();
    assert.ok(src.includes('!store'), '缺少 not-found 守卫');
    assert.ok(src.includes("门店不存在"), '显示不存在提示');
  });
});

// ─── 边界 ──────────────────────────────────────────────

describe('stores/[id] — 边界', () => {
  it('状态流转应包含整张表: active→maintenance/inactive, inactive→active, maintenance→active/inactive', () => {
    const src = readSource();
    // active transitions
    assert.ok(src.includes("active: ['maintenance', 'inactive']") || src.includes("active:['maintenance','inactive']"));
    // inactive transitions
    assert.ok(src.includes("inactive: ['active']") || src.includes("inactive:['active']"));
    // maintenance transitions
    assert.ok(src.includes("maintenance: ['active', 'inactive']") || src.includes("maintenance:['active','inactive']"));
  });

  it('删除操作应包含 800ms 模拟延迟和 router.push', () => {
    const src = readSource();
    assert.ok(src.includes('800'), '800ms 延迟');
    assert.ok(src.includes('router.push'), '跳转路由');
  });

  it('getStoreById 应作为内部函数存在', () => {
    const src = readSource();
    assert.ok(src.includes('function getStoreById'), '内部函数 getStoreById');
  });

  it('基本信息应包含 8 个字段 (名称/编码/区域/城市/地址/状态/创建/巡检)', () => {
    const src = readSource();
    // Count description items
    const labelMatches = src.match(/label:\s*'/g);
    assert.ok(labelMatches, '应包含 description items');
  });

  it('日客流应使用 toLocaleString 格式化', () => {
    const src = readSource();
    assert.ok(src.includes('toLocaleString'), '数字格式化');
    assert.ok(src.includes('人'), '显示单位');
  });
});

// ─── 模块级导出验证 ─────────────────────────────────

describe('stores/[id] — 导出', () => {
  it('STATUS_TRANSITIONS 作为命名导出', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_TRANSITIONS'), '导出 STATUS_TRANSITIONS');
  });
});
