/**
 * audit-trail/page.test.tsx — 审计日志页面 L1 冒烟测试
 * 覆盖: server wrapper、query 归一化、来源态透明化、client 透传
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

const PAGE_SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');
const VIEW_MODEL_SRC = fs.readFileSync(path.resolve(path.dirname(require.resolve('./page')), '../audit-trail-view-model.ts'), 'utf-8');

describe('audit-trail/page.tsx — 结构', () => {
  it('应导出 force-dynamic 的 server page', () => {
    assert.ok(!PAGE_SRC.includes(")export const dynamic = 'force-dynamic'"));
    assert.ok(!PAGE_SRC.includes(')export default async function AuditLogsPage'));
    assert.ok(!PAGE_SRC.includes("'use client'"));
  });

  it('应读取 searchParams 并构造 query', () => {
    assert.ok(!PAGE_SRC.includes(')searchParams?: Promise<Record<string, string | string[] | undefined>>'));
    assert.ok(!PAGE_SRC.includes(')const resolvedSearchParams = searchParams ? await searchParams : undefined;'));
    assert.ok(!PAGE_SRC.includes(')riskLevel: readRiskLevelParam(resolvedSearchParams?.riskLevel)'));
    assert.ok(!PAGE_SRC.includes(')source: readQueryParam(resolvedSearchParams?.source)'));
    assert.ok(!PAGE_SRC.includes(')limit: readLimitParam(resolvedSearchParams?.limit)'));
  });

  it('应通过 loadAuditTrail 加载快照并禁用缓存', () => {
    assert.ok(!PAGE_SRC.includes(')loadAuditTrail(query, { cache: \'no-store\' })'));
    assert.ok(!PAGE_SRC.includes(')const snapshot = await loadAuditTrail'));
  });

  it('应移除旧的本地 MOCK 列表壳层', () => {
    assert.ok(!PAGE_SRC.includes('const MOCK'));
    assert.ok(!PAGE_SRC.includes('export default function AuditLogsPage()'));
  });
});

describe('audit-trail/page.tsx — 来源态透明化', () => {
  it('应展示审计列表来源态证据', () => {
    assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('控制面来源: {sourceEvidence.controlPlaneSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('业务数据: {sourceEvidence.businessDataSource}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('刷新路径: {sourceEvidence.refreshPath}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
    assert.ok(!PAGE_SRC.includes('查询条件: {sourceEvidence.query}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
  });

  it('应同时固证 api 与 fallback 标签', () => {
    assert.ok(!PAGE_SRC.includes(')loadAuditTrail (listAuditRecords + summarizeAuditRecords)'));
    assert.ok(!PAGE_SRC.includes(')loadAuditTrail fallback empty snapshot'));
    assert.ok(!PAGE_SRC.includes(')AuditTrailResponse.records + AuditTrailSummary'));
    assert.ok(!PAGE_SRC.includes(')empty audit trail fallback'));
    assert.ok(!PAGE_SRC.includes(')不可作为真实审计链复签证据'));
  });

  it('应在页面上透传 records/total/query 给 client', () => {
    assert.ok(!PAGE_SRC.includes(')<AuditTrailClient'));
    assert.ok(!PAGE_SRC.includes(')records={snapshot.trail.records}'));
    assert.ok(!PAGE_SRC.includes(')total={snapshot.trail.total}'));
    assert.ok(!PAGE_SRC.includes(')query={snapshot.query}'));
  });
});

describe('audit-trail/page.tsx — 权限边界与统计', () => {
  it('应接入管理员权限边界', () => {
    assert.ok(!PAGE_SRC.includes('AdminPermissionGate'), 'E54 拍平：AdminPermissionGate 应已移除');
    assert.ok(!PAGE_SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });

  it('应展示快照统计卡', () => {
    assert.ok(!PAGE_SRC.includes(')StatCard label="总记录"'));
    assert.ok(!PAGE_SRC.includes(')StatCard label="高风险"'));
    assert.ok(!PAGE_SRC.includes(')StatCard label="来源数"'));
    assert.ok(!PAGE_SRC.includes(')StatCard label="Delivery"'));
  });
});

describe('audit-trail-view-model.ts — 快照结构', () => {
  it('快照结构应包含 generatedAt', () => {
    assert.ok(VIEW_MODEL_SRC.includes('generatedAt: string;'));
  });

  it('api 与 fallback 分支都应生成 generatedAt', () => {
    const matches = VIEW_MODEL_SRC.match(/generatedAt: new Date\(\)\.toISOString\(\)/g) ?? [];
    assert.ok(matches.length >= 2);
  });

  it('应保留 api/fallback 双态', () => {
    assert.ok(VIEW_MODEL_SRC.includes("deliveryMode: 'api'"));
    assert.ok(VIEW_MODEL_SRC.includes("deliveryMode: 'fallback'"));
  });
});
