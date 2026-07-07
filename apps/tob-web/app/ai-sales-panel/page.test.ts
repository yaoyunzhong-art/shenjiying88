import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function readSource(file: string): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

describe('AISalesPanel', () => {
  it('has Tab navigation with 4 tabs', () => {
    const src = readSource('page.tsx');
    assert.ok(
      src.includes('智能推荐') && src.includes('异议处理') && src.includes('跟进任务') && src.includes('销售话术'),
      'missing tab navigation'
    );
  });

  it('has recommendation type toggle (upsell/crosssell)', () => {
    const data = readSource('ai-sales-data.ts');
    const svc = readSource('ai-sales-service.ts');
    assert.ok(
      data.includes('MOCK_RECOMMENDATIONS') && svc.includes('getUpsellRecommendations') && svc.includes('getCrossSellRecommendations'),
      'missing recommendation type toggle'
    );
  });

  it('has objection types (price/quality/competitor/need)', () => {
    const src = readSource('page.tsx');
    assert.ok(
      src.includes('价格') && src.includes('质量') && src.includes('竞品') && src.includes('需求'),
      'missing objection types'
    );
  });

  it('has RequiredProduct type and MOCK data', () => {
    const data = readSource('ai-sales-data.ts');
    assert.ok(
      data.includes('RecommendedProduct') && data.includes('MOCK_RECOMMENDATIONS') && data.includes('MOCK_OBJECTIONS'),
      'missing RequiredProduct type or MOCK data'
    );
  });

  it('has ObjectionCase with aiResponse field', () => {
    const data = readSource('ai-sales-data.ts');
    assert.ok(
      data.includes('ObjectionCase') && data.includes('aiResponse'),
      'missing ObjectionCase type or aiResponse field'
    );
  });

  it('has service functions', () => {
    const service = readSource('ai-sales-service.ts');
    assert.ok(
      service.includes('getRecommendations') &&
      service.includes('getUpsellRecommendations') &&
      service.includes('getCrossSellRecommendations') &&
      service.includes('handleObjection') &&
      service.includes('getFollowUps') &&
      service.includes('completeFollowUp') &&
      service.includes('getSalesScript'),
      'missing service functions'
    );
  });
});
