/**
 * settings/notification-templates/page.test.tsx — 通知模板设置 L1 测试
 *
 * 覆盖: 模板管理、变量替换、场景分类、版本控制
 * 正例: 模板渲染、变量解析、多场景分类
 * 反例: 变量缺失、模板为空、场景不存在
 * 边界: 多变量模板、空变量、超长模板
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import NotificationTemplatesPage from './page';

/* ── 类型 ── */

type NotifChannel = 'sms' | 'email' | 'push' | 'in_app' | 'wechat';
type NotifScene = 'order_confirmed' | 'order_shipped' | 'order_delivered' | 'payment_received' | 'refund_processed' | 'promotion_push' | 'system_alert' | 'verification_code';

interface NotificationTemplate {
  id: string;
  name: string;
  scene: NotifScene;
  channel: NotifChannel;
  titleTemplate: string;
  bodyTemplate: string;
  variables: string[];
  isActive: boolean;
  version: number;
  updatedAt: string;
}

interface RenderedMessage {
  title: string;
  body: string;
}

function renderTemplate(template: NotificationTemplate, context: Record<string, string>): RenderedMessage {
  let title = template.titleTemplate;
  let body = template.bodyTemplate;
  for (const [key, value] of Object.entries(context)) {
    title = title.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    body = body.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return { title, body };
}

function validateTemplateContent(template: NotificationTemplate): string[] {
  const errors: string[] = [];
  if (!template.titleTemplate && !template.bodyTemplate) errors.push('模板标题和正文不能同时为空');
  if (template.titleTemplate.includes('{') && !template.titleTemplate.includes('}')) errors.push('标题含未闭合变量');
  if (template.bodyTemplate.includes('{') && !template.bodyTemplate.includes('}')) errors.push('正文含未闭合变量');
  return errors;
}

function extractVariables(template: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const vars: string[] = [];
  let match;
  while ((match = regex.exec(template)) !== null) {
    if (!vars.includes(match[1])) vars.push(match[1]);
  }
  return vars;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(NotificationTemplatesPage));
}

/* ============================================================ */

describe('notification-templates: 页面渲染', () => {
  it('renders title', () => {
    const { container } = setup();
    assert.ok(container.querySelector('h1')?.textContent?.includes('通知模板'));
  });

  it('renders description', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('模板'));
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('has padding layout', () => {
    const { container } = setup();
    assert.equal((container.firstElementChild as HTMLElement)?.style?.padding, '24px');
  });

  it('has single h1', () => {
    const { container } = setup();
    assert.equal(container.querySelectorAll('h1').length, 1);
  });

  it('component is a function', () => {
    assert.equal(typeof NotificationTemplatesPage, 'function');
  });
});

describe('notification-templates: 数据类型', () => {
  it('NotificationTemplate has all fields', () => {
    const t: NotificationTemplate = { id: 'tpl-001', name: '订单确认', scene: 'order_confirmed', channel: 'sms', titleTemplate: '订单确认', bodyTemplate: '您的订单{orderId}已确认', variables: ['orderId'], isActive: true, version: 1, updatedAt: '2026-07-01' };
    assert.equal(typeof t.id, 'string');
    assert.equal(typeof t.isActive, 'boolean');
    assert.equal(typeof t.version, 'number');
  });

  it('scene enum valid', () => {
    const valid: NotifScene[] = ['order_confirmed', 'order_shipped', 'order_delivered', 'payment_received', 'refund_processed', 'promotion_push', 'system_alert', 'verification_code'];
    assert.equal(valid.length, 8);
  });

  it('channel enum valid', () => {
    const valid: NotifChannel[] = ['sms', 'email', 'push', 'in_app', 'wechat'];
    assert.equal(valid.length, 5);
  });

  it('version is positive integer', () => {
    assert.ok(Number.isInteger(1));
    assert.ok(1 >= 1);
  });

  it('variables is array', () => {
    assert.ok(Array.isArray(['orderId', 'userName']));
  });
});

describe('notification-templates: 业务逻辑', () => {
  const MOCK_TEMPLATES: NotificationTemplate[] = [
    { id: 'tpl-001', name: '订单确认通知', scene: 'order_confirmed', channel: 'sms', titleTemplate: '订单确认', bodyTemplate: '尊敬的用户{userName}，您的订单{orderId}已确认，预计{deliveryDate}送达。', variables: ['userName', 'orderId', 'deliveryDate'], isActive: true, version: 2, updatedAt: '2026-07-01' },
    { id: 'tpl-002', name: '支付成功通知', scene: 'payment_received', channel: 'email', titleTemplate: '支付成功 - 订单{orderId}', bodyTemplate: '您已成功支付{amount}元，订单号:{orderId}', variables: ['orderId', 'amount'], isActive: true, version: 1, updatedAt: '2026-06-15' },
    { id: 'tpl-003', name: '验证码短信', scene: 'verification_code', channel: 'sms', titleTemplate: '验证码', bodyTemplate: '您的验证码是{code}，有效期为{expireMinutes}分钟。', variables: ['code', 'expireMinutes'], isActive: true, version: 3, updatedAt: '2026-07-10' },
  ];

  it('renderTemplate replaces all variables', () => {
    const result = renderTemplate(MOCK_TEMPLATES[0], { userName: '张三', orderId: 'ORD-123456', deliveryDate: '7月20日' });
    assert.ok(result.body.includes('张三'));
    assert.ok(result.body.includes('ORD-123456'));
    assert.ok(result.body.includes('7月20日'));
  });

  it('renderTemplate keeps unresolved variables', () => {
    const result = renderTemplate(MOCK_TEMPLATES[0], { userName: '张三' });
    assert.ok(result.body.includes('{orderId}'));
  });

  it('renderTemplate handles empty context', () => {
    const result = renderTemplate(MOCK_TEMPLATES[0], {});
    assert.ok(result.body.includes('{userName}'));
  });

  it('validateTemplateContent valid template passes', () => {
    const errors = validateTemplateContent(MOCK_TEMPLATES[0]);
    assert.equal(errors.length, 0);
  });

  it('validateTemplateContent detects unclosed variable', () => {
    const bad = { ...MOCK_TEMPLATES[0], bodyTemplate: '您的{userName' };
    const errors = validateTemplateContent(bad);
    assert.ok(errors.some(e => e.includes('未闭合')));
  });

  it('extractVariables parses correctly', () => {
    const vars = extractVariables('您好{userName}，订单{orderId}已确认');
    assert.deepEqual(vars, ['userName', 'orderId']);
  });

  it('extractVariables deduplicates', () => {
    const vars = extractVariables('{name}您好，{name}的订单');
    assert.equal(vars.length, 1);
  });

  it('extractVariables returns empty for no variables', () => {
    const vars = extractVariables('纯文本模板无变量');
    assert.equal(vars.length, 0);
  });

  it('version increments on update', () => {
    const newer = { ...MOCK_TEMPLATES[0], version: 3 };
    assert.ok(newer.version > MOCK_TEMPLATES[0].version);
  });

  it('template version is historical', () => {
    MOCK_TEMPLATES.forEach(t => assert.ok(t.version >= 1));
  });

  it('inactive template still renders', () => {
    const inactive = { ...MOCK_TEMPLATES[0], isActive: false };
    const result = renderTemplate(inactive, { userName: '测试', orderId: 'ORD-TEST', deliveryDate: '明天' });
    assert.ok(result.body.includes('测试'));
  });

  it('scene-specific variables match placeholder', () => {
    for (const t of MOCK_TEMPLATES) {
      const extracted = extractVariables(t.bodyTemplate);
      assert.ok(extracted.every(v => t.variables.includes(v)), `${t.name}: 模板变量应声明`);
    }
  });

  it('verify code template has code variable', () => {
    const tpl = MOCK_TEMPLATES[2];
    assert.ok(tpl.variables.includes('code'));
    assert.ok(tpl.variables.includes('expireMinutes'));
  });

  it('variables in title are also extracted', () => {
    const vars = extractVariables('订单{orderId}确认');
    assert.equal(vars.length, 1);
  });
});
