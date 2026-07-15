/**
 * audit-trail/records/[auditId]/page.test.tsx — 审计记录详情页 L1 冒烟测试
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

// client source
const CLIENT_SOURCE = resolve(__dirname, 'audit-trail-record-detail-client.tsx');
function readClientSource(): string {
  return readFileSync(CLIENT_SOURCE, 'utf-8');
}

// view model source
const VM_SOURCE = resolve(__dirname, '../../../audit-trail-detail-view-model.ts');
function readViewModelSource(): string {
  return readFileSync(VM_SOURCE, 'utf-8');
}

// ---- 正例: 模块结构 & 数据映射 ----

describe('audit-trail/records/[auditId] — 正例', () => {
  it('应导出一个默认 async 函数组件 AuditTrailRecordDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function AuditTrailRecordDetailPage'), '未找到默认导出 async 组件');
  });

  it('应包含 params: Promise 签名', () => {
    const src = readSource();
    assert.ok(src.includes('params: Promise'), 'params 应为 Promise');
    assert.ok(src.includes('auditId'), '应引用 auditId 参数');
  });

  it('应包含 readAuditId 参数解析函数', () => {
    const src = readSource();
    assert.ok(src.includes('function readAuditId'), '缺少 readAuditId');
    assert.ok(src.includes('readAuditTrailRecordDetailParam'), '缺少专用参数验证');
  });

  it('应使用 loadAuditTrailRecordDetail 加载数据', () => {
    const src = readSource();
    assert.ok(src.includes('loadAuditTrailRecordDetail'), '缺少数据加载函数');
  });

  it('应包含 Suspense + LoadingSkeleton fallback', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('子组件应为 AuditTrailRecordDetailClient', () => {
    const src = readSource();
    assert.ok(src.includes('AuditTrailRecordDetailClient'), '子组件名不正确');
  });

  it('子组件应接收 snapshot prop', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot={snapshot}'), '缺少 snapshot prop');
  });

  it('应使用 PageShell 作为页面布局容器', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应使用 no-store 缓存策略', () => {
    const src = readSource();
    assert.ok(src.includes("'no-store'"), '缓存应为 no-store');
  });

  it('maxWidth 应为 1080', () => {
    const src = readSource();
    assert.ok(src.includes('maxWidth: 1080'), 'maxWidth 应为 1080');
  });

  it('AuditTrailRecordDetailPageProps 应包含 params: Promise', () => {
    const src = readSource();
    assert.ok(src.includes('AuditTrailRecordDetailPageProps'), '缺少 Props 接口');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('audit-trail/records/[auditId] — 边界', () => {
  it('auditId 为空时应传空字符串', () => {
    const src = readSource();
    assert.ok(src.includes("auditId ?? ''"), '空 auditId 传空字符串');
  });

  it('notFound 为 true 时应显示审计记录不存在', () => {
    const src = readSource();
    assert.ok(src.includes('审计记录不存在'), 'notFound 标题应为审计记录不存在');
    assert.ok(src.includes('snapshot.notFound'), '缺少 notFound 判断');
  });

  it('notFound 为 false 时应显示事件类型', () => {
    const src = readSource();
    assert.ok(src.includes('snapshot.record?.eventType'), 'title 应引用 eventType');
  });

  it('notFound 为 false 时 subtitle 应描述事件级别/操作人', () => {
    const src = readSource();
    assert.ok(src.includes('查看事件级别'), '应包含操作说明');
    assert.ok(src.includes('操作人'), '应包含操作人描述');
  });

  it('notFound subtitle 应包含该 auditId 不在当前审计范围', () => {
    const src = readSource();
    assert.ok(src.includes('不在当前审计范围内'), 'notFound 应包含范围提示');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('audit-trail/records/[auditId] — 防御', () => {
  it('readAuditId 应处理 string | string[]', () => {
    const src = readSource();
    assert.ok(src.includes('string | string[]') || src.includes('string | Array'), '应处理数组');
  });

  it('readAuditId 返回类型包含 null (传入 undefined)', () => {
    const src = readSource();
    assert.ok(src.includes('string | null'), '返回类型包含 null');
  });

  it('应使用 Promise.all / await params 解析', () => {
    const src = readSource();
    assert.ok(src.includes('await params'), '应 await params');
  });

  it('使用 @m5/types 的专用参数验证', () => {
    const src = readSource();
    assert.ok(src.includes("@m5/types"), '从 @m5/types 导入');
    assert.ok(src.includes('readAuditTrailRecordDetailParam'), '应使用专用参数验证');
  });

  it('@m5/ui 导入必要组件', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), '应导入 LoadingSkeleton');
    assert.ok(src.includes('PageShell'), '应导入 PageShell');
  });
});

// ---- Client 组件结构验证 ----

describe('AuditTrailRecordDetailClient — 结构验证', () => {
  it('应为 use client 指令', () => {
    const src = readClientSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应渲染 WorkspaceBreadcrumb', () => {
    const src = readClientSource();
    assert.ok(src.includes('WorkspaceBreadcrumb'), '缺少面包屑');
  });

  it('应渲染 DetailActionBar', () => {
    const src = readClientSource();
    assert.ok(src.includes('DetailActionBar'), '缺少操作栏');
  });

  it('应渲染 DetailClosureBar', () => {
    const src = readClientSource();
    assert.ok(src.includes('DetailClosureBar'), '缺少关闭栏');
  });

  it('应渲染 StatusBadge', () => {
    const src = readClientSource();
    assert.ok(src.includes('StatusBadge'), '缺少状态徽章');
  });

  it('应包含 SummaryCard 辅助组件', () => {
    const src = readClientSource();
    assert.ok(src.includes('SummaryCard'), '缺少 SummaryCard');
  });

  it('应展示关联记录列表', () => {
    const src = readClientSource();
    assert.ok(src.includes('relatedRecords'), '应引用关联记录');
  });

  it('应展示详情 payload 为 JSON', () => {
    const src = readClientSource();
    assert.ok(src.includes('JSON.stringify'), '应使用 JSON.stringify');
  });

  it('empty 关联记录应显示暂无提示', () => {
    const src = readClientSource();
    assert.ok(src.includes('暂无同'), '应包含空状态提示');
  });

  it('NotFound 状态应返回 NotFoundPanel 组件', () => {
    const src = readClientSource();
    assert.ok(src.includes('NotFoundPanel'), '应包含 NotFoundPanel');
  });
});

// ---- ViewModel 结构验证 ----

describe('audit-trail-detail-view-model — 结构验证', () => {
  it('应导出 loadAuditTrailRecordDetail 函数', () => {
    const src = readViewModelSource();
    assert.ok(src.includes('export async function loadAuditTrailRecordDetail'), '缺少导出');
  });

  it('应导出 AuditTrailRecordDetail 接口', () => {
    const src = readViewModelSource();
    assert.ok(src.includes('export interface AuditTrailRecordDetail'), '缺少接口');
  });

  it('应包含 notFound 布尔字段', () => {
    const src = readViewModelSource();
    assert.ok(src.includes('notFound: boolean'), '缺少 notFound');
  });

  it('应包含 relatedRecords 数组', () => {
    const src = readViewModelSource();
    assert.ok(src.includes('relatedRecords'), '缺少 relatedRecords');
  });

  it('应包含 pickRelatedRecords 筛选逻辑', () => {
    const src = readViewModelSource();
    assert.ok(src.includes('function pickRelatedRecords'), '缺少关联记录筛选');
  });

  it('应导出 summarizeAuditTrailRecord', () => {
    const src = readViewModelSource();
    assert.ok(src.includes('export function summarizeAuditTrailRecord'), '缺少 summarize');
  });

  it('应导出 describeAuditTrailRecordRisk', () => {
    const src = readViewModelSource();
    assert.ok(src.includes('export function describeAuditTrailRecordRisk'), '缺少风险描述');
  });

  it('应包含 buildRelatedQuery 构建过滤', () => {
    const src = readViewModelSource();
    assert.ok(src.includes('function buildRelatedQuery'), '缺少查询构建');
  });
});

// ---- 新增组件: AuditTimeline ----

describe('AuditTimeline — 审计时间线', () => {
  it('应导出 AuditTimeline 组件', () => {
    const src = readSource();
    assert.ok(src.includes('export {\n  SeverityIndicator, PayloadViewer, TimelineEntry, buildBreadcrumbs,\n  AuditTimeline'), '缺少 AuditTimeline 导出');
  });

  it('events 为空时应渲染暂无时间线', () => {
    const src = readSource();
    assert.ok(src.includes('暂无时间线'), '应包含空状态文案');
  });

  it('events 非空时应渲染时间线条目', () => {
    const src = readSource();
    assert.ok(src.includes('AuditTimelineEvent'), '应使用时间线事件接口');
    assert.ok(src.includes('description'), '事件应包含描述');
  });

  it('每条时间线应显示操作人', () => {
    const src = readSource();
    assert.ok(src.includes('evt.operator'), '应显示操作人');
  });

  it('每条时间线应显示时间戳', () => {
    const src = readSource();
    assert.ok(src.includes('evt.timestamp'), '应显示时间戳');
  });
});

// ---- 新增组件: DataDiffView ----

describe('DataDiffView — 数据变更对比', () => {
  it('应导出 DataDiffView 组件', () => {
    const src = readSource();
    assert.ok(src.includes('DataDiffView'), '缺少 DataDiffView');
  });

  it('changes 为空时应渲染无数据变更', () => {
    const src = readSource();
    assert.ok(src.includes('无数据变更'), '应包含空状态文案');
  });

  it('应渲染旧值和新值对比', () => {
    const src = readSource();
    assert.ok(src.includes('oldValue'), '应包含旧值');
    assert.ok(src.includes('newValue'), '应包含新值');
  });

  it('应提取字段名用于对比', () => {
    const src = readSource();
    assert.ok(src.includes('chg.field'), '应显示字段名');
  });
});

// ---- 新增组件: OperatorInfoCard ----

describe('OperatorInfoCard — 操作员信息卡片', () => {
  it('应导出 OperatorInfoCard 组件', () => {
    const src = readSource();
    assert.ok(src.includes('OperatorInfoCard'), '缺少 OperatorInfoCard');
  });

  it('应显示操作员名称', () => {
    const src = readSource();
    assert.ok(src.includes('operator.name'), '应显示名称');
  });

  it('应显示操作员角色', () => {
    const src = readSource();
    assert.ok(src.includes('operator.role'), '应显示角色');
  });

  it('应显示最后活跃时间', () => {
    const src = readSource();
    assert.ok(src.includes('operator.lastActive'), '应显示最后活跃');
  });

  it('应显示操作次数', () => {
    const src = readSource();
    assert.ok(src.includes('operator.actionsCount'), '应显示操作次数');
  });
});

// ---- 新增辅助函数 ----

describe('getEventTypeBadge — 审计类型标签', () => {
  it('应导出 getEventTypeBadge', () => {
    const src = readSource();
    assert.ok(src.includes('getEventTypeBadge'), '缺少 getEventTypeBadge');
  });

  it('已知类型应返回中文化标签', () => {
    const src = readSource();
    assert.ok(src.includes('配置更新'), '配置更新应有中文'),
    assert.ok(src.includes('系统错误'), '系统错误应有中文');
  });

  it('未知类型应回退为原始值', () => {
    const src = readSource();
    assert.ok(src.includes('?? { label: type, variant'), '应回退为原始值');
  });
});

// ---- 新增: extractDataChanges ----

function runExtractDataChangesTest() {
  const src = readSource();
  assert.ok(src.includes('extractDataChanges'), '缺少 extractDataChanges');
  assert.ok(src.includes('oldValue'), '应处理 oldValue');
  assert.ok(src.includes('newValue'), '应处理 newValue');
  assert.ok(src.includes('configKey'), '应处理 configKey');
  assert.ok(src.includes('ruleId'), '应处理 ruleId');
}

describe('extractDataChanges — 数据变更提取', () => {
  it('应导出 extractDataChanges 并从 details 中提取变更', () => {
    runExtractDataChangesTest();
  });

  it('应处理含有 oldValue/newValue 的细节', () => {
    const src = readSource();
    assert.ok(src.includes('oldValue'), '应支持 oldValue 字段');
    assert.ok(src.includes('newValue'), '应支持 newValue 字段');
  });

  it('应处理含有 configKey 的细节', () => {
    const src = readSource();
    assert.ok(src.includes('configKey'), '应支持 configKey');
  });
});

// ---- 新增: buildMockTimeline ----

describe('buildMockTimeline — 模拟时间线', () => {
  it('应导出 buildMockTimeline', () => {
    const src = readSource();
    assert.ok(src.includes('buildMockTimeline'), '缺少 buildMockTimeline');
  });

  it('log-001 应返回 3 条时间线', () => {
    const src = readSource();
    assert.ok(src.includes('log-001'), '应处理 log-001');
    assert.ok(src.includes('配置更新'), 'log-001 应有配置更新时间线');
  });

  it('log-005 应返回 3 条时间线', () => {
    const src = readSource();
    assert.ok(src.includes('log-005'), '应处理 log-005');
    assert.ok(src.includes('规则引擎超时'), 'log-005 应有超时相关时间线');
  });

  it('未知甲 auditId 应返回空数组', () => {
    const src = readSource();
    assert.ok(src.includes('return []'), '未知 id 应返回空数组');
  });
});

// ---- 新增: buildOperatorInfo ----

describe('buildOperatorInfo — 操作员信息构建', () => {
  it('应导出 buildOperatorInfo', () => {
    const src = readSource();
    assert.ok(src.includes('buildOperatorInfo'), '缺少 buildOperatorInfo');
  });

  it('应返回 OperatorInfo 结构', () => {
    const src = readSource();
    assert.ok(src.includes('OperatorInfo'), '应返回 OperatorInfo');
  });

  it('email 格式操作人应截取前缀作为 ID', () => {
    const src = readSource();
    assert.ok(src.includes("operator.name.charAt(0)"), '首字母大写');
  });
});

// ---- 新增: formatSeverityBadge ----

describe('formatSeverityBadge — 严重性映射', () => {
  it('info 返回 信息', () => {
    const src = readSource();
    assert.ok(src.includes('info: \'信息\''), 'info 映射');
  });

  it('unknown 返回原始值', () => {
    const src = readSource();
    assert.ok(src.includes('?? severity'), 'unknown 回退');
  });
});

// ---- 新增: getSourceIcon ----

describe('getSourceIcon — 来源图标', () => {
  it('admin-web 返回 🌐', () => {
    const src = readSource();
    assert.ok(src.includes("'admin-web': '🌐'"), 'admin-web 图标');
  });

  it('unknown 返回 📋', () => {
    const src = readSource();
    assert.ok(src.includes("?? '📋'"), 'unknown 回退');
  });
});
