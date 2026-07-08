/**
 * audit-logs/[id]/page.test.tsx — 审计日志详情页 L1 冒烟测试
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

// ---- 正例 ----

describe('audit-logs/[id] — 正例', () => {
  it('应导出一个默认组件 AuditLogDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AuditLogDetailPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useParams 获取日志ID', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), '缺少 useParams');
    assert.ok(src.includes('params.id'), '缺少 params.id 取值');
  });

  it('应包含 getLogById 查找函数', () => {
    const src = readSource();
    assert.ok(src.includes('getLogById'), '缺少 getLogById');
  });

  it('应包含 MOCK_AUDIT_LOGS 数据集引用', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_AUDIT_LOGS'), '缺少 MOCK_AUDIT_LOGS 引用');
  });

  it('应展示基本信息 (DescriptionList + basicInfoItems)', () => {
    const src = readSource();
    assert.ok(src.includes('basicInfoItems'), '缺少 basicInfoItems');
    assert.ok(src.includes('DescriptionList'), '缺少 DescriptionList');
  });

  it('应展示操作人信息 (actorInfoItems)', () => {
    const src = readSource();
    assert.ok(src.includes('actorInfoItems'), '缺少 actorInfoItems');
    assert.ok(src.includes('操作人信息'), '缺少操作人信息标题');
  });

  it('应展示请求信息 (requestInfoItems)', () => {
    const src = readSource();
    assert.ok(src.includes('requestInfoItems'), '缺少 requestInfoItems');
    assert.ok(src.includes('请求信息'), '缺少请求信息标题');
  });

  it('应展示响应信息 (responseInfoItems)', () => {
    const src = readSource();
    assert.ok(src.includes('responseInfoItems'), '缺少 responseInfoItems');
    assert.ok(src.includes('响应信息'), '缺少响应信息标题');
  });

  it('应展示变更内容 (changes list)', () => {
    const src = readSource();
    assert.ok(src.includes('changes'), '缺少 changes 字段');
    assert.ok(src.includes('变更内容'), '缺少变更内容标题');
  });
});

// ---- 边界 ----

describe('audit-logs/[id] — 边界', () => {
  it('日志不存在时显示空状态和返回链接', () => {
    const src = readSource();
    assert.ok(src.includes('日志不存在'), '缺少日志不存在空状态');
    assert.ok(src.includes('/audit-logs'), '缺少返回列表链接');
  });

  it('应展示关联信息 (tenant/store) 区块（有条件渲染）', () => {
    const src = readSource();
    assert.ok(src.includes('tenant') && src.includes('store'), '缺少 tenant/store');
    assert.ok(src.includes('关联信息'), '缺少关联信息标题');
  });

  it('请求体 body 应有条件渲染', () => {
    const src = readSource();
    assert.ok(src.includes('request?.body') || src.includes('request.body'), '缺少请求体条件渲染');
  });

  it('变更内容 oldValue 应显示 (空) 占位符', () => {
    const src = readSource();
    assert.ok(src.includes('(空)'), '缺少 (空) 占位符');
  });

  it('变更 oldValue→newValue 应有 → 箭头分隔', () => {
    const src = readSource();
    assert.ok(src.includes('→'), '缺少 → 箭头');
  });

  it('响应耗时超过 1000ms 应有橙黄高亮', () => {
    const src = readSource();
    assert.ok(src.includes('#f97316'), '缺少超时高亮颜色');
    assert.ok(src.includes('1000'), '缺少 1000ms 阈值判断');
  });

  it('UserAgent 超过一定长度应不破坏布局', () => {
    const src = readSource();
    assert.ok(src.includes('wordBreak') || src.includes('word-break'), '缺少 wordBreak 样式');
  });
});

// ---- 防御 ----

describe('audit-logs/[id] — 防御', () => {
  it('应使用 useState 管理日志状态', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('应使用 StatusBadge 和 Badge 组件', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
    assert.ok(src.includes('Badge'), '缺少 Badge');
  });

  it('应使用 DescriptionList 组件展示详情', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionList'), '缺少 DescriptionList');
  });

  it('严重级别颜色应从 SEVERITY_COLORS 读取', () => {
    const src = readSource();
    assert.ok(src.includes('SEVERITY_COLORS'), '缺少 SEVERITY_COLORS');
    assert.ok(src.includes('severityColor'), '缺少 severityColor');
  });

  it('状态标签应从 STATUS_VARIANTS/STATUS_LABELS 读取', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_VARIANTS'), '缺少 STATUS_VARIANTS');
    assert.ok(src.includes('STATUS_LABELS'), '缺少 STATUS_LABELS');
  });

  it('日志编号以 code 标签高亮显示', () => {
    const src = readSource();
    assert.ok(src.includes('logCode'), '缺少 logCode');
    assert.ok(src.includes('#60a5fa'), '缺少 code 高亮颜色');
  });

  it('返回按钮应链接到 /audit-logs', () => {
    const src = readSource();
    assert.ok(src.includes('/audit-logs') && src.includes('返回日志列表'), '缺少返回日志列表按钮');
  });

  it('操作时间使用 toLocaleString zh-CN', () => {
    const src = readSource();
    assert.ok(src.includes("toLocaleString('zh-CN')") || src.includes('toLocaleString'), '缺少中文时间格式化');
  });

  it('响应码 >= 400 显示红色', () => {
    const src = readSource();
    assert.ok(src.includes('#ef4444') || src.includes('#ef4444'), '缺少错误码红色');
  });

  it('响应码 < 400 显示绿色', () => {
    const src = readSource();
    assert.ok(src.includes('#4ade80') || src.includes('#4ade80'), '缺少成功码绿色');
  });
});
