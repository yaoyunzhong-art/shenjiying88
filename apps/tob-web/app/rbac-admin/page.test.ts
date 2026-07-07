/**
 * rbac-admin/page.test.ts — RBAC 权限管理中心 L1 冒烟测试
 * 覆盖: 正例·数据完整性·边界
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function readSource(): string {
  const fs = require('node:fs');
  return fs.readFileSync(require('path').resolve(__dirname, 'page.tsx'), 'utf-8');
}

describe('rbac-admin — 正例', () => {
  it('应导出一个默认 React 组件函数', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', '默认导出应为 React 组件函数');
  });

  it('应定义 ROLES 数组', () => {
    const source = readSource();
    assert.ok(source.includes('const ROLES'), '应定义 ROLES 常量');
    // 至少包含核心角色定义
    assert.ok(source.includes('platform_admin'), '应包含平台管理员');
    assert.ok(source.includes('store_manager'), '应包含店长角色');
    assert.ok(source.includes('cashier'), '应包含收银员角色');
  });

  it('应定义 PERMISSION_MODULES 数组', () => {
    const source = readSource();
    assert.ok(source.includes('const PERMISSION_MODULES'), '应定义权限模块');
    assert.ok(source.includes('会员管理') && source.includes('订单管理'), '应包含核心权限模块');
  });

  it('应导出 RoleCard 和 RoleAssignmentForm 组件', () => {
    const source = readSource();
    assert.ok(source.includes('function RoleCard'), '应定义 RoleCard 组件');
    assert.ok(source.includes('function RoleAssignmentForm'), '应定义角色分配表单');
    assert.ok(source.includes('function PermissionModule'), '应定义权限模块组件');
  });

  it('应包含 Heartbeat 组件', () => {
    const source = readSource();
    assert.ok(source.includes('Heartbeat'), '页面应包含心跳组件');
  });
});

describe('rbac-admin — 边界', () => {
  it('ROLES 应至少有 5 个角色定义', () => {
    const source = readSource();
    const matches = source.match(/id:\s*'/g);
    assert.ok(matches && matches.length >= 5, `应至少有 5 个角色, 实际 ${matches?.length ?? 0}`);
  });

  it('PERMISSION_MODULES 应包含 10 个以上的权限模块', () => {
    const source = readSource();
    const matches = source.match(/module:\s*'/g);
    assert.ok(matches && matches.length >= 10, `权限模块数应 >= 10, 实际 ${matches?.length ?? 0}`);
  });

  it('页面应使用 use client 指令', () => {
    const source = readSource();
    assert.ok(
      source.includes("'use client'"),
      '客户端组件应声明 use client',
    );
  });

  it('页面文件应非空', () => {
    const source = readSource();
    assert.ok(source.length > 1000, 'page.tsx 不应为空或过短');
  });
});
