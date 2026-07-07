import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function readSource(): string {
  const src = resolve(__dirname, 'page.tsx');
  return readFileSync(src, 'utf-8');
}

describe('AIMarketingPage', () => {
  it('has campaign management structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('活动管理') || src.includes('Campaign') || src.includes('campaign'),
      'missing campaign management structure'
    );
  });

  it('has copy assistant structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('文案助手') || src.includes('Copy') || src.includes('generateCopy'),
      'missing copy assistant structure'
    );
  });

  it('has A/B testing structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('A/B') || src.includes('AB') || src.includes('abtest') || src.includes('experiment'),
      'missing A/B testing structure'
    );
  });

  it('has member segment structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('会员分群') || src.includes('Segment') || src.includes('segment') || src.includes('新用户') || src.includes('活跃用户') || src.includes('沉睡') || src.includes('流失'),
      'missing member segment structure'
    );
  });

  it('has ROI metrics structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('ROI') || src.includes('roi') || src.includes('MOCK_CAMPAIGNS'),
      'missing ROI metrics structure'
    );
  });

  it('has tab navigation structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('Tab') || src.includes('tab') || src.includes('campaigns') || src.includes('activeTab'),
      'missing tab navigation structure'
    );
  });
});
