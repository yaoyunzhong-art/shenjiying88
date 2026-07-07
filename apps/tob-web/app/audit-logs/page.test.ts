/**
 * audit-logs/page.test.ts — 审计日志列表页 L1 冒烟测试
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

describe('audit-logs — 正例', () => {
  it('应导出一个默认组件 AuditLogsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function AuditLogsPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 MOCK_AUDIT_LOGS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_AUDIT_LOGS'), '缺少 MOCK_AUDIT_LOGS');
  });

  it('应包含 statusFilter / categoryFilter / searchTerm 筛选状态', () => {
    const src = readSource();
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
    assert.ok(src.includes('categoryFilter'), '缺少 categoryFilter');
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm');
  });

  it('应包含 STATS 统计 (日志总数/成功/失败/严重)', () => {
    const src = readSource();
    assert.ok(src.includes('stats.total') || src.includes('stats.success'), '缺少 stats 统计');
  });
});

// ---- 边界 ----

describe('audit-logs — 边界', () => {
  it('筛选时调用 setPage(0) 重置分页', () => {
    const src = readSource();
    assert.ok(src.includes('setPage(0)'), '缺少重置分页逻辑');
  });

  it('日志类别包含 auth / data / config / security / business', () => {
    const src = readSource();
    assert.ok(src.includes('"auth"'), '缺少 auth 类别');
    assert.ok(src.includes('"data"'), '缺少 data 类别');
    assert.ok(src.includes('"config"'), '缺少 config 类别');
    assert.ok(src.includes('"security"'), '缺少 security 类别');
    assert.ok(src.includes('"business"'), '缺少 business 类别');
  });

  it('日志状态包含 success / failed / partial', () => {
    const src = readSource();
    assert.ok(src.includes('"success"'), '缺少 success 状态');
    assert.ok(src.includes('"failed"'), '缺少 failed 状态');
    assert.ok(src.includes('"partial"'), '缺少 partial 状态');
  });

  it('每页显示 LOGS_PER_PAGE = 10 条', () => {
    const src = readSource();
    assert.ok(src.includes('const LOGS_PER_PAGE = 10'), '缺少每页条数定义');
  });

  it('应支持搜索操作/日志编号/操作人', () => {
    const src = readSource();
    assert.ok(src.includes('toLowerCase'), '缺少 toLowerCase 关键字搜索');
    assert.ok(src.includes('.filter('), '缺少 filter 筛选');
  });
});

// ---- 防御 ----

describe('audit-logs — 防御', () => {
  it('应包含 导出日志 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('导出') && src.includes('日志'), '缺少导出日志按钮');
  });

  it('应包含 Loading 状态处理 (LoadingSkeleton)', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('应包含 Pagination 组件', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
  });

  it('应包含 详情 链接跳转', () => {
    const src = readSource();
    assert.ok(src.includes('/audit-logs/') && src.includes('详情'), '缺少详情链接');
  });

  it('应包含耗时 duration > 1000ms 的红色标记逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('duration'), '缺少 duration 字段');
    assert.ok(src.includes('#f97316'), '缺少超时高亮颜色');
  });
});
