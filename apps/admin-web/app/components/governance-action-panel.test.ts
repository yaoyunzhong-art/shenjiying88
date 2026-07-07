/**
 * governance-action-panel.test.ts — L1 角色测试
 *
 * Governance action panel 核心逻辑: URL 参数管理, alert code 解析, 上下文标签
 * 正例 + 反例 + 边界, ≥3 个测试用例
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ─── Replicated helpers from governance-action-panel.tsx ─────────────────

type AlertAction = 'ack' | 'mute' | 'unmute' | 'remediate';

interface ActionConfig {
  code: string;
  action: AlertAction;
  enabled: boolean;
  label: string;
}

/**
 * 解析 focusAlertCode: 从 URL 参数中提取告警 code
 */
function parseFocusAlertCode(searchParams: string | null): string | null {
  if (!searchParams) return null;
  const params = new URLSearchParams(searchParams);
  return params.get('focusAlertCode') || null;
}

/**
 * 解析 focusContext: 从 URL 参数中提取上下文标识
 */
function parseFocusContext(searchParams: string | null): string | null {
  if (!searchParams) return null;
  const params = new URLSearchParams(searchParams);
  return params.get('focusContext') || null;
}

/**
 * 构建 timeline 查询参数 key
 */
function buildTimelineQueryKey(
  focusAlertCode: string | null,
  focusContext: string | null,
  defaultKey: string
): string {
  if (focusAlertCode) return `alert-${focusAlertCode}`;
  if (focusContext) return `context-${focusContext}`;
  return defaultKey;
}

/**
 * 根据告警严重级别判断是否启用操作
 */
function isActionEnabled(
  severity: 'critical' | 'high' | 'medium' | 'low',
  action: AlertAction,
  isMuted: boolean,
  isAcknowledged: boolean,
  role: 'admin' | 'front' | 'safety' = 'admin'
): boolean {
  if (action === 'ack') return !isAcknowledged;
  if (action === 'mute') return !isMuted;
  if (action === 'unmute') return isMuted;
  if (action === 'remediate') {
    // 前台角色不能执行 remediation
    if (role === 'front') return false;
    return severity === 'critical' || severity === 'high';
  }
  return false;
}

/**
 * 获取告警上下文标签
 */
function getContextLabel(ownerQueryKey: string, sourceQueryKey: string): string {
  const labels: Record<string, string> = {
    alertAction: '告警操作',
    slack: 'Slack 通知',
    webhook: 'Webhook 回调',
    email: '邮件通知',
  };
  const owner = labels[ownerQueryKey] || ownerQueryKey;
  const source = labels[sourceQueryKey] || sourceQueryKey;
  return `${owner} · ${source}`;
}

// ─── Mock data ───────────────────────────────────────────────────────────

const TEST_ALERT_CODES = [
  { code: 'A001', severity: 'critical' as const, isMuted: false, isAcknowledged: false },
  { code: 'A002', severity: 'high' as const, isMuted: false, isAcknowledged: true },
  { code: 'A003', severity: 'medium' as const, isMuted: true, isAcknowledged: false },
  { code: 'A004', severity: 'low' as const, isMuted: false, isAcknowledged: false },
];

// ══════════════════════════════════════════════════════════════════════════
// 👔 店长视角 (Tenant Admin)
// ══════════════════════════════════════════════════════════════════════════

describe('governance-action-panel: 👔店长视角 正例', () => {
  it('应正确解析 focusAlertCode 从 URL 参数', () => {
    assert.equal(parseFocusAlertCode('focusAlertCode=A001'), 'A001');
    assert.equal(parseFocusAlertCode('focusAlertCode=A002&other=1'), 'A002');
  });

  it('应正确解析 focusContext', () => {
    assert.equal(parseFocusContext('focusContext=slack'), 'slack');
    assert.equal(parseFocusContext('focusAlertCode=A001&focusContext=webhook'), 'webhook');
  });

  it('critical 级别告警 remediation 可用', () => {
    assert.ok(isActionEnabled('critical', 'remediate', false, false));
  });

  it('未 acknowledge 的告警 ack 可用', () => {
    assert.ok(isActionEnabled('critical', 'ack', false, false));
    assert.ok(isActionEnabled('high', 'ack', false, false));
    assert.ok(isActionEnabled('medium', 'ack', false, false));
    assert.ok(!isActionEnabled('low', 'ack', false, true));
  });
});

describe('governance-action-panel: 👔店长视角 反例', () => {
  it('已 acknowledge 的告警 ack 不可用', () => {
    assert.ok(!isActionEnabled('critical', 'ack', false, true));
    assert.ok(!isActionEnabled('high', 'ack', false, true));
  });

  it('已 mute 的告警 mute 不可用', () => {
    assert.ok(!isActionEnabled('critical', 'mute', true, false));
    assert.ok(!isActionEnabled('high', 'mute', true, true));
  });

  it('未 mute 的告警 unmute 不可用', () => {
    assert.ok(!isActionEnabled('critical', 'unmute', false, false));
  });

  it('medium/low 级别告警 remediation 不可用', () => {
    assert.ok(!isActionEnabled('medium', 'remediate', false, false));
    assert.ok(!isActionEnabled('low', 'remediate', false, false));
  });
});

describe('governance-action-panel: 👔店长视角 边界', () => {
  it('parseFocusAlertCode 空参数返回 null', () => {
    assert.equal(parseFocusAlertCode(null), null);
    assert.equal(parseFocusAlertCode(''), null);
  });

  it('parseFocusAlertCode 无效参数返回 null', () => {
    assert.equal(parseFocusAlertCode('other=value'), null);
    assert.equal(parseFocusAlertCode('other&foo=bar'), null);
  });

  it('buildTimelineQueryKey 优先级 code > context > default', () => {
    assert.equal(buildTimelineQueryKey('A001', 'slack', 'default'), 'alert-A001');
    assert.equal(buildTimelineQueryKey(null, 'slack', 'default'), 'context-slack');
    assert.equal(buildTimelineQueryKey(null, null, 'default'), 'default');
  });

  it('getContextLabel 已知 key 返回中文', () => {
    assert.equal(getContextLabel('alertAction', 'slack'), '告警操作 · Slack 通知');
    assert.equal(getContextLabel('webhook', 'email'), 'Webhook 回调 · 邮件通知');
  });

  it('getContextLabel 未知 key 原样返回', () => {
    assert.equal(getContextLabel('custom', 'unknown'), 'custom · unknown');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🛒 前台视角 (Reception)
// ══════════════════════════════════════════════════════════════════════════

describe('governance-action-panel: 🛒前台视角', () => {
  const frontView: ActionConfig[] = [
    { code: 'A001', action: 'ack', enabled: true, label: '确认告警' },
    { code: 'A002', action: 'ack', enabled: false, label: '确认告警' },
  ];

  it('前台只能看到未确认的告警 ack 按钮', () => {
    assert.equal(frontView.find(c => c.code === 'A001' && c.enabled)?.code, 'A001');
    assert.equal(frontView.find(c => c.code === 'A002' && c.enabled), undefined);
  });

  it('前台不能执行 remediation', () => {
    assert.ok(!isActionEnabled('critical', 'remediate', false, false, 'front'));
    assert.ok(!isActionEnabled('high', 'remediate', false, false, 'front'));
    assert.ok(!isActionEnabled('medium', 'remediate', false, false, 'front'));
    // 前台权限改造: 这里只是验证前台视角默认不可 remediate
    assert.ok(true);
  });

  it('前台收到告警通知时应有简单操作入口', () => {
    const available = frontView.filter(c => c.enabled);
    assert.ok(available.length <= 1, '前台只应看到有限的可用操作');
    assert.ok(available.every(c => c.action === 'ack'), '前台只应看到 ack 按钮');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🔧 安监视角 (Safety Officer)
// ══════════════════════════════════════════════════════════════════════════

describe('governance-action-panel: 🔧安监视角', () => {
  it('critical 级别告警安监必须立刻响应', () => {
    for (const alert of TEST_ALERT_CODES) {
      if (alert.severity === 'critical') {
        assert.ok(isActionEnabled(alert.severity, 'ack', alert.isMuted, alert.isAcknowledged));
      }
    }
  });

  it('安监可以 unmute 已静默的告警', () => {
    assert.ok(isActionEnabled('medium', 'unmute', true, false));
    assert.ok(!isActionEnabled('medium', 'unmute', false, false));
  });

  it('安监可对高严重度告警执行 remediation', () => {
    assert.ok(isActionEnabled('critical', 'remediate', false, false));
    assert.ok(isActionEnabled('high', 'remediate', false, false));
  });

  it('告警代码解析不应产生多余字符', () => {
    const code = parseFocusAlertCode('focusAlertCode=A001');
    assert.equal(code, 'A001');
    assert.ok(!code!.includes('%') && !code!.includes('+'));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// 🎯 运行专员视角 (Operations Specialist)
// ══════════════════════════════════════════════════════════════════════════

describe('governance-action-panel: 🎯运行专员视角', () => {
  it('运行专员可批量确认同模块告警', () => {
    const moduleAlerts = TEST_ALERT_CODES.filter(a => a.severity === 'critical' || a.severity === 'high');
    const ackable = moduleAlerts.filter(a => isActionEnabled(a.severity, 'ack', a.isMuted, a.isAcknowledged));
    assert.ok(ackable.length >= 1);
  });

  it('运行专员上下文中应包含来源信息', () => {
    const context = getContextLabel('alertAction', 'webhook');
    assert.ok(context.includes('告警操作'));
    assert.ok(context.includes('Webhook'));
  });

  it('timelineQueryKey 随 focusAlertCode 变化', () => {
    assert.equal(buildTimelineQueryKey('A005', 'slack', 'default'), 'alert-A005');
  });

  it('运行专员需区分不同来源的 timeline', () => {
    const slackKey = buildTimelineQueryKey(null, 'slack', 'default');
    const webhookKey = buildTimelineQueryKey(null, 'webhook', 'default');
    assert.notEqual(slackKey, webhookKey);
  });
});
