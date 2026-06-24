import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

import type { SecretPosture, CertificatePosture } from './ConfigurationPosturePanel';
const { ConfigurationPosturePanel } = require('./ConfigurationPosturePanel');

// ---- helpers ----

function render(props: {
  secrets: SecretPosture;
  certificates: CertificatePosture;
  title?: string;
}): string {
  return renderToStaticMarkup(React.createElement(ConfigurationPosturePanel, props));
}

const HEALTHY_SECRETS: SecretPosture = { total: 24, rotationDue: 0, expired: 0 };
const HEALTHY_CERTS: CertificatePosture = { total: 12, expiringSoon: 0, expired: 0 };

const WARNING_SECRETS: SecretPosture = { total: 24, rotationDue: 3, expired: 0 };
const WARNING_CERTS: CertificatePosture = { total: 12, expiringSoon: 2, expired: 0 };

const DANGER_SECRETS: SecretPosture = { total: 24, rotationDue: 3, expired: 1 };
const DANGER_CERTS: CertificatePosture = { total: 12, expiringSoon: 2, expired: 1 };

// ---- tests ----

describe('ConfigurationPosturePanel', () => {
  // 正例：全部健康
  test('renders healthy status when no risks', () => {
    const markup = render({ secrets: HEALTHY_SECRETS, certificates: HEALTHY_CERTS });
    assert.match(markup, /健康/);
    assert.match(markup, /全部密钥处于健康状态/);
    assert.match(markup, /全部证书处于有效状态/);
  });

  // 正例：有警告
  test('renders warning status when rotation due or expiring soon', () => {
    const markup = render({ secrets: WARNING_SECRETS, certificates: WARNING_CERTS });
    assert.match(markup, /需关注/);
    assert.match(markup, /待轮换/);
    assert.match(markup, /即将到期/);
  });

  // 正例：有危险
  test('renders danger status when expired items exist', () => {
    const markup = render({ secrets: DANGER_SECRETS, certificates: DANGER_CERTS });
    assert.match(markup, /有风险/);
    assert.match(markup, /已过期/);
  });

  // 边界：空总数
  test('renders healthy for zero-total secrets and certs', () => {
    const markup = render({
      secrets: { total: 0, rotationDue: 0, expired: 0 },
      certificates: { total: 0, expiringSoon: 0, expired: 0 }
    });
    assert.match(markup, /健康/);
    assert.match(markup, /全部密钥处于健康状态/);
    assert.match(markup, /全部证书处于有效状态/);
  });

  // 边界：全部过期
  test('renders danger when all items are expired', () => {
    const markup = render({
      secrets: { total: 5, rotationDue: 0, expired: 5 },
      certificates: { total: 3, expiringSoon: 0, expired: 3 }
    });
    assert.match(markup, /有风险/);
  });

  // 边界：自定义标题
  test('renders custom title', () => {
    const markup = render({
      secrets: HEALTHY_SECRETS,
      certificates: HEALTHY_CERTS,
      title: '密钥与证书态势'
    });
    assert.match(markup, /密钥与证书态势/);
  });

  // 数据验证：数值正确渲染
  test('renders correct total counts', () => {
    const markup = render({ secrets: DANGER_SECRETS, certificates: DANGER_CERTS });
    // secrets total = 24, certs total = 12
    assert.match(markup, />24</);
    assert.match(markup, />12</);
    // healthy counts
    assert.match(markup, />20</); // secrets healthy = 24-3-1 = 20
    assert.match(markup, />9</);  // certs healthy = 12-2-1 = 9
  });

  // 数据验证：风险百分比文字
  test('renders risk percentage text', () => {
    const markup = render({ secrets: WARNING_SECRETS, certificates: HEALTHY_CERTS });
    // 3/24 = 12.5% → 13%
    assert.match(markup, /13% 密钥存在轮换或过期风险/);
  });

  // Progress 组件渲染
  test('renders progress bars for both sections', () => {
    const markup = render({ secrets: HEALTHY_SECRETS, certificates: HEALTHY_CERTS });
    const progressCount = (markup.match(/progressbar/g) || []).length;
    assert.equal(progressCount, 2);
  });

  // StatusBadge 渲染
  test('renders status badge with correct variant', () => {
    const healthyMarkup = render({ secrets: HEALTHY_SECRETS, certificates: HEALTHY_CERTS });
    assert.match(healthyMarkup, /健康/);

    const dangerMarkup = render({ secrets: DANGER_SECRETS, certificates: DANGER_CERTS });
    assert.match(dangerMarkup, /有风险/);
  });
});
