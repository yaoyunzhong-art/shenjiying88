/**
 * ReportStatusBadge 单元测试
 * 项目测试规范: node:test + renderToStaticMarkup
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ReportStatusBadge,
  type ReportStatus,
  REPORT_STATUS_LABEL,
  REPORT_STATUS_COLOR,
} from './ReportStatusBadge';

describe('ReportStatusBadge', () => {
  const allStatuses: ReportStatus[] = ['generated', 'generating', 'failed', 'expired'];

  it('renders all status Chinese labels correctly', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<ReportStatusBadge status={status} />);
      assert.ok(html.includes(REPORT_STATUS_LABEL[status]), `Status "${status}" label not found`);
    }
  });

  it('applies correct background and foreground colors per status', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<ReportStatusBadge status={status} />);
      const color = REPORT_STATUS_COLOR[status];
      assert.ok(html.includes(color.bg), `Status "${status}" bg "${color.bg}" not found`);
      assert.ok(html.includes(color.fg), `Status "${status}" fg "${color.fg}" not found`);
    }
  });

  it('has data-testid attribute per status', () => {
    for (const status of allStatuses) {
      const html = renderToStaticMarkup(<ReportStatusBadge status={status} />);
      assert.ok(html.includes(`data-testid="report-status-badge-${status}"`));
    }
  });

  it('has rounded pill style (borderRadius 12)', () => {
    const html = renderToStaticMarkup(<ReportStatusBadge status="generated" />);
    assert.ok(html.includes('12'));
  });

  it('renders generated status with green background', () => {
    const html = renderToStaticMarkup(<ReportStatusBadge status="generated" />);
    assert.ok(html.includes('已生成'));
    assert.ok(html.includes('#dcfce7')); // bg
    assert.ok(html.includes('#166534')); // fg
  });

  it('renders generating status with blue background', () => {
    const html = renderToStaticMarkup(<ReportStatusBadge status="generating" />);
    assert.ok(html.includes('生成中'));
    assert.ok(html.includes('#dbeafe')); // bg
    assert.ok(html.includes('#1e40af')); // fg
  });

  it('renders failed status with red background', () => {
    const html = renderToStaticMarkup(<ReportStatusBadge status="failed" />);
    assert.ok(html.includes('失败'));
    assert.ok(html.includes('#fef2f2')); // bg
    assert.ok(html.includes('#991b1b')); // fg
  });

  it('renders expired status with gray background', () => {
    const html = renderToStaticMarkup(<ReportStatusBadge status="expired" />);
    assert.ok(html.includes('已过期'));
    assert.ok(html.includes('#f3f4f6')); // bg
    assert.ok(html.includes('#6b7280')); // fg
  });
});
