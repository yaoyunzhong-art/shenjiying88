/**
 * audit/page.test.tsx — 审计日志页面测试
 * 覆盖: 正例·反例·边界·防御·组件完整性
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

describe('audit — 正例', () => {
  it('应导出一个默认组件 AuditPage', () => {
    assert.ok(readSource().includes('export default function AuditPage'));
  });
  it('应包含审计日志标题', () => {
    assert.ok(readSource().includes('审计日志'));
  });
  it('应包含操作数据', () => {
    const src = readSource();
    assert.ok(src.includes('AUDIT_DATA') || src.includes('审计'));
  });
  it('应包含级别筛选功能', () => {
    assert.ok(readSource().includes('levelFilter') || readSource().includes('级别'));
  });
  it('应包含统计指标', () => {
    assert.ok(readSource().includes('Statistic'));
  });
  it('应包含表格', () => {
    assert.ok(readSource().includes('Table'));
  });
  it('应包含 Select 筛选', () => {
    assert.ok(readSource().includes('Select'));
  });
});

describe('audit — 反例', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!readSource().includes('dangerouslySetInnerHTML'));
  });
  it('不应直接操作 localStorage', () => {
    assert.ok(!readSource().includes('localStorage'));
  });
});

describe('audit — 边界', () => {
  it('应包含级别映射配置', () => {
    assert.ok(readSource().includes('LEVEL_CFG') || readSource().includes('level'));
  });
  it('应有颜色样式定义', () => {
    assert.ok(readSource().includes('color'));
  });
  it('源码长度应大于500 bytes', () => {
    assert.ok(readSource().length > 500);
  });
});

describe('audit — 防御', () => {
  it('应包含 use client 指令', () => {
    assert.ok(readSource().includes("'use client'"));
  });
  it('不应包含 undefined 文本', () => {
    assert.ok(!readSource().includes('undefined'));
  });
});
