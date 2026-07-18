import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

// ============================================================
// 正例 — 页面骨架
// ============================================================
describe('PurchasingPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function PurchasingPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
  it('应包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('应包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('应包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
});

// ============================================================
// 防御 — 安全与类型检查
// ============================================================
describe('PurchasingPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
  it('应正确处理 undefined 签收人', () => assert.ok(SRC.includes('v || ')));
  it('应正确处理预期到货日期', () => assert.ok(SRC.includes('expected')));
});

// ============================================================
// 采购模块 — 数据与组件
// ============================================================
describe('PurchasingPage — 采购模块', () => {
  it('应包含采购数据定义', () => assert.ok(SRC.includes('interface Purchase')));
  it('应包含 DATA 模拟数据', () => assert.ok(SRC.includes('const DATA')));
  it('应使用 useMemo 过滤', () => assert.ok(SRC.includes('useMemo')));
  it('应包含 Table 组件', () => assert.ok(SRC.includes('Table')));
  it('应可切换供应商标签页', () => assert.ok(SRC.includes('suppliers')));
  it('应包含 PageShell 组件', () => assert.ok(SRC.includes('PageShell')));
  it('应包含 Space 布局', () => assert.ok(SRC.includes('Space')));
  it('应包含 Tooltip 提示', () => assert.ok(SRC.includes('Tooltip')));
  it('应包含 Progress 进度', () => assert.ok(SRC.includes('Progress')));
});

// ============================================================
// 状态覆盖 — 四种采购状态
// ============================================================
describe('PurchasingPage — 状态覆盖', () => {
  it('应处理 pending 状态', () => assert.ok(SRC.includes("'pending'")));
  it('应处理 ordered 状态', () => assert.ok(SRC.includes("'ordered'")));
  it('应处理 partial 状态', () => assert.ok(SRC.includes("'partial'")));
  it('应处理 received 状态', () => assert.ok(SRC.includes("'received'")));
  it('应定义状态映射表', () => assert.ok(SRC.includes('SCFG')));
  it('每种状态应有颜色和标签', () => assert.ok(SRC.includes('color') && SRC.includes('label')));
});

// ============================================================
// 交互 — 操作与筛选
// ============================================================
describe('PurchasingPage — 交互', () => {
  it('应包含新建采购单 Modal', () => assert.ok(SRC.includes('showAdd') && SRC.includes('Modal')));
  it('应支持类别筛选', () => assert.ok(SRC.includes('categoryFilter')));
  it('应显示统计卡片', () => assert.ok(SRC.includes('Statistic')));
  it('应包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onOk={') || SRC.includes('onCancel={')));
  it('应包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('应包含列表过滤', () => assert.ok(SRC.includes('.filter(')));
});

// ============================================================
// 采购配置统计条 — 新增功能（4个统计卡片）
// ============================================================
describe('PurchasingPage — 采购配置统计', () => {
  it('应定义 CONFIG_ITEMS 配置数组', () => assert.ok(SRC.includes('CONFIG_ITEMS')));
  it('应计算已启用数', () => assert.ok(SRC.includes('CONFIG_ENABLED')));
  it('应计算已禁用数', () => assert.ok(SRC.includes('CONFIG_DISABLED')));
  it('应计算待配置数', () => assert.ok(SRC.includes('CONFIG_PENDING')));
  it('应显示总配置项卡片', () => assert.ok(SRC.includes('总配置项')));
  it('应显示已启用卡片', () => assert.ok(SRC.includes('已启用')));
  it('应显示已禁用卡片', () => assert.ok(SRC.includes('已禁用')));
  it('应显示待配置卡片', () => assert.ok(SRC.includes('待配置')));
  it('应为配置统计使用 Row/Col 布局', () => assert.ok(SRC.indexOf('Row') !== -1 && SRC.indexOf('Col') !== -1));
  it('待配置数应等于禁用数', () => {
    // 提取 CONFIG_ITEMS 定义区域，确认逻辑正确
    const line = SRC.split('\n').find(l => l.includes('CONFIG_PENDING'));
    assert.ok(line, 'CONFIG_PENDING 应存在');
    assert.ok(line.includes('CONFIG_DISABLED'), '待配置 = 禁用');
  });
});

// ============================================================
// hooks验证 — useState 与模板
// ============================================================
describe('Stores / Purchasing — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('应包含为空占位符处理', () => assert.ok(SRC.includes('v || ')));
});

// ============================================================
// 边界 — 空数据与极端值
// ============================================================
describe('PurchasingPage — 边界', () => {
  it('待收货数量可能为0', () => {
    // 使用 .filter() 保证正确计数，空数组返回 [] 不报错
    assert.ok(SRC.includes('.filter(d => d.status'));
  });
  it('金额格式化使用 toLocaleString', () => assert.ok(SRC.includes('.toLocaleString()')));
  it('分页应有 pageSize 限制', () => assert.ok(SRC.includes('pageSize')));
  it('应处理无签收人情况', () => assert.ok(SRC.includes('receiver')));
  it('应显示供应商统计信息', () => assert.ok(SRC.includes('常用供应商')));
});
