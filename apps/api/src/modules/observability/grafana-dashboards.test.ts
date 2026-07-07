import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * grafana-dashboards.test.ts - Phase-22 T74
 * Grafana Dashboard JSON 模板测试
 */
import assert from 'node:assert/strict';
import {
  BUSINESS_DASHBOARD,
  PERFORMANCE_DASHBOARD,
  COMPLIANCE_DASHBOARD,
  MOBILE_DASHBOARD,
  ALL_DASHBOARDS,
  buildAlertPanelData,
} from './grafana-dashboards';

describe('Grafana Dashboards', () => {
  it('AC-1 4 套 dashboard 全部存在', () => {
    assert.equal(ALL_DASHBOARDS.length, 4);
    assert.ok(BUSINESS_DASHBOARD.uid);
    assert.ok(PERFORMANCE_DASHBOARD.uid);
    assert.ok(COMPLIANCE_DASHBOARD.uid);
    assert.ok(MOBILE_DASHBOARD.uid);
  });

  it('AC-2 uid 唯一', () => {
    const uids = ALL_DASHBOARDS.map((d) => d.uid);
    const unique = new Set(uids);
    assert.equal(unique.size, uids.length, `重复 uid: ${uids}`);
  });

  it('AC-3 每套 dashboard 至少 3 个 panel', () => {
    for (const d of ALL_DASHBOARDS) {
      assert.ok(d.panels.length >= 3, `${d.uid} 应 >= 3 panels, 实际 ${d.panels.length}`);
    }
  });

  it('AC-4 panel id 唯一 (单 dashboard 内)', () => {
    for (const d of ALL_DASHBOARDS) {
      const ids = d.panels.map((p) => p.id);
      const unique = new Set(ids);
      assert.equal(unique.size, ids.length, `${d.uid} 内 panel id 重复`);
    }
  });

  it('AC-5 panel gridPos 不重叠', () => {
    for (const d of ALL_DASHBOARDS) {
      const positions = new Set<string>();
      for (const p of d.panels) {
        const key = `${p.gridPos.x},${p.gridPos.y}`;
        assert.ok(!positions.has(key), `${d.uid} panel ${p.id} 位置重叠 ${key}`);
        positions.add(key);
      }
    }
  });

  it('AC-6 业务 dashboard 包含订单/转化/合规', () => {
    const titles = BUSINESS_DASHBOARD.panels.map((p) => p.title);
    assert.ok(titles.some((t) => t.includes('订单')));
    assert.ok(titles.some((t) => t.includes('转化')));
    assert.ok(titles.some((t) => t.includes('合规')));
  });

  it('AC-7 性能 dashboard 包含 P99 + 错误率', () => {
    const titles = PERFORMANCE_DASHBOARD.panels.map((p) => p.title);
    assert.ok(titles.some((t) => t.includes('P99')));
    assert.ok(titles.some((t) => t.includes('错误率')));
  });

  it('AC-8 合规 dashboard 包含 GDPR + 审计', () => {
    const titles = COMPLIANCE_DASHBOARD.panels.map((p) => p.title);
    assert.ok(titles.some((t) => /GDPR/i.test(t)));
    assert.ok(titles.some((t) => t.includes('审计')));
  });

  it('AC-9 移动端 dashboard 包含 Crash-Free + 离线队列', () => {
    const titles = MOBILE_DASHBOARD.panels.map((p) => p.title);
    assert.ok(titles.some((t) => /Crash-Free/i.test(t)));
    assert.ok(titles.some((t) => t.includes('离线队列')));
  });
});

describe('buildAlertPanelData', () => {
  it('AC-10 按 severity 分组', () => {
    const alerts = [
      { id: 'a1', ruleId: 'r1', severity: 'P0' as const, title: 'p0-a', state: 'firing' as const, firedAt: 't1', windowMs: 60000 },
      { id: 'a2', ruleId: 'r2', severity: 'P0' as const, title: 'p0-b', state: 'firing' as const, firedAt: 't1', windowMs: 60000 },
      { id: 'a3', ruleId: 'r3', severity: 'P1' as const, title: 'p1-a', state: 'firing' as const, firedAt: 't1', windowMs: 60000 },
    ];
    const panels = buildAlertPanelData(alerts);
    assert.equal(panels[0].severity, 'P0');
    assert.equal(panels[0].count, 2);
    assert.equal(panels[1].severity, 'P1');
    assert.equal(panels[1].count, 1);
    assert.equal(panels[2].severity, 'P2');
    assert.equal(panels[2].count, 0);
  });

  it('AC-11 空 alerts 列表 → 全 0', () => {
    const panels = buildAlertPanelData([]);
    for (const p of panels) {
      assert.equal(p.count, 0);
      assert.equal(p.alerts.length, 0);
    }
  });
});
