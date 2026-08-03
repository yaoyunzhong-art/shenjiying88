/**
 * alerts/page.test.ts — 告警中心列表页 全量测试
 *
 * 覆盖: 正例(组件导出/数据导出/字段完整性) · 边界(枚举覆盖/Mock完整性) · 防御(空态/边界值)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGE_SRC = resolve(__dirname, 'page.tsx');
const DATA_SRC = resolve(__dirname, 'alerts-data.ts');

function readPage(): string {
  return readFileSync(PAGE_SRC, 'utf-8');
}

function readData(): string {
  return readFileSync(DATA_SRC, 'utf-8');
}

// 正例 — 页面导出与渲染结构
describe('alerts — 正例: 页面导出', () => {
  it('page.tsx 应导出默认组件 AlertListPage', () => {
    const src = readPage();
    assert.ok(src.includes('export default function AlertListPage'), '缺少默认导出组件 AlertListPage');
  });

  it('page.tsx 应包含 \'use client\' 指令', () => {
    const src = readPage();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('page.tsx 应从 @m5/ui 导入 FoundationAlertDemoListPage', () => {
    const src = readPage();
    assert.ok(src.includes('FoundationAlertDemoListPage'), '缺少 FoundationAlertDemoListPage 导入');
  });

  it('page.tsx 应从 @m5/ui 导入 foundationAlertListDemoPresets', () => {
    const src = readPage();
    assert.ok(src.includes('foundationAlertListDemoPresets'), '缺少 foundationAlertListDemoPresets 导入');
  });

  it('page.tsx 使用 foundationAlertListDemoPresets.tob 作为 preset', () => {
    const src = readPage();
    assert.ok(src.includes('foundationAlertListDemoPresets.tob'), '缺少 .tob preset 引用');
  });

  it('page.tsx 传递 title="告警中心" 属性', () => {
    const src = readPage();
    assert.ok(src.includes('title="告警中心"'), '缺少 title="告警中心"');
  });

  it('page.tsx 传递 description 属性', () => {
    const src = readPage();
    assert.ok(src.includes('description'), '缺少 description 属性');
  });

  it('page.tsx 传递 count={50} 属性', () => {
    const src = readPage();
    assert.ok(src.includes('count={50}'), '缺少 count={50}');
  });

  it('page.tsx 传递 detailHrefBase="/alerts" 属性', () => {
    const src = readPage();
    assert.ok(src.includes('detailHrefBase="/alerts"'), '缺少 detailHrefBase="/alerts"');
  });

  it('page.tsx 包含 acknowledgeOptions 配置', () => {
    const src = readPage();
    assert.ok(src.includes('acknowledgeOptions'), '缺少 acknowledgeOptions');
  });

  it('acknowledgeOptions 包含 actionLabel="确认"', () => {
    const src = readPage();
    assert.ok(src.includes('actionLabel: \'确认\''), '缺少 actionLabel 确认');
  });

  it('acknowledgeOptions 包含 successMessage 和 errorMessage', () => {
    const src = readPage();
    assert.ok(src.includes('successMessage'), '缺少 successMessage');
    assert.ok(src.includes('errorMessage'), '缺少 errorMessage');
  });
});

// 正例 — 数据层完整性
describe('alerts — 正例: 数据层', () => {
  it('alerts-data.ts 应导出 Alert 接口', () => {
    const src = readData();
    assert.ok(src.includes('export interface Alert'), '缺少 Alert 接口导出');
  });

  it('alerts-data.ts 应导出 AlertSeverity / AlertStatus / AlertCategory 类型', () => {
    const src = readData();
    assert.ok(src.includes('AlertSeverity'), '缺少 AlertSeverity');
    assert.ok(src.includes('AlertStatus'), '缺少 AlertStatus');
    assert.ok(src.includes('AlertCategory'), '缺少 AlertCategory');
  });

  it('alerts-data.ts 应导出 SEVERITY_LABELS 映射', () => {
    const src = readData();
    assert.ok(src.includes('export const SEVERITY_LABELS'), '缺少 SEVERITY_LABELS');
  });

  it('alerts-data.ts 应导出 SEVERITY_COLORS 映射', () => {
    const src = readData();
    assert.ok(src.includes('export const SEVERITY_COLORS'), '缺少 SEVERITY_COLORS');
  });

  it('alerts-data.ts 应导出 STATUS_LABELS / STATUS_VARIANTS / CATEGORY_LABELS', () => {
    const src = readData();
    assert.ok(src.includes('export const STATUS_LABELS'), '缺少 STATUS_LABELS');
    assert.ok(src.includes('export const STATUS_VARIANTS'), '缺少 STATUS_VARIANTS');
    assert.ok(src.includes('export const CATEGORY_LABELS'), '缺少 CATEGORY_LABELS');
  });

  it('alerts-data.ts 应导出 formatDuration 函数', () => {
    const src = readData();
    assert.ok(src.includes('export function formatDuration'), '缺少 formatDuration 导出');
  });

  it('alerts-data.ts 应导出 MOCK_ALERTS 数据集', () => {
    const src = readData();
    assert.ok(src.includes('export const MOCK_ALERTS'), '缺少 MOCK_ALERTS 导出');
  });

  it('MOCK_ALERTS 至少包含 10 条记录', () => {
    const src = readData();
    const match = src.match(/id:\s*['"]alert-(\d{3})['"]/g);
    assert.ok(match !== null && match.length >= 10, `预期至少 10 条 alert，实际 ${match?.length ?? 0}`);
  });
});

// 边界 — 枚举全覆盖
describe('alerts — 边界: 枚举覆盖', () => {
  it('AlertSeverity 包含 critical / high / medium / low / info', () => {
    const src = readData();
    assert.ok(src.includes("'critical'"), '缺少 critical');
    assert.ok(src.includes("'high'"), '缺少 high');
    assert.ok(src.includes("'medium'"), '缺少 medium');
    assert.ok(src.includes("'low'"), '缺少 low');
    assert.ok(src.includes("'info'"), '缺少 info');
  });

  it('AlertStatus 包含 firing / acknowledged / resolved / silenced', () => {
    const src = readData();
    assert.ok(src.includes("'firing'"), '缺少 firing');
    assert.ok(src.includes("'acknowledged'"), '缺少 acknowledged');
    assert.ok(src.includes("'resolved'"), '缺少 resolved');
    assert.ok(src.includes("'silenced'"), '缺少 silenced');
  });

  it('AlertCategory 包含 infrastructure / application / business / security', () => {
    const src = readData();
    assert.ok(src.includes("'infrastructure'"), '缺少 infrastructure');
    assert.ok(src.includes("'application'"), '缺少 application');
    assert.ok(src.includes("'business'"), '缺少 business');
    assert.ok(src.includes("'security'"), '缺少 security');
  });

  it('SEVERITY_LABELS 覆盖全部 5 个严重等级', () => {
    const src = readData();
    assert.ok(src.includes('critical:'), 'SEVERITY_LABELS 缺少 critical');
    assert.ok(src.includes('high:'), 'SEVERITY_LABELS 缺少 high');
    assert.ok(src.includes('medium:'), 'SEVERITY_LABELS 缺少 medium');
    assert.ok(src.includes('low:'), 'SEVERITY_LABELS 缺少 low');
    assert.ok(src.includes('info:'), 'SEVERITY_LABELS 缺少 info');
  });

  it('SEVERITY_COLORS 覆盖全部 5 个严重等级', () => {
    const src = readData();
    assert.ok(src.includes('critical:'), 'SEVERITY_COLORS 缺少 critical');
    assert.ok(src.includes('high:'), 'SEVERITY_COLORS 缺少 high');
    assert.ok(src.includes('medium:'), 'SEVERITY_COLORS 缺少 medium');
    assert.ok(src.includes('low:'), 'SEVERITY_COLORS 缺少 low');
    assert.ok(src.includes('info:'), 'SEVERITY_COLORS 缺少 info');
  });

  it('STATUS_LABELS 覆盖全部 4 个状态', () => {
    const src = readData();
    assert.ok(src.includes('firing:'), 'STATUS_LABELS 缺少 firing');
    assert.ok(src.includes('acknowledged:'), 'STATUS_LABELS 缺少 acknowledged');
    assert.ok(src.includes('resolved:'), 'STATUS_LABELS 缺少 resolved');
    assert.ok(src.includes('silenced:'), 'STATUS_LABELS 缺少 silenced');
  });

  it('STATUS_VARIANTS 覆盖全部 4 个状态', () => {
    const src = readData();
    assert.ok(src.includes("firing: 'error'"), 'STATUS_VARIANTS 缺少 firing');
    assert.ok(src.includes("acknowledged: 'warning'"), 'STATUS_VARIANTS 缺少 acknowledged');
    assert.ok(src.includes("resolved: 'success'"), 'STATUS_VARIANTS 缺少 resolved');
    assert.ok(src.includes("silenced: 'neutral'"), 'STATUS_VARIANTS 缺少 silenced');
  });

  it('CATEGORY_LABELS 覆盖全部 4 个分类', () => {
    const src = readData();
    assert.ok(src.includes('infrastructure:'), 'CATEGORY_LABELS 缺少 infrastructure');
    assert.ok(src.includes('application:'), 'CATEGORY_LABELS 缺少 application');
    assert.ok(src.includes('business:'), 'CATEGORY_LABELS 缺少 business');
    assert.ok(src.includes('security:'), 'CATEGORY_LABELS 缺少 security');
  });
});

// 边界 — Alert 字段完整性
describe('alerts — 边界: Alert 字段', () => {
  it('Alert 接口包含 id / alertName / severity / status 等核心字段', () => {
    const src = readData();
    const ifaceSrc = src.slice(src.indexOf('export interface Alert'), src.indexOf('export const SEVERITY_LABELS'));
    assert.ok(ifaceSrc.includes('id'), '缺少 id');
    assert.ok(ifaceSrc.includes('alertName'), '缺少 alertName');
    assert.ok(ifaceSrc.includes('severity'), '缺少 severity');
    assert.ok(ifaceSrc.includes('status'), '缺少 status');
    assert.ok(ifaceSrc.includes('message'), '缺少 message');
    assert.ok(ifaceSrc.includes('createdAt'), '缺少 createdAt');
  });

  it('Alert 接口包含可选字段 acknowledgedAt / resolvedAt / duration', () => {
    const src = readData();
    const ifaceSrc = src.slice(src.indexOf('export interface Alert'), src.indexOf('export const SEVERITY_LABELS'));
    assert.ok(ifaceSrc.includes('acknowledgedAt?'), '缺少可选字段 acknowledgedAt');
    assert.ok(ifaceSrc.includes('resolvedAt?'), '缺少可选字段 resolvedAt');
    assert.ok(ifaceSrc.includes('duration?'), '缺少可选字段 duration');
  });

  it('每条 Mock 记录包含 severity/status/category/currentValue/threshold', () => {
    const src = readData();
    const mockArr = src.slice(src.indexOf('MOCK_ALERTS: Alert[]'));
    const ids = [...mockArr.matchAll(/id:\s*['"]alert-\d+['"]/g)];
    assert.ok(ids.length >= 10, `预期 >= 10 条 Mock 记录，找到 ${ids.length}`);
  });

  it('Mock 数据覆盖所有 severity 值', () => {
    const src = readData();
    assert.ok(src.includes("severity: 'critical'"), '缺少 critical 等级 mock');
    assert.ok(src.includes("severity: 'high'"), '缺少 high 等级 mock');
    assert.ok(src.includes("severity: 'medium'"), '缺少 medium 等级 mock');
    assert.ok(src.includes("severity: 'low'"), '缺少 low 等级 mock');
    assert.ok(src.includes("severity: 'info'"), '缺少 info 等级 mock');
  });

  it('Mock 数据覆盖所有 status 值', () => {
    const src = readData();
    assert.ok(src.includes("status: 'firing'"), '缺少 firing 状态 mock');
    assert.ok(src.includes("status: 'acknowledged'"), '缺少 acknowledged 状态 mock');
    assert.ok(src.includes("status: 'resolved'"), '缺少 resolved 状态 mock');
    assert.ok(src.includes("status: 'silenced'"), '缺少 silenced 状态 mock');
  });

  it('Mock 数据覆盖所有 category 值', () => {
    const src = readData();
    assert.ok(src.includes("category: 'infrastructure'"), '缺少 infrastructure 分类');
    assert.ok(src.includes("category: 'application'"), '缺少 application 分类');
    assert.ok(src.includes("category: 'business'"), '缺少 business 分类');
    assert.ok(src.includes("category: 'security'"), '缺少 security 分类');
  });
});

// 防御 — 边界值、格式函数、空态
describe('alerts — 防御: 边界值', () => {
  it('formatDuration 处理 <60 秒返回 "N秒"', () => {
    const src = readData();
    const fnLines = src.split('\n').filter(l => l.includes('seconds < 60'));
    assert.ok(fnLines.length > 0, '缺少 <60 秒分支');
  });

  it('formatDuration 处理 <3600 秒返回 "N分钟"', () => {
    const src = readData();
    const fnLines = src.split('\n').filter(l => l.includes('seconds < 3600'));
    assert.ok(fnLines.length > 0, '缺少 <3600 秒分支');
  });

  it('formatDuration 处理 <86400 秒返回 "N小时"', () => {
    const src = readData();
    const fnLines = src.split('\n').filter(l => l.includes('seconds < 86400'));
    assert.ok(fnLines.length > 0, '缺少 <86400 秒分支');
  });

  it('formatDuration 处理 >=86400 秒返回 "N天N小时"', () => {
    const src = readData();
    const fnLines = src.split('\n').filter(l => l.includes('86400'));
    assert.ok(fnLines.length > 0, '缺少 >=86400 秒分支');
  });

  it('formatDuration 使用 Math.floor 做整数除法', () => {
    const src = readData();
    assert.ok(src.includes('Math.floor(seconds'), '缺少 Math.floor 处理');
  });

  it('Alert 的 duration 字段应为可选', () => {
    const src = readData();
    const ifaceAlert = src.slice(src.indexOf('export interface Alert'), src.indexOf('}'));
    assert.ok(ifaceAlert.includes('duration?:'), 'duration 不是可选字段');
  });

  it('SEVERITY_BG 覆盖全部 5 个等级', () => {
    const src = readData();
    assert.ok(src.includes('export const SEVERITY_BG'), '缺少 SEVERITY_BG');
    assert.ok(src.includes("critical: 'rgba"), 'SEVERITY_BG 缺少 critical');
    assert.ok(src.includes("high: 'rgba"), 'SEVERITY_BG 缺少 high');
    assert.ok(src.includes("medium: 'rgba"), 'SEVERITY_BG 缺少 medium');
    assert.ok(src.includes("low: 'rgba"), 'SEVERITY_BG 缺少 low');
    assert.ok(src.includes("info: 'rgba"), 'SEVERITY_BG 缺少 info');
  });
});

// 防御 — 空态与加载过渡
describe('alerts — 防御: 页码安全', () => {
  it('page.tsx 使用 {50} 作为 count 常量', () => {
    const src = readPage();
    assert.ok(src.includes('{50}'), '缺少 count 定义');
  });

  it('page.tsx 使用 foundationAlertListDemoPresets.tob 作为 preset', () => {
    const src = readPage();
    assert.ok(src.includes('.tob'), '缺少 .tob 属性');
  });

  it('Page Shell 使用 title 中文 告警中心', () => {
    const src = readPage();
    assert.ok(src.includes('告警中心'), '缺少 告警中心 标题');
  });

  it('Page Shell 使用 description 中文描述', () => {
    const src = readPage();
    assert.ok(src.includes('告警'), '缺少 告警 关键词');
  });
});
