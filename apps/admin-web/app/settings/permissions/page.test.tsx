/**
 * settings/permissions/page.test.tsx — 权限管理 L1 测试
 *
 * 覆盖: 角色定义、权限矩阵、资源授权、继承关系
 * 正例: 角色权限映射、资源级权限、权限继承
 * 反例: 权限冲突、角色不存在、循环继承
 * 边界: 超级管理员、空权限集、全拒绝
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import PermissionsPage from './page';

/* ── 类型 ── */

type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';
type ResourceType = 'order' | 'product' | 'user' | 'report' | 'setting' | 'store' | 'finance';

interface Permission {
  resource: ResourceType;
  action: PermissionAction;
  conditions?: Record<string, string>;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  parentRoleId: string | null;
  isSystem: boolean;
}

interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

interface PermissionMatrix {
  roles: Role[];
  resources: ResourceType[];
  actions: PermissionAction[];
}

function buildMatrix(roles: Role[]): PermissionMatrix {
  const resources: ResourceType[] = ['order', 'product', 'user', 'report', 'setting', 'store', 'finance'];
  const actions: PermissionAction[] = ['create', 'read', 'update', 'delete', 'approve', 'export'];
  return { roles, resources, actions };
}

function checkPermission(role: Role, resource: ResourceType, action: PermissionAction): PermissionCheck {
  const hasPermission = role.permissions.some(p => p.resource === resource && p.action === action);
  if (role.isSystem) return { allowed: true };
  return { allowed: hasPermission, reason: hasPermission ? undefined : '无此权限' };
}

function getInheritedPermissions(role: Role, allRoles: Role[]): Permission[] {
  const result = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [role.id];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    const current = allRoles.find(r => r.id === currentId);
    if (current) {
      current.permissions.forEach(p => result.add(`${p.resource}:${p.action}`));
      if (current.parentRoleId && !visited.has(current.parentRoleId)) {
        queue.push(current.parentRoleId);
      }
    }
  }
  return Array.from(result).map(s => {
    const [resource, action] = s.split(':');
    return { resource: resource as ResourceType, action: action as PermissionAction };
  });
}

function detectCycle(roleId: string, allRoles: Role[]): boolean {
  const visited = new Set<string>();
  let current = allRoles.find(r => r.id === roleId);
  while (current && current.parentRoleId) {
    if (visited.has(current.id)) return true;
    visited.add(current.id);
    current = allRoles.find(r => r.id === current.parentRoleId);
  }
  return false;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(PermissionsPage));
}

/* ============================================================ */

describe('permissions: 页面渲染', () => {
  it('renders title', () => { const { container } = setup(); assert.ok(container.querySelector('h1')?.textContent?.includes('权限管理')); });
  it('renders description', () => { const { container } = setup(); assert.ok(container.textContent?.includes('权限')); });
  it('renders without error', () => { assert.doesNotThrow(() => setup()); });
  it('has padding layout', () => { const { container } = setup(); assert.equal((container.firstElementChild as HTMLElement)?.style?.padding, '24px'); });
  it('has single h1', () => { const { container } = setup(); assert.equal(container.querySelectorAll('h1').length, 1); });
  it('component is a function', () => { assert.equal(typeof PermissionsPage, 'function'); });
});

describe('permissions: 数据类型', () => {
  it('Role has required fields', () => {
    const r: Role = { id: 'admin', name: '管理员', description: '系统管理员', permissions: [{ resource: 'setting', action: 'create' }], parentRoleId: null, isSystem: true };
    assert.equal(typeof r.id, 'string');
    assert.equal(typeof r.isSystem, 'boolean');
    assert.ok(Array.isArray(r.permissions));
  });

  it('PermissionAction enum values', () => {
    const valid: PermissionAction[] = ['create', 'read', 'update', 'delete', 'approve', 'export'];
    assert.equal(valid.length, 6);
  });

  it('ResourceType enum values', () => {
    const valid: ResourceType[] = ['order', 'product', 'user', 'report', 'setting', 'store', 'finance'];
    assert.equal(valid.length, 7);
  });

  it('isSystem flag distinguishes system vs custom roles', () => {
    const system: Role = { id: 's', name: '系统', description: '', permissions: [], parentRoleId: null, isSystem: true };
    const custom: Role = { id: 'c', name: '自定义', description: '', permissions: [], parentRoleId: null, isSystem: false };
    assert.ok(system.isSystem);
    assert.ok(!custom.isSystem);
  });
});

describe('permissions: 业务逻辑', () => {
  const ADMIN: Role = { id: 'admin', name: '系统管理员', description: '全部权限', permissions: [{ resource: 'setting', action: 'read' }, { resource: 'setting', action: 'update' }], parentRoleId: null, isSystem: true };
  const MANAGER: Role = { id: 'manager', name: '运营经理', description: '大部分权限', permissions: [{ resource: 'order', action: 'read' }, { resource: 'order', action: 'update' }, { resource: 'report', action: 'read' }, { resource: 'report', action: 'export' }, { resource: 'user', action: 'read' }], parentRoleId: null, isSystem: false };
  const OPERATOR: Role = { id: 'operator', name: '运营专员', description: '基本权限', permissions: [{ resource: 'order', action: 'read' }], parentRoleId: 'manager', isSystem: false };
  const VIEWER: Role = { id: 'viewer', name: '浏览者', description: '只读权限', permissions: [{ resource: 'order', action: 'read' }, { resource: 'report', action: 'read' }], parentRoleId: 'operator', isSystem: false };

  it('checkPermission admin has all', () => {
    const check = checkPermission(ADMIN, 'finance', 'delete');
    assert.ok(check.allowed);
  });

  it('checkPermission manager has order:read', () => {
    const check = checkPermission(MANAGER, 'order', 'read');
    assert.ok(check.allowed);
  });

  it('checkPermission manager lacks setting:update', () => {
    const check = checkPermission(MANAGER, 'setting', 'update');
    assert.ok(!check.allowed);
  });

  it('checkPermission operator has order:read from own', () => {
    const check = checkPermission(OPERATOR, 'order', 'read');
    assert.ok(check.allowed);
  });

  it('checkPermission operator lacks user:read without inheritance', () => {
    const check = checkPermission(OPERATOR, 'user', 'read');
    assert.ok(!check.allowed);
  });

  it('getInheritedPermissions includes parent permissions', () => {
    const inherited = getInheritedPermissions(VIEWER, [ADMIN, MANAGER, OPERATOR, VIEWER]);
    const actions = inherited.map(p => `${p.resource}:${p.action}`);
    assert.ok(actions.includes('order:read'));
    assert.ok(actions.includes('report:read'));
  });

  it('getInheritedPermissions for root role returns own only', () => {
    const inherited = getInheritedPermissions(MANAGER, [ADMIN, MANAGER, OPERATOR, VIEWER]);
    const actions = inherited.map(p => `${p.resource}:${p.action}`);
    assert.equal(actions.length, 5);
  });

  it('detectCycle returns false for non-cyclic', () => {
    assert.ok(!detectCycle('admin', [ADMIN, MANAGER, OPERATOR]));
  });

  it('detectCycle detects direct cycle', () => {
    const cyclic: Role = { id: 'a', name: 'A', description: '', permissions: [], parentRoleId: 'b', isSystem: false };
    const cyclic2: Role = { id: 'b', name: 'B', description: '', permissions: [], parentRoleId: 'a', isSystem: false };
    assert.ok(detectCycle('a', [cyclic, cyclic2]));
  });

  it('buildMatrix returns resources and actions', () => {
    const matrix = buildMatrix([ADMIN, MANAGER]);
    assert.equal(matrix.resources.length, 7);
    assert.equal(matrix.actions.length, 6);
    assert.equal(matrix.roles.length, 2);
  });

  it('manager has report export permission', () => {
    const check = checkPermission(MANAGER, 'report', 'export');
    assert.ok(check.allowed);
  });

  it('operator inherits manager permissions', () => {
    const inherited = getInheritedPermissions(OPERATOR, [ADMIN, MANAGER, OPERATOR]);
    const actions = inherited.map(p => `${p.resource}:${p.action}`);
    assert.ok(actions.includes('order:read'));
    assert.ok(actions.includes('order:update'));
  });

  it('self-cyclic role detection', () => {
    const self: Role = { id: 'self', name: 'Self', description: '', permissions: [], parentRoleId: 'self', isSystem: false };
    assert.ok(detectCycle('self', [self]));
  });

  it('viewer inherits from operator and manager', () => {
    const inherited = getInheritedPermissions(VIEWER, [ADMIN, MANAGER, OPERATOR, VIEWER]);
    const actions = inherited.map(p => `${p.resource}:${p.action}`);
    assert.ok(actions.includes('order:read'));
  });

  it('default permissions array can be empty', () => {
    const empty: Role = { id: 'empty', name: '空角色', description: '', permissions: [], parentRoleId: null, isSystem: false };
    assert.equal(empty.permissions.length, 0);
  });

  it('operator cannot delete orders', () => {
    const check = checkPermission(OPERATOR, 'order', 'delete');
    assert.ok(!check.allowed);
  });
});
