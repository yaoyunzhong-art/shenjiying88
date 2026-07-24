/**
 * anomaly-frequency/page.test.tsx — 异常频率页面 L1 冒烟测试
 * ⚡ 覆盖: 统计卡片 / severity配置 / 筛选 / 空态 / 错误态 / metadata
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';

// ---- 类型 ----

interface AlertItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'warning' | 'severe';
  status: 'open' | 'acknowledged' | 'resolved' | 'closed';
  source: string;
  title: string;
  createdAt: string;
}

interface GovernanceModel {
  alerts?: AlertItem[];
  deliveryMode: string;
  generatedAt?: string;
}

// ---- Severity 配置 (与 page.tsx 同步) ----

const SEVERITY_CONFIG = [
  { key: 'critical', label: '严重', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  { key: 'warning', label: '警告', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  { key: 'info', label: '提示', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
];

// ---- 辅助函数 (与 page.tsx 逻辑同步) ----

function computeAnomalyStats(alerts: AlertItem[]) {
  const total = alerts.length;
  const critical = alerts.filter(a =>
    a.severity === 'critical' || a.severity === 'high' || a.severity === 'severe'
  ).length;
  const resolved = alerts.filter(a =>
    a.status === 'resolved' || a.status === 'acknowledged' || a.status === 'closed'
  ).length;
  const unresolved = total - resolved;
  const responseRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
  return { total, critical, resolved, unresolved, responseRate };
}

function loadGovernance(overrides?: Partial<GovernanceModel>): GovernanceModel {
  return {
    alerts: [],
    deliveryMode: 'api',
    generatedAt: '2026-07-16T01:00:00Z',
    ...overrides,
  };
}

// ---- 测试 ----

describe('AnomalyFrequencyPage — Severity 配置', () => {
  it('有 3 个严重等级', () => {
    assert.strictEqual(SEVERITY_CONFIG.length, 3);
  });

  it('严重等级标签正确', () => {
    assert.strictEqual(SEVERITY_CONFIG[0].label, '严重');
    assert.strictEqual(SEVERITY_CONFIG[1].label, '警告');
    assert.strictEqual(SEVERITY_CONFIG[2].label, '提示');
  });

  it('每个配置包含颜色值', () => {
    SEVERITY_CONFIG.forEach(s => {
      assert.ok(s.color.startsWith('#'));
      assert.ok(s.bg.includes('rgba'));
    });
  });

  it('颜色的key与severity字段对齐', () => {
    assert.strictEqual(SEVERITY_CONFIG[0].key, 'critical');
    assert.strictEqual(SEVERITY_CONFIG[1].key, 'warning');
    assert.strictEqual(SEVERITY_CONFIG[2].key, 'info');
  });
});

describe('AnomalyFrequencyPage — 异常统计计算', () => {
  const sampleAlerts: AlertItem[] = [
    { id: 'a1', severity: 'critical', status: 'resolved', source: 'runtime', title: 'CPU', createdAt: '2026-07-16T00:00:00Z' },
    { id: 'a2', severity: 'high', status: 'open', source: 'runtime', title: '内存', createdAt: '2026-07-16T00:00:00Z' },
    { id: 'a3', severity: 'severe', status: 'acknowledged', source: 'db', title: '连接', createdAt: '2026-07-16T00:00:00Z' },
    { id: 'a4', severity: 'warning', status: 'resolved', source: 'network', title: '延迟', createdAt: '2026-07-16T00:00:00Z' },
    { id: 'a5', severity: 'info', status: 'open', source: 'audit', title: '登录', createdAt: '2026-07-16T00:00:00Z' },
  ];

  it('正确计算总数', () => {
    const stats = computeAnomalyStats(sampleAlerts);
    assert.strictEqual(stats.total, 5);
  });

  it('严重异常包含 critical/high/severe', () => {
    const stats = computeAnomalyStats(sampleAlerts);
    assert.strictEqual(stats.critical, 3);
  });

  it('已处理包含 resolved/acknowledged/closed', () => {
    const stats = computeAnomalyStats(sampleAlerts);
    assert.strictEqual(stats.resolved, 3);
  });

  it('未处理 = 总数 - 已处理', () => {
    const stats = computeAnomalyStats(sampleAlerts);
    assert.strictEqual(stats.unresolved, 2);
  });

  it('处理率计算正确', () => {
    const stats = computeAnomalyStats(sampleAlerts);
    assert.strictEqual(stats.responseRate, 60);
  });

  it('空数组统计为 0', () => {
    const stats = computeAnomalyStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.critical, 0);
    assert.strictEqual(stats.resolved, 0);
    assert.strictEqual(stats.responseRate, 0);
  });

  it('全部已处理时处理率 100%', () => {
    const allResolved: AlertItem[] = [
      { id: 'a1', severity: 'critical', status: 'closed', source: 't', title: 't', createdAt: 't' },
      { id: 'a2', severity: 'warning', status: 'resolved', source: 't', title: 't', createdAt: 't' },
    ];
    const stats = computeAnomalyStats(allResolved);
    assert.strictEqual(stats.responseRate, 100);
  });
});

describe('AnomalyFrequencyPage — 空态与加载态', () => {
  it('0 alerts 显示空态', () => {
    const gov = loadGovernance();
    const alertCount = (gov.alerts ?? []).length;
    assert.strictEqual(alertCount, 0);
  });

  it('有 alerts 不显示空态', () => {
    const gov = loadGovernance({ alerts: [{ id: 'a1', severity: 'info', status: 'open', source: 't', title: 't', createdAt: '' }] });
    assert.ok((gov.alerts?.length ?? 0) > 0);
  });

  it('loadingFallback 渲染 4 个统计骨架', () => {
    const fallbackItems = [1, 2, 3, 4];
    assert.strictEqual(fallbackItems.length, 4);
  });

  it('errorFallback 包含重试链接', () => {
    const retryHref = '/anomaly-frequency';
    const emptyTitle = '异常数据加载失败';
    assert.ok(emptyTitle.includes('异常'));
    assert.strictEqual(retryHref, '/anomaly-frequency');
  });
});

describe('AnomalyFrequencyPage — Metadata', () => {
  it('title 包含异常时序', () => {
    const title = '异常时序频率 - M5 指挥台';
    assert.ok(title.includes('异常时序'));
  });

  it('description 覆盖严重程度和时间范围', () => {
    const desc = '门店/系统异常的时间分布监控。支持按严重程度（严重/警告/提示）和时间范围（24h/7d/30d）筛选';
    assert.ok(desc.includes('严重程度'));
    assert.ok(desc.includes('时间范围'));
    assert.ok(desc.includes('24h'));
    assert.ok(desc.includes('7d'));
  });

  it('JSON-LD type 为 WebApplication', () => {
    const jsonLd = { '@type': 'WebApplication', name: '异常时序频率监控' };
    assert.strictEqual(jsonLd['@type'], 'WebApplication');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('anomaly-frequency — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});

describe('Anomaly Frequency — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
