/**
 * capability-access/page.test.ts — 权限管理页面测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('capability — 正例', () => {
  it('应接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'store:read'"));
  });

  it('应导出 CapabilityAccessPage', () => assert.ok(SRC.includes('export default function CapabilityAccessPage')));
  it('应包含权限管理标题', () => assert.ok(SRC.includes('权限管理')));
  it('应包含角色数据', () => assert.ok(SRC.includes('ROLE_DATA') || SRC.includes('role')));
  it('应包含作用域筛选', () => assert.ok(SRC.includes('scopeFilter') || SRC.includes('Select')));
  it('应包含统计指标', () => assert.ok(SRC.includes('Statistic')));
  it('应包含表格', () => assert.ok(SRC.includes('Table')));
  it('应包含新建角色按钮', () => assert.ok(SRC.includes('新建角色')));
});
describe('capability — 反例', () => {
  it('不应包含 dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('不应包含 localStorage', () => assert.ok(!SRC.includes('localStorage')));
});
describe('capability — 边界', () => {
  it('应包含状态映射', () => assert.ok(SRC.includes('STATUS_MAP') || SRC.includes('status')));
  it('应包含 use client', () => assert.ok(SRC.includes("'use client'")));
  it('源码长度应大于500', () => assert.ok(SRC.length > 500));
});
