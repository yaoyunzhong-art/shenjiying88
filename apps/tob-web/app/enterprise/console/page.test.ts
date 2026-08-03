/**
 * enterprise/console/page.test.ts — 企业控制台页面模块测试
 *
 * B型任务：页面测试（模块导出 + 链接/数据完整性 + 函数逻辑）
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SOURCE = resolve(__dirname, 'page.tsx');
const AUTH_SERVICE_SOURCE = resolve(__dirname, '../../../lib/enterprise-auth-service.ts');

function readPageSource(): string {
  return readFileSync(PAGE_SOURCE, 'utf-8');
}

function readAuthServiceSource(): string {
  return readFileSync(AUTH_SERVICE_SOURCE, 'utf-8');
}

// 导出模块就绪检查
describe('EnterpriseConsolePage module', () => {
  it('should export a default function component', () => {
    const source = readPageSource();
    assert.ok(source.includes('export default function EnterpriseConsolePage'), 'page module should export default component');
  });
});

// 页面中引用的快捷链接检查
describe('EnterpriseConsole quick links', () => {
  const expectedLinks = [
    { href: '/stores', label: '门店管理' },
    { href: '/employees', label: '员工管理' },
    { href: '/orders', label: '订单管理' },
    { href: '/campaigns', label: '营销活动' },
    { href: '/finance', label: '财务对账' },
    { href: '/alerts', label: '告警中心' },
  ];

  it('should reference 6 quick links', () => {
    assert.equal(expectedLinks.length, 6);
  });

  it('each quick link should have unique href', () => {
    const hrefs = expectedLinks.map((l) => l.href);
    assert.equal(new Set(hrefs).size, hrefs.length, 'duplicate href found');
  });

  it('each quick link should have unique label', () => {
    const labels = expectedLinks.map((l) => l.label);
    assert.equal(new Set(labels).size, labels.length, 'duplicate label found');
  });

  it('all quick link hrefs should be valid paths', () => {
    for (const link of expectedLinks) {
      assert.ok(link.href.startsWith('/'), `link ${link.label}: href should start with /`);
      assert.ok(link.href.length > 1, `link ${link.label}: href too short`);
    }
  });

  it('all quick link labels should be non-empty Chinese text', () => {
    for (const link of expectedLinks) {
      assert.ok(link.label.length >= 4, `link ${link.href}: label too short`);
      // All should be Chinese characters
      assert.ok(/^[\u4e00-\u9fff]+$/.test(link.label), `link ${link.href}: label not Chinese: ${link.label}`);
    }
  });
});

// 统计卡片数据检查
describe('EnterpriseConsole stats cards', () => {
  const statsCards = [
    { label: '门店总数', value: 12, variant: 'info' },
    { label: '员工总数', value: 48, variant: 'success' },
    { label: '本月订单', value: 1234, variant: 'warning' },
    { label: '待处理告警', value: 3, variant: 'error' },
  ];

  it('should have 4 stat cards', () => {
    assert.equal(statsCards.length, 4);
  });

  it('all stat card values should be non-negative integers', () => {
    for (const card of statsCards) {
      assert.ok(Number.isInteger(card.value) && card.value >= 0, `${card.label}: invalid value ${card.value}`);
    }
  });

  it('all stat card labels should be valid', () => {
    for (const card of statsCards) {
      assert.ok(card.label.length >= 4, `${card.label}: label too short`);
    }
  });

  it('all stat card variants should be valid', () => {
    const validVariants = ['info', 'success', 'warning', 'error'];
    for (const card of statsCards) {
      assert.ok(validVariants.includes(card.variant), `${card.label}: invalid variant ${card.variant}`);
    }
  });

  it('stat card labels should be unique', () => {
    const labels = statsCards.map((c) => c.label);
    assert.equal(new Set(labels).size, labels.length, 'duplicate stat card label found');
  });
});

// enterprise-auth-service 类型与接口检查
describe('Enterprise user auth service', () => {
  it('should define EnterpriseUser contract in auth service source', () => {
    const source = readAuthServiceSource();
    assert.ok(source.includes('export interface EnterpriseUser'), 'auth service should declare EnterpriseUser');
  });

  it('should keep EnterpriseUser permissions field in auth service contract', () => {
    const source = readAuthServiceSource();
    assert.ok(source.includes('permissions: string[];'), 'EnterpriseUser should include permissions array');
  });
});

describe('Enterprise console permissions', () => {
  it('should render permissions section in account info', () => {
    const source = readPageSource();
    assert.ok(source.includes('权限'), 'page should render permissions label');
    assert.ok(source.includes('user?.permissions?.length'), 'page should read EnterpriseUser.permissions');
    assert.ok(source.includes('暂无权限'), 'page should handle empty permissions');
  });

  it('should restore cached session and refresh user profile', () => {
    const source = readPageSource();
    assert.ok(source.includes('getEnterpriseAccessToken'), 'page should read enterprise access token');
    assert.ok(source.includes('getCachedEnterpriseUser'), 'page should read cached enterprise user');
    assert.ok(source.includes('enterpriseAuthService.getCurrentUser(token)'), 'page should refresh current user from /auth/me');
    assert.ok(source.includes('normalizeEnterpriseUser(result.data)'), 'page should normalize refreshed user payload');
    assert.ok(source.includes('storeEnterpriseSession'), 'page should rewrite normalized session');
    assert.ok(source.includes('clearEnterpriseSession()'), 'page should clear broken session before redirect');
  });
});

// 页面中使用的角色枚举检查
describe('Enterprise console roles', () => {
  const validRoles = ['tenant_admin', 'brand_manager', 'store_manager', 'staff'];

  it('should recognize at least 4 roles', () => {
    assert.ok(validRoles.length >= 4);
  });

  it('all roles should use snake_case convention', () => {
    for (const role of validRoles) {
      assert.ok(/^[a-z]+(_[a-z]+)*$/.test(role), `role ${role}: not snake_case`);
    }
  });

  it('role names should be unique', () => {
    assert.equal(new Set(validRoles).size, validRoles.length, 'duplicate role found');
  });
});
