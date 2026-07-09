/**
 * ReturnStatusBadge 单元测试
 * 项目测试规范: node:test + renderToStaticMarkup
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReturnStatusBadge, type ReturnStatus, RETURN_STATUS_LABELS, RETURN_STATUS_COLORS } from './ReturnStatusBadge';

describe('ReturnStatusBadge', () => {
  const allStatuses: ReturnStatus[] = [
    'pending', 'approved', 'processing', 'shipped', 'received', 'completed', 'rejected',
  ];

  it('renders all status Chinese labels correctly', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<ReturnStatusBadge status={status} />);
      const expectedLabel = RETURN_STATUS_LABELS[status];
      assert.ok(html.includes(expectedLabel), `Status "${status}" label "${expectedLabel}" not found`);
    }
  });

  it('applies correct border color per status', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<ReturnStatusBadge status={status} />);
      const expectedColor = RETURN_STATUS_COLORS[status];
      assert.ok(html.includes(expectedColor), `Status "${status}" color "${expectedColor}" not found`);
    }
  });

  it('has rounded pill shape (borderRadius 999)', () => {
    const html = renderToStaticMarkup(<ReturnStatusBadge status="completed" />);
    assert.ok(html.includes('999'));
  });

  it('has data-testid attribute per status', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<ReturnStatusBadge status={status} />);
      assert.ok(html.includes(`data-testid="return-status-${status}"`));
    }
  });

  it('renders pending status with purple (#7c3aed)', () => {
    const html = renderToStaticMarkup(<ReturnStatusBadge status="pending" />);
    assert.ok(html.includes('待审核'));
    assert.ok(html.includes('#7c3aed'));
  });

  it('renders rejected status with deep red (#dc2626)', () => {
    const html = renderToStaticMarkup(<ReturnStatusBadge status="rejected" />);
    assert.ok(html.includes('已拒绝'));
    assert.ok(html.includes('#dc2626'));
  });

  it('renders completed status with green (#16a34a)', () => {
    const html = renderToStaticMarkup(<ReturnStatusBadge status="completed" />);
    assert.ok(html.includes('已完成'));
    assert.ok(html.includes('#16a34a'));
  });

  it('renders approved status with blue (#2563eb)', () => {
    const html = renderToStaticMarkup(<ReturnStatusBadge status="approved" />);
    assert.ok(html.includes('已通过'));
    assert.ok(html.includes('#2563eb'));
  });

  it('renders received status with emerald (#059669)', () => {
    const html = renderToStaticMarkup(<ReturnStatusBadge status="received" />);
    assert.ok(html.includes('已收货'));
    assert.ok(html.includes('#059669'));
  });
});
