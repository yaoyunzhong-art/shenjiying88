import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

function readSource(): string {
  const src = resolve(__dirname, 'page.tsx');
  return readFileSync(src, 'utf-8');
}

describe('MemberCenterPage', () => {
  it('has growth/progress/level structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('成长') || src.includes('progress') ||
      src.includes('level') || src.includes('等级') ||
      src.includes('MOCK_PROGRESS') || src.includes('growthValue'),
      'missing growth/level structure'
    );
  });

  it('has points structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('积分') || src.includes('Points') ||
      src.includes('points') || src.includes('MOCK_POINTS') ||
      src.includes('MOCK_POINTS_RECORDS'),
      'missing points structure'
    );
  });

  it('has cross-store activity structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('跨店') || src.includes('cross-store') ||
      src.includes('CrossStore') || src.includes('MOCK_CROSS_STORE'),
      'missing cross-store structure'
    );
  });

  it('has level/privilege structure', () => {
    const src = readSource();
    assert.ok(
      src.includes('等级') || src.includes('Level') ||
      src.includes('level') || src.includes('MOCK_LEVEL') ||
      src.includes('privilege') || src.includes('特权'),
      'missing level/privilege structure'
    );
  });
});
