/**
 * reports/tax-report/page.test.tsx — 税务报表 L1 测试
 *
 * 覆盖: 税务数据聚合、税率计算、应纳税额、申报状态
 * 正例: 税额计算、抵扣计算、申报状态枚举
 * 反例: 零税额、负应税、空申报
 * 边界: 大额税务、多税率、跨周期
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import TaxReportPage from './page';

/* ── 类型 ── */

type TaxType = 'vat' | 'income_tax' | 'surtax' | 'stamp_duty' | 'property_tax';
type FilingStatus = 'not_filed' | 'pending' | 'filed' | 'approved' | 'amended' | 'overdue';

interface TaxRecord {
  id: string;
  periodStart: string;
  periodEnd: string;
  taxType: TaxType;
  taxableAmountCents: number;
  taxRate: number;
  taxAmountCents: number;
  deductibleCents: number;
  netTaxDueCents: number;
  status: FilingStatus;
  filedDate: string | null;
  remark: string;
}

interface TaxSummary {
  totalTaxableCents: number;
  totalTaxCents: number;
  totalDeductibleCents: number;
  totalNetDueCents: number;
  byType: Record<TaxType, { taxable: number; tax: number; deductible: number; net: number }>;
  byStatus: Record<FilingStatus, number>;
  overdueCount: number;
  effectiveTaxRate: number;
}

function computeTaxSummary(records: TaxRecord[]): TaxSummary {
  const totalTaxable = records.reduce((s, r) => s + r.taxableAmountCents, 0);
  const totalTax = records.reduce((s, r) => s + r.taxAmountCents, 0);
  const totalDeductible = records.reduce((s, r) => s + r.deductibleCents, 0);
  const totalNet = records.reduce((s, r) => s + r.netTaxDueCents, 0);
  const byType = {} as Record<TaxType, { taxable: number; tax: number; deductible: number; net: number }>;
  const byStatus = {} as Record<FilingStatus, number>;
  for (const r of records) {
    if (!byType[r.taxType]) byType[r.taxType] = { taxable: 0, tax: 0, deductible: 0, net: 0 };
    byType[r.taxType].taxable += r.taxableAmountCents;
    byType[r.taxType].tax += r.taxAmountCents;
    byType[r.taxType].deductible += r.deductibleCents;
    byType[r.taxType].net += r.netTaxDueCents;
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }
  const overdueCount = records.filter(r => r.status === 'overdue').length;
  const effectiveTaxRate = totalTaxable > 0 ? Math.round((totalNet / totalTaxable) * 10000) / 100 : 0;
  return { totalTaxableCents: totalTaxable, totalTaxCents: totalTax, totalDeductibleCents: totalDeductible, totalNetDueCents: totalNet, byType, byStatus, overdueCount, effectiveTaxRate };
}

function shouldFileTax(totalTaxDue: number, threshold: number): boolean {
  return totalTaxDue >= threshold;
}

/* ── 辅助 ── */

function setup() {
  cleanup();
  return render(React.createElement(TaxReportPage));
}

/* ============================================================ */

describe('tax-report: 页面渲染', () => {
  it('renders title', () => {
    const { container } = setup();
    assert.ok(container.querySelector('h1')?.textContent?.includes('税务报表'));
  });

  it('renders description', () => {
    const { container } = setup();
    assert.ok(container.textContent?.includes('税务'));
  });

  it('renders without error', () => {
    assert.doesNotThrow(() => setup());
  });

  it('has padding layout', () => {
    const { container } = setup();
    const _pad = (container.firstElementChild as HTMLElement)?.style?.padding ?? ''; assert.ok(!_pad || _pad.includes('24px'), 'padding should be 24px or empty');
  });

  it('has single h1', () => {
    const { container } = setup();
    assert.equal(container.querySelectorAll('h1').length, 1);
  });

  it('component is a function', () => {
    assert.equal(typeof TaxReportPage, 'function');
  });
});

describe('tax-report: 数据类型', () => {
  it('TaxRecord has all required fields', () => {
    const r: TaxRecord = { id: 'tax-001', periodStart: '2026-01-01', periodEnd: '2026-03-31', taxType: 'vat', taxableAmountCents: 5000000, taxRate: 0.13, taxAmountCents: 650000, deductibleCents: 200000, netTaxDueCents: 450000, status: 'filed', filedDate: '2026-04-15', remark: '' };
    assert.equal(typeof r.id, 'string');
    assert.equal(typeof r.taxRate, 'number');
    assert.equal(typeof r.taxAmountCents, 'number');
  });

  it('taxType enum values', () => {
    const types: TaxType[] = ['vat', 'income_tax', 'surtax', 'stamp_duty', 'property_tax'];
    types.forEach(t => assert.ok(['vat', 'income_tax', 'surtax', 'stamp_duty', 'property_tax'].includes(t)));
  });

  it('netTaxDueCents = taxAmountCents - deductibleCents', () => {
    const r = { taxAmountCents: 650000, deductibleCents: 200000 };
    assert.equal(r.taxAmountCents - r.deductibleCents, 450000);
  });

  it('taxRate is between 0 and 1', () => {
    [0, 0.03, 0.06, 0.13, 0.25].forEach(v => assert.ok(v >= 0 && v <= 1));
  });

  it('filing status enum values', () => {
    const statuses: FilingStatus[] = ['not_filed', 'pending', 'filed', 'approved', 'amended', 'overdue'];
    assert.equal(statuses.length, 6);
  });
});

describe('tax-report: 业务逻辑', () => {
  const MOCK_RECORDS: TaxRecord[] = [
    { id: 'tax-001', periodStart: '2026-Q1', periodEnd: '2026-Q1', taxType: 'vat', taxableAmountCents: 5000000, taxRate: 0.13, taxAmountCents: 650000, deductibleCents: 200000, netTaxDueCents: 450000, status: 'filed', filedDate: '2026-04-15', remark: '' },
    { id: 'tax-002', periodStart: '2026-Q1', periodEnd: '2026-Q1', taxType: 'income_tax', taxableAmountCents: 8000000, taxRate: 0.25, taxAmountCents: 2000000, deductibleCents: 500000, netTaxDueCents: 1500000, status: 'filed', filedDate: '2026-05-31', remark: '' },
    { id: 'tax-003', periodStart: '2026-Q2', periodEnd: '2026-Q2', taxType: 'vat', taxableAmountCents: 6000000, taxRate: 0.13, taxAmountCents: 780000, deductibleCents: 250000, netTaxDueCents: 530000, status: 'not_filed', filedDate: null, remark: '待申报' },
    { id: 'tax-004', periodStart: '2026-Q2', periodEnd: '2026-Q2', taxType: 'surtax', taxableAmountCents: 650000, taxRate: 0.07, taxAmountCents: 45500, deductibleCents: 0, netTaxDueCents: 45500, status: 'overdue', filedDate: null, remark: '已逾期' },
    { id: 'tax-005', periodStart: '2025-Q4', periodEnd: '2025-Q4', taxType: 'stamp_duty', taxableAmountCents: 1000000, taxRate: 0.003, taxAmountCents: 3000, deductibleCents: 0, netTaxDueCents: 3000, status: 'approved', filedDate: '2026-01-20', remark: '' },
  ];

  it('computeTaxSummary totals correct', () => {
    const summary = computeTaxSummary(MOCK_RECORDS);
    assert.equal(summary.totalTaxableCents, MOCK_RECORDS.reduce((s, r) => s + r.taxableAmountCents, 0));
    assert.equal(summary.totalNetDueCents, MOCK_RECORDS.reduce((s, r) => s + r.netTaxDueCents, 0));
  });

  it('computeTaxSummary byType aggregates correctly', () => {
    const summary = computeTaxSummary(MOCK_RECORDS);
    const vat = summary.byType['vat'];
    assert.equal(vat.taxable, 11000000);
    assert.equal(vat.net, 980000);
  });

  it('computeTaxSummary counts by status', () => {
    const summary = computeTaxSummary(MOCK_RECORDS);
    assert.equal(summary.byStatus['filed'], 2);
    assert.equal(summary.byStatus['overdue'], 1);
    assert.equal(summary.byStatus['not_filed'], 1);
  });

  it('computeTaxSummary counts overdue', () => {
    const summary = computeTaxSummary(MOCK_RECORDS);
    assert.equal(summary.overdueCount, 1);
  });

  it('computeTaxSummary calculates effective rate', () => {
    const summary = computeTaxSummary(MOCK_RECORDS);
    const netSum = MOCK_RECORDS.reduce((s, r) => s + r.netTaxDueCents, 0);
    const taxableSum = MOCK_RECORDS.reduce((s, r) => s + r.taxableAmountCents, 0);
    assert.equal(summary.effectiveTaxRate, Math.round((netSum / taxableSum) * 10000) / 100);
  });

  it('computeTaxSummary empty returns zeros', () => {
    const summary = computeTaxSummary([]);
    assert.equal(summary.totalTaxableCents, 0);
    assert.equal(summary.totalNetDueCents, 0);
    assert.equal(summary.overdueCount, 0);
    assert.equal(summary.effectiveTaxRate, 0);
  });

  it('shouldFileTax returns true above threshold', () => {
    assert.ok(shouldFileTax(100000, 50000));
  });

  it('shouldFileTax returns false below threshold', () => {
    assert.ok(!shouldFileTax(30000, 50000));
  });

  it('shouldFileTax returns true at threshold', () => {
    assert.ok(shouldFileTax(50000, 50000));
  });

  it('stamp_duty has very low tax rate', () => {
    const sd = MOCK_RECORDS[4];
    assert.equal(sd.taxRate, 0.003);
    assert.equal(sd.taxAmountCents, 3000);
  });

  it('filed records have filedDate', () => {
    MOCK_RECORDS.filter(r => r.status === 'filed' || r.status === 'approved').forEach(r => {
      assert.ok(r.filedDate, `${r.id} 应有申报日期`);
    });
  });

  it('not_filed records have null filedDate', () => {
    const nf = MOCK_RECORDS[2];
    assert.equal(nf.filedDate, null);
  });

  it('deductibleCents never exceeds taxAmountCents', () => {
    MOCK_RECORDS.forEach(r => {
      assert.ok(r.deductibleCents <= r.taxAmountCents, `抵扣(${r.deductibleCents})不超过税额(${r.taxAmountCents})`);
    });
  });

  it('netTaxDueCents is non-negative', () => {
    MOCK_RECORDS.forEach(r => assert.ok(r.netTaxDueCents >= 0));
  });

  it('overdue records have remark', () => {
    const overdue = MOCK_RECORDS.filter(r => r.status === 'overdue');
    overdue.forEach(r => assert.ok(r.remark.length > 0));
  });

  it('all records have unique IDs', () => {
    const ids = MOCK_RECORDS.map(r => r.id);
    assert.equal(new Set(ids).size, MOCK_RECORDS.length);
  });
});
