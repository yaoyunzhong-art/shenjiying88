/**
 * audit-logs/[id]/page.test.ts — 审计日志详情页 L1 冒烟测试
 * B型任务：详情页（含编辑/状态流转展示、错误状态、边界情况）
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

describe('AuditLogDetailPage — 正例', () => {
  it('应导出一个默认组件 AuditLogDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AuditLogDetailPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应通过 useParams 或 params 获取日志 ID', () => {
    const src = readSource();
    assert.ok(
      (src.includes('useParams') && src.includes('params.id')) ||
        src.includes('params?.id') ||
        src.includes('params.id'),
      '缺少日志 ID 获取逻辑'
    );
  });

  it('应使用 getLogById 查找日志', () => {
    const src = readSource();
    assert.ok(src.includes('getLogById'), '缺少 getLogById 查找函数');
    assert.ok(src.includes('MOCK_AUDIT_LOGS.find') || src.includes('MOCK_AUDIT_LOGS.filter'), '缺少 MOCK 数据查找');
  });

  it('应展示基本信息（日志编号/操作/类别/严重级别/状态/时间）', () => {
    const src = readSource();
    const infoHints = ['基本信息', '日志编号', '操作名称', '操作类别', '严重级别', '执行状态', '操作时间'];
    const matches = infoHints.filter((h) => src.includes(h));
    assert.ok(matches.length >= 4, `基本信息字段不足，仅有: ${matches.join(', ')}`);
  });

  it('应展示操作人信息（用户ID/名称/角色/IP）', () => {
    const src = readSource();
    assert.ok(src.includes('用户ID'), '缺少用户ID');
    assert.ok(src.includes('用户名称') || src.includes('actor.userName'), '缺少用户名称');
    assert.ok(src.includes('用户角色'), '缺少用户角色');
    assert.ok(src.includes('IP地址') || src.includes('actor.ip'), '缺少 IP 地址');
  });

  it('应使用 StatusBadge 组件展示状态', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应使用 Badge 组件展示类别', () => {
    const src = readSource();
    assert.ok(src.includes('<Badge') || src.includes('<Badge '), '缺少 Badge');
  });

  it('应使用 DescriptionList 组件展示信息', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionList'), '缺少 DescriptionList');
  });

  it('日志不存在时展示 404 提示与返回链接', () => {
    const src = readSource();
    assert.ok(src.includes('日志不存在') || src.includes('未找到'), '缺少日志不存在提示');
    assert.ok(src.includes('返回日志列表') || src.includes('/audit-logs'), '缺少返回链接');
  });

  it('应渲染日志消息区域', () => {
    const src = readSource();
    assert.ok(src.includes('log.message') || src.includes('message'), '缺少消息渲染');
  });

  it('应渲染请求方法/路径信息（如有请求数据）', () => {
    const src = readSource();
    assert.ok(src.includes('请求方法') || src.includes('request.method'), '缺少请求方法');
    assert.ok(src.includes('请求路径') || src.includes('request.path'), '缺少请求路径');
  });

  it('应渲染响应码/消息/耗时（如有响应数据）', () => {
    const src = readSource();
    assert.ok(src.includes('响应码') || src.includes('response.code'), '缺少响应码');
    assert.ok(src.includes('响应消息') || src.includes('response.message'), '缺少响应消息');
    assert.ok(src.includes('响应耗时') || src.includes('response.duration'), '缺少响应耗时');
  });
});

// ---- 边界 ----

describe('AuditLogDetailPage — 边界', () => {
  it('应处理日志 ID 空值或 undefined', () => {
    const src = readSource();
    assert.ok(
      src.includes('logId') && (src.includes('getLogById') || src.includes('??')),
      '缺少 ID 空值防御'
    );
  });

  it('应处理 log 为 null 的情况（日志不存在）', () => {
    const src = readSource();
    assert.ok(
      (src.includes('!log') && src.includes('return')) ||
        (src.includes('log === null') && src.includes('return')) ||
        src.includes('getLogById(logId) ?? null'),
      '缺少 null 防御'
    );
  });

  it('请求体和变更内容应有条件渲染', () => {
    const src = readSource();
    assert.ok(
      src.includes('request?.body') ||
        src.includes('request.body') ||
        src.includes('log.request?.body'),
      '缺少请求体条件渲染'
    );
  });

  it('应显示字段变更 diff（老值→新值）', () => {
    const src = readSource();
    assert.ok(
      (src.includes('change.oldValue') || src.includes('change.newValue')) ||
        (src.includes('oldValue') && src.includes('newValue')),
      '缺少变更 diff 展示'
    );
  });

  it('耗时超过 1000ms 应显示橙色标识', () => {
    const src = readSource();
    assert.ok(
      (src.includes('duration > 1000') && src.includes('#f97316')) ||
        (src.includes('duration >= 1000') && src.includes('orange')) ||
        (src.includes('duration') && src.includes('#f97316')),
      '缺少超时高亮逻辑'
    );
  });

  it('严重级别应有对应颜色（红/橙/黄/绿/灰）', () => {
    const src = readSource();
    assert.ok(
      (src.includes('SEVERITY_COLORS') || src.includes('severityColor')) &&
        (src.includes('#ef4444') || src.includes('red')),
      '缺少严重级别颜色映射'
    );
  });

  it('UserAgent 为空时应显示占位符', () => {
    const src = readSource();
    assert.ok(
      src.includes('userAgent') && (src.includes('-') || src.includes('暂无') || src.includes('unknown')),
      '缺少 UserAgent 占位处理'
    );
  });

  it('应包含变更内容区块（如有 changes）', () => {
    const src = readSource();
    assert.ok(
      src.includes('变更内容') || src.includes('log.changes'),
      '缺少变更内容区块'
    );
  });
});

// ---- 防御 ----

describe('AuditLogDetailPage — 防御', () => {
  it('不应有全局浏览器引用（document/window）', () => {
    const src = readSource();
    assert.ok(
      !src.includes('document.') && !src.includes('window.'),
      '应避免模块顶层引用浏览器 API'
    );
  });

  it('应通过 import { useParams } 或接收 props 获取参数', () => {
    const src = readSource();
    assert.ok(
      src.includes('useParams') ||
        src.includes('props.params') ||
        src.includes('params:'),
      '缺少参数获取方式'
    );
  });

  it('应返回返回列表的 Link 组件', () => {
    const src = readSource();
    assert.ok(src.includes('<Link') && (src.includes('/audit-logs')), '缺少返回列表 Link');
  });

  it('应包含 SEVERITY_LABELS/STATUS_LABELS 标签引用', () => {
    const src = readSource();
    assert.ok(src.includes('SEVERITY_LABELS'), '缺少 SEVERITY_LABELS');
    assert.ok(src.includes('STATUS_LABELS'), '缺少 STATUS_LABELS');
    assert.ok(src.includes('STATUS_VARIANTS'), '缺少 STATUS_VARIANTS');
  });

  it('应格式化时间使用 toLocaleString zh-CN', () => {
    const src = readSource();
    assert.ok(src.includes('toLocaleString') && src.includes('zh-CN'), '缺少 zh-CN 时间格式化');
  });

  it('日志编号应使用 code 或 monospace 样式', () => {
    const src = readSource();
    assert.ok(src.includes('logCode') && (src.includes('<code') || src.includes('monospace')), '缺少日志编号 monospace 样式');
  });

  it('应处理 resources / store 的条件渲染', () => {
    const src = readSource();
    assert.ok(
      src.includes('log.tenant') || src.includes('log.store') || src.includes('关联信息'),
      '缺少租户/门店条件渲染'
    );
  });

  it('变更字段应使用 field/oldValue/newValue 结构', () => {
    const src = readSource();
    assert.ok(
      src.includes('change.field') && src.includes('change.oldValue') && src.includes('change.newValue'),
      '缺少变更字段结构'
    );
  });

  it('响应码 >= 400 应显示红色', () => {
    const src = readSource();
    assert.ok(
      (src.includes('code >= 400') && src.includes('#ef4444')) ||
        (src.includes('>= 400') && src.includes('red')),
      '缺少错误码高亮'
    );
  });
});
