import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'governance-linked-overview.tsx'), 'utf-8');

describe('governance-linked-overview source evidence', () => {
  it('显式展示治理联动来源态', () => {
    assert.ok(SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(SRC.includes('治理联动来源'));
    assert.ok(SRC.includes('snapshot.governance'));
    assert.ok(SRC.includes('fallback governance snapshot'));
  });

  it('保留 generatedAt 与说明文案', () => {
    assert.ok(SRC.includes('generatedAt'));
    assert.ok(SRC.includes('治理联动概览当前直接消费 bootstrap governance 快照'));
    assert.ok(SRC.includes('治理联动概览当前回退到 fallback governance 快照'));
  });

  it('继续向 GovernanceActionPanel 透传初始治理快照', () => {
    assert.ok(SRC.includes('<GovernanceActionPanel'));
    assert.ok(SRC.includes('initialGovernance={governance}'));
    assert.ok(SRC.includes('timelineQueryKey={timelineQueryKey}'));
  });
});
