import assert from 'node:assert/strict';
import test from 'node:test';
import type {} from '@m5/types';
import {
  fallbackRoleWorkbenches,
  fallbackWorkbenchMap,
  fallbackWorkbenchConsumerDescriptor,
} from './workbench-data';

/**
 * admin-web Workbench Page — L1 冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 验证 getRoleWorkbench / getRoleWorkbenches 等路由级页面数据源的
 * 核心契约：role lookup, fallback, gateway-level governance validation
 */

// ---- 正例 ----

test('workbench page: resolves known role in fallback map', () => {
  const superAdmin = fallbackWorkbenchMap['super_admin'];
  const guide = fallbackWorkbenchMap['guide'];

  assert.ok(superAdmin);
  assert.equal(superAdmin.role, 'SUPER_ADMIN');
  assert.equal(superAdmin.channel, 'PC');
  assert.equal(guide!.role, 'GUIDE');
  assert.equal(guide!.channel, 'PAD');
});

test('workbench page: every role workbench has positive navItems count', () => {
  for (const wb of fallbackRoleWorkbenches) {
    assert.ok(wb.navItems.length > 0, `${wb.role} should have navItems`);
  }
});

test('workbench page: all workbenches declare marketCodes', () => {
  for (const wb of fallbackRoleWorkbenches) {
    assert.ok(wb.marketCodes.length > 0, `${wb.role} should have marketCodes`);
    assert.ok(wb.marketCodes.includes('cn-mainland'), `${wb.role} should include cn-mainland`);
  }
});

test('workbench page: PC roles have at least 2 nav items', () => {
  const pcRoles = fallbackRoleWorkbenches.filter((wb) => wb.channel === 'PC');
  for (const wb of pcRoles) {
    assert.ok(wb.navItems.length >= 2, `${wb.role} (PC) expects >= 2 navItems`);
  }
});

// ---- 反例 ----

test('workbench page: unknown role returns undefined from map', () => {
  const unknown = fallbackWorkbenchMap['unknown_role'];
  assert.equal(unknown, undefined);
});

test('workbench page: empty map key returns undefined', () => {
  const empty = fallbackWorkbenchMap[''];
  assert.equal(empty, undefined);
});

test('workbench page: role lookup is case-sensitive on key', () => {
  // The map uses lowercased keys, so 'SUPER_ADMIN' should be undefined
  const upperCase = fallbackWorkbenchMap['SUPER_ADMIN'];
  assert.equal(upperCase, undefined);
});

// ---- 边界 ----

test('workbench page: exactly 10 roles defined', () => {
  assert.equal(fallbackRoleWorkbenches.length, 10);
});

test('workbench page: every role has unique channel', () => {
  const roleChannels = fallbackRoleWorkbenches.map((wb) => `${wb.role}:${wb.channel}`);
  const unique = new Set(roleChannels);
  assert.equal(unique.size, fallbackRoleWorkbenches.length);
});

test('workbench page: all workbench titles are non-empty strings', () => {
  for (const wb of fallbackRoleWorkbenches) {
    assert.ok(wb.title.length > 0, `${wb.role} should have a title`);
  }
});

test('workbench page: descriptor dependsOn has at least 5 modules', () => {
  assert.ok(fallbackWorkbenchConsumerDescriptor.dependsOn.length >= 5);
});

test('workbench page: descriptor highRiskEntrypoints includes approval-execution', () => {
  const highRisk = fallbackWorkbenchConsumerDescriptor.highRiskEntrypoints;
  assert.ok(highRisk.includes('approval-execution'));
  assert.ok(highRisk.includes('secret-rotation'));
  assert.ok(highRisk.includes('runtime-replay'));
});

test('workbench page: descriptor actionGovernanceExamples cover all highRiskEntrypoints', () => {
  const highRisk = fallbackWorkbenchConsumerDescriptor.highRiskEntrypoints;
  const actions = new Set<string>(fallbackWorkbenchConsumerDescriptor.actionGovernanceExamples.map((ex) => ex.action));
  for (const entry of highRisk) {
    assert.ok(actions.has(entry), `${entry} should have actionGovernanceExample`);
  }
});

test('workbench page: descriptor runtimeHashtagExamples have proper fields', () => {
  const examples = fallbackWorkbenchConsumerDescriptor.runtimeHandoffExamples;
  assert.ok(examples.length >= 3);
  const ticketTypes = new Set(examples.map((ex) => ex.ticketType));
  assert.ok(ticketTypes.has('CHALLENGE_GATE'));
});
