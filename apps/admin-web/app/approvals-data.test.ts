/**
 * approvals-data.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 * 
 * 角色视角: 👔店长 · 🔧安监 · 🎯运行专员
 * 测试治理审批路由、详情链接构建等核心功能
 * V17#圈梁对齐
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { adminGovernanceApprovalsRoute, buildGovernanceApprovalDetailHref } from './approvals-data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, 'approvals-data.ts');

// ===================== 正例 =====================

test('👔 店长视角: approval route has complete configuration', () => {
  const route = adminGovernanceApprovalsRoute;

  // 路径完整性
  assert.ok(route.href.startsWith('/'));
  assert.ok(route.detailHrefBase.startsWith('/'));
  assert.ok(route.backHref.startsWith('/'));

  // 文案完整性
  assert.ok(route.title.length > 0);
  assert.ok(route.description.length > 0);
  assert.ok(route.emptyTitle.length > 0);
  assert.equal(typeof route.emptyMessage, 'function');
});

test('🔧 安监视角: buildGovernanceApprovalDetailHref constructs valid URL', () => {
  const tickets = ['APPROVAL-001', 'APPROVAL-002', 'RISK-BLOCK-20260613'];

  for (const ticket of tickets) {
    const href = buildGovernanceApprovalDetailHref(ticket);
    assert.ok(href.startsWith('/approvals/'));
    assert.ok(href.includes(ticket));
  }
});

test('🎯 运行专员视角: emptyMessage is context-aware', () => {
  const msg1 = adminGovernanceApprovalsRoute.emptyMessage('TICKET-X');
  assert.ok(msg1.includes('TICKET-X'));
  assert.ok(msg1.includes('不存在'));

  const msg2 = adminGovernanceApprovalsRoute.emptyMessage('UNKNOWN-999');
  assert.ok(msg2.includes('UNKNOWN-999'));
});

test('🔍 source file exists and exports correctly', () => {
  assert.ok(existsSync(DATA_FILE), 'approvals-data.ts should exist');
});

test('🔍 route has all required string fields populated', () => {
  const route = adminGovernanceApprovalsRoute;
  assert.equal(typeof route.href, 'string');
  assert.equal(typeof route.detailHrefBase, 'string');
  assert.equal(typeof route.backHref, 'string');
  assert.equal(typeof route.title, 'string');
  assert.equal(typeof route.description, 'string');
  assert.equal(typeof route.emptyTitle, 'string');
});

test('🔍 emptyMessage returns different strings for different inputs', () => {
  const msgA = adminGovernanceApprovalsRoute.emptyMessage('TICKET-X');
  const msgB = adminGovernanceApprovalsRoute.emptyMessage('TICKET-Y');
  assert.ok(msgA !== msgB, 'Should vary per input ticket');
});

// ===================== 反例 =====================

test('反例: buildGovernanceApprovalDetailHref with empty ticket still produces path', () => {
  const href = buildGovernanceApprovalDetailHref('');
  assert.equal(href, '/approvals/');
});

test('反例: route title should not be empty', () => {
  assert.ok(adminGovernanceApprovalsRoute.title.length > 0);
  assert.ok(adminGovernanceApprovalsRoute.description.length > 0);
});

test('反例: emptyMessage should not return or throw on every input', () => {
  const inputs = ['', ' ', '   ', '正常审批单号'];

  for (const input of inputs) {
    const result = adminGovernanceApprovalsRoute.emptyMessage(input);
    assert.equal(typeof result, 'string');
  }
});

test('反例: route.backHref should not equal route.href (navigate to different page)', () => {
  assert.ok(adminGovernanceApprovalsRoute.backHref !== adminGovernanceApprovalsRoute.href,
    'backHref should differ from href');
});

test('反例: undefined ticket should be handled gracefully', () => {
  assert.doesNotThrow(() => {
    buildGovernanceApprovalDetailHref(undefined as unknown as string);
  });
});

test('反例: null ticket should not crash', () => {
  assert.doesNotThrow(() => {
    buildGovernanceApprovalDetailHref(null as unknown as string);
  });
});

// ===================== 边界 =====================

test('边界: route href length within reasonable bounds', () => {
  assert.ok(adminGovernanceApprovalsRoute.href.length <= 256);
  assert.ok(adminGovernanceApprovalsRoute.backHref.length <= 256);
});

test('边界: buildGovernanceApprovalDetailHref with very long ticket', () => {
  const longTicket = 'A'.repeat(500);
  const href = buildGovernanceApprovalDetailHref(longTicket);
  assert.ok(href.includes(longTicket));
  assert.ok(href.length > 500);
});

test('边界: all route string fields are non-empty and well-formed', () => {
  const route = adminGovernanceApprovalsRoute;
  const stringFields: (keyof typeof route)[] = ['href', 'detailHrefBase', 'backHref', 'title', 'description', 'emptyTitle'];

  for (const field of stringFields) {
    const val = route[field] as string;
    assert.equal(typeof val, 'string');
    assert.ok(val.length > 0, `Field ${field} should not be empty`);
  }
});

test('边界: route fields within max length limits', () => {
  const route = adminGovernanceApprovalsRoute;
  assert.ok(route.title.length < 200, 'title too long');
  assert.ok(route.description.length < 500, 'description too long');
  assert.ok(route.href.length < 200, 'href too long');
  assert.ok(route.detailHrefBase.length < 200, 'detailHrefBase too long');
  assert.ok(route.backHref.length < 200, 'backHref too long');
});

test('边界: buildGovernanceApprovalDetailHref with special characters', () => {
  const ticket = 'APPROVAL-%&*#@!';
  const href = buildGovernanceApprovalDetailHref(ticket);
  assert.ok(href.includes(ticket));
});

test('边界: emptyMessage with empty string input should not throw', () => {
  assert.doesNotThrow(() => adminGovernanceApprovalsRoute.emptyMessage(''));
  assert.equal(typeof adminGovernanceApprovalsRoute.emptyMessage(''), 'string');
});

// ===================== 集成 =====================

test('集成: route fields consistent with each other', () => {
  const route = adminGovernanceApprovalsRoute;
  // detailHrefBase should be a prefix of actual detail URL
  assert.ok(route.detailHrefBase.startsWith('/'));
  assert.ok(buildGovernanceApprovalDetailHref('TEST').startsWith(route.detailHrefBase));
});

test('集成: emptyMessage accepts same ticket as detail href', () => {
  const ticket = 'INTEGRATION-TEST-001';
  const href = buildGovernanceApprovalDetailHref(ticket);
  const msg = adminGovernanceApprovalsRoute.emptyMessage(ticket);
  assert.ok(href.includes(ticket));
  assert.ok(msg.includes(ticket));
});

test('集成: after route cleanup, emptyTitle still populated', () => {
  assert.ok(adminGovernanceApprovalsRoute.emptyTitle.length > 0);
  assert.ok(adminGovernanceApprovalsRoute.title.length > 0);
});
