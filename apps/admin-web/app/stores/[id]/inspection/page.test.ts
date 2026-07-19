/**
 * inspection/page.test.tsx — 巡检管理页面测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('inspection — 正例', () => {
  it('应导出 InspectionPage', () => assert.ok(SRC.includes('export default function InspectionPage')));
  it('应包含巡检管理标题', () => assert.ok(SRC.includes('巡检管理')));
  it('应包含巡检数据', () => assert.ok(SRC.includes('INSPECT_DATA') || SRC.includes('巡检')));
  it('应包含类别筛选', () => assert.ok(SRC.includes('typeFilter') || SRC.includes('Select')));
  it('应包含统计指标', () => assert.ok(SRC.includes('Statistic')));
  it('应包含表格', () => assert.ok(SRC.includes('Table')));
  it('应包含新建巡检按钮', () => assert.ok(SRC.includes('新建巡检')));
  it('应包含结果状态映射', () => assert.ok(SRC.includes('RESULT_CFG') || SRC.includes('result')));
});
describe('inspection — 反例', () => {
  it('不应使用 dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('不应直接操作 localStorage', () => assert.ok(!SRC.includes('localStorage')));
});
describe('inspection — 边界', () => {
  it('应包含 use client', () => assert.ok(SRC.includes("'use client'")));
  it('应包含类别图标映射', () => assert.ok(SRC.includes('TYPE_CFG') || SRC.includes('🔧')));
  it('源码长度应大于500', () => assert.ok(SRC.length > 500));
  it('请求应通过 buildActorHeaders 统一注入 actor 身份', () => {
    assert.ok(SRC.includes('buildActorHeaders'), '缺少统一 actor header helper');
    assert.ok(SRC.includes('admin-store-inspection'), '缺少巡检页面 actor 标识');
    assert.ok(SRC.includes('x-actor-id') || SRC.includes('buildInspectionHeaders'), '缺少 actor 请求头构造');
  });
});
