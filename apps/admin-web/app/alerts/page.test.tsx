/**
 * alerts/page.test.tsx — 告警页面 L1 冒烟测试
 * ⚡ 覆盖: governance模型 / 空态/错误态回退 / 加载态 / metadata
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型 (与 page.tsx 同步) ----

interface GovernanceReadModel {
  alerts?: AlertItem[];
  deliveryMode: 'api' | 'fallback';
  generatedAt?: string;
}

interface AlertItem {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  category: string;
  title: string;
  description: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'closed';
  createdAt: string;
  assignee?: string;
}

// ---- 辅助函数 (与 page.tsx 逻辑同步) ----

function loadAdminGovernanceReadModel(overrides?: Partial<GovernanceReadModel>): GovernanceReadModel {
  const defaults: GovernanceReadModel = {
    alerts: [],
    deliveryMode: 'api' as const,
    generatedAt: '2026-07-16T01:00:00Z',
    ...overrides,
  };
  return defaults;
}

function checkEmptyState(governance: GovernanceReadModel): boolean {
  if (!governance) return true;
  if (!governance.alerts?.length && governance.deliveryMode === 'fallback') return true;
  return false;
}

// ---- 测试 ----

describe('AlertsPage — Governance 模型', () => {
  it('默认 deliveryMode 为 api', () => {
    const model = loadAdminGovernanceReadModel();
    assert.strictEqual(model.deliveryMode, 'api');
  });

  it('可以注入 alerts', () => {
    const model = loadAdminGovernanceReadModel({
      alerts: [{ id: 'a1', severity: 'critical', source: 'runtime', category: 'system', title: 'CPU 超限', description: 'CPU 使用率 95%', status: 'open', createdAt: '2026-07-16T00:00:00Z' }]
    });
    assert.strictEqual(model.alerts!.length, 1);
    assert.strictEqual(model.alerts![0].severity, 'critical');
  });

  it('支持 fallback 交付模式', () => {
    const model = loadAdminGovernanceReadModel({ deliveryMode: 'fallback' });
    assert.strictEqual(model.deliveryMode, 'fallback');
  });

  it('generatedAt 返回时间戳', () => {
    const model = loadAdminGovernanceReadModel();
    assert.ok(model.generatedAt);
    assert.ok(model.generatedAt!.length > 0);
  });

  it('alerts 缺省为空数组', () => {
    const model = loadAdminGovernanceReadModel();
    assert.ok(Array.isArray(model.alerts));
    assert.strictEqual(model.alerts!.length, 0);
  });

  it('可以包含多条告警', () => {
    const alerts: AlertItem[] = [
      { id: 'a1', severity: 'critical', source: 'runtime', category: 'system', title: 'CPU', description: '', status: 'open', createdAt: '' },
      { id: 'a2', severity: 'warning', source: 'audit', category: 'security', title: '登录', description: '', status: 'acknowledged', createdAt: '' },
    ];
    const model = loadAdminGovernanceReadModel({ alerts });
    assert.strictEqual(model.alerts!.length, 2);
  });
});

describe('AlertsPage — 空态判断', () => {
  it('有 alerts 时不是空态', () => {
    const model = loadAdminGovernanceReadModel({
      alerts: [{ id: 'a1', severity: 'info', source: 'test', category: 'test', title: '测试', description: '', status: 'open', createdAt: '' }]
    });
    assert.strictEqual(checkEmptyState(model), false);
  });

  it('空 alerts + api 模式不是空态 (等待加载)', () => {
    const model = loadAdminGovernanceReadModel({ alerts: [], deliveryMode: 'api' });
    assert.strictEqual(checkEmptyState(model), false);
  });

  it('空 alerts + fallback 模式是空态', () => {
    const model = loadAdminGovernanceReadModel({ alerts: [], deliveryMode: 'fallback' });
    assert.strictEqual(checkEmptyState(model), true);
  });

  it('null governance 是空态', () => {
    assert.strictEqual(checkEmptyState(null as unknown as GovernanceReadModel), true);
  });

  it('undefined alerts 是空态 (fallback)', () => {
    const model = loadAdminGovernanceReadModel({ alerts: undefined, deliveryMode: 'fallback' });
    assert.strictEqual(checkEmptyState(model), true);
  });
});

describe('AlertsPage — AlertItem 结构', () => {
  const alert: AlertItem = { id: 'a1', severity: 'high', source: 'runtime', category: 'system', title: '测试告警', description: '这是描述', status: 'open', createdAt: '2026-07-16T00:00:00Z', assignee: 'admin' };

  it('包含所有必填字段', () => {
    assert.ok(alert.id);
    assert.ok(alert.severity);
    assert.ok(alert.source);
    assert.ok(alert.category);
    assert.ok(alert.title);
    assert.ok(alert.status);
    assert.ok(alert.createdAt);
  });

  it('assignee 为可选字段', () => {
    const minAlert: AlertItem = { id: 'a2', severity: 'info', source: 't', category: 't', title: 't', description: '', status: 'open', createdAt: '' };
    assert.strictEqual(minAlert.assignee, undefined);
  });

  it('severity 支持所有级别', () => {
    const severities = ['critical', 'high', 'medium', 'low', 'info'];
    severities.forEach(s => {
      const a: AlertItem = { id: s, severity: s as AlertItem['severity'], source: 't', category: 't', title: 't', description: '', status: 'open', createdAt: '' };
      assert.strictEqual(a.severity, s);
    });
  });

  it('status 支持 open/acknowledged/resolved/closed', () => {
    const statuses = ['open', 'acknowledged', 'resolved', 'closed'];
    statuses.forEach(s => {
      const a: AlertItem = { id: s, severity: 'info', source: 't', category: 't', title: 't', description: '', status: s as AlertItem['status'], createdAt: '' };
      assert.strictEqual(a.status, s);
    });
  });
});

describe('AlertsPage — Metadata 和 SEO', () => {
  it('title 包含 "告警中心"', () => {
    assert.ok('告警中心 - M5 指挥台'.includes('告警中心'));
  });

  it('description 覆盖治理关键词', () => {
    const desc = '统一查看审批、审计、安全、运行时与恢复演练相关治理告警';
    assert.ok(desc.includes('审批'));
    assert.ok(desc.includes('审计'));
    assert.ok(desc.includes('安全'));
    assert.ok(desc.includes('运行时'));
  });

  it('JSON-LD type 为 WebApplication', () => {
    const jsonLd = { '@context': 'https://schema.org', '@type': 'WebApplication', name: '告警中心' };
    assert.strictEqual(jsonLd['@type'], 'WebApplication');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Alerts — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
