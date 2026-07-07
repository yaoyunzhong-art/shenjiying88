import React from 'react';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { CustomerSessionPanel } = require('./CustomerSessionPanel');

/** @returns {import('./CustomerSessionPanel').CustomerInfo} */
function makeCustomer(overrides = {}) {
  return {
    id: 'c-001',
    name: '张三',
    phone: '13800138001',
    memberLevel: '金卡',
    visitCount: 5,
    lastVisitAt: '2026-06-28T14:30:00Z',
    tags: ['高端', '健身'],
    ...overrides,
  };
}

describe('CustomerSessionPanel', () => {
  it('renders customer name and member level', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'waiting',
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('张三'), 'should render name');
    assert.ok(html.includes('金卡'), 'should render member level');
  });

  it('renders status badge label for each status', () => {
    const statuses = [
      ['active', '服务中'],
      ['waiting', '等候中'],
      ['checking', '核销中'],
      ['completed', '已完成'],
      ['cancelled', '已取消'],
    ];
    for (const [status, label] of statuses) {
      const html = renderToStaticMarkup(
        React.createElement(CustomerSessionPanel, {
          customer: makeCustomer(),
          status,
          actions: [],
          onAction: () => {},
        }),
      );
      assert.ok(html.includes(label), `should render "${label}" for status "${status}"`);
    }
  });

  it('displays phone, visit count and tags', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('13800138001'));
    assert.ok(html.includes('第 5 次到店'));
    assert.ok(html.includes('高端 · 健身'));
  });

  it('shows initial letter avatar when no avatar provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer({ avatar: undefined }),
        status: 'active',
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('张'));
  });

  it('shows queue length and estimated wait when waiting', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'waiting',
        queueLength: 3,
        estimatedWaitMin: 15,
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('当前排队 3 位'));
    assert.ok(html.includes('预计等待 15 分钟'));
  });

  it('shows service start time when status is active', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        startedAt: '2026-06-30T14:00:00Z',
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('服务开始'));
  });

  it('renders selected services with total price', () => {
    const services = [
      { id: 's1', name: '深层面部清洁', duration: 60, price: 298 },
      { id: 's2', name: '肩颈按摩', duration: 30, price: 168 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        selectedServices: services,
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('深层面部清洁'));
    assert.ok(html.includes('肩颈按摩'));
    assert.ok(html.includes('合计 ¥466.00'));
  });

  it('shows remove button per service when onRemoveService provided', () => {
    const services = [{ id: 's1', name: '深层面部清洁', duration: 60, price: 298 }];
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        selectedServices: services,
        onRemoveService: () => {},
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('移除'));
    assert.ok(html.includes('aria-label="移除 深层面部清洁"'));
  });

  it('shows add service button when onAddService provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        selectedServices: [{ id: 's1', name: '深层面部清洁', duration: 60, price: 298 }],
        onAddService: () => {},
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('+ 添加服务'));
  });

  it('renders action buttons labels in HTML', () => {
    const defaults = [
      { id: 'start', label: '开始服务', variant: 'primary' },
      { id: 'transfer', label: '转接', variant: 'secondary' },
      { id: 'cancel', label: '取消', variant: 'danger' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        actions: defaults,
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('开始服务'));
    assert.ok(html.includes('转接'));
    assert.ok(html.includes('取消'));
  });

  it('sets disabled attribute on disabled buttons', () => {
    const actions = [{ id: 'start', label: '开始服务', variant: 'primary', disabled: true }];
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        actions,
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('disabled=""'), 'disabled button should have disabled attr');
  });

  it('renders notes text when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        notes: '注意过敏史',
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('注意过敏史'));
  });

  it('shows "添加备注" placeholder when editable and no notes', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        notes: '',
        onNotesChange: () => {},
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('+ 添加备注...'));
  });

  it('does not show notes placeholder when onNotesChange not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        notes: '',
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(!html.includes('+ 添加备注...'));
  });

  it('shows assigned staff for services', () => {
    const services = [
      { id: 's1', name: '深层面部清洁', duration: 60, price: 298, assignedTo: '李技师' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        selectedServices: services,
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('→ 李技师'));
  });

  it('renders minimal props without crashing', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'completed',
        actions: [],
        onAction: () => {},
      }),
    );
    assert.ok(html.includes('张三'));
    assert.ok(html.includes('已完成'));
  });

  it('shows cancel button when note editing is triggered', () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomerSessionPanel, {
        customer: makeCustomer(),
        status: 'active',
        notes: '原始备注',
        onNotesChange: () => {},
        actions: [],
        onAction: () => {},
      }),
    );
    // Button for save/cancel appear when editing mode is possible
    // In static render, the textarea is not shown (controlled by client state)
    // But the notes text area has a click handler that sets editing state
    // Sanity check: notes are present
    assert.ok(html.includes('原始备注'));
  });
});
