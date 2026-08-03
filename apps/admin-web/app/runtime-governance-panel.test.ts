import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(): string {
  return readFileSync(resolve(__dirname, 'components/runtime-governance-panel.tsx'), 'utf-8');
}

describe('runtime-governance-panel — 正例·布局', () => {
  it('应包含 scope/label 信息', () => {
    const src = readSource();
    assert.ok(src.includes('scope') || src.includes('Scope') || src.includes('message') || src.includes('errorMessage'));
  });
  it('应显式展示 runtime 来源态', () => {
    const src = readSource();
    assert.ok(src.includes('Delivery {sourceEvidence.deliveryMode}'));
    assert.ok(src.includes('tenantContext 来源'));
    assert.ok(src.includes('getAdminWorkbenchConsumerSnapshot.tenantContext'));
    assert.ok(src.includes('fallbackTenantContext'));
  });
  it('应包含 panel wrapper', () => {
    const src = readSource();
    assert.ok(src.includes('panel') || src.includes('Panel'));
  });
  it('应包含 receipt display', () => {
    const src = readSource();
    assert.ok(src.includes('receipt') || src.includes('Receipt'));
  });
  it('应使用 React 组件', () => {
    const src = readSource();
    assert.ok(/useMemo/.test(src));
  });
  it('应接入 runtime client 与 receipt 摘要能力', () => {
    const src = readSource();
    assert.ok(src.includes('createRuntimeGovernancePanelClient'));
    assert.ok(src.includes('summarizeAdminRuntimeReceipt'));
    assert.ok(src.includes('RuntimeGovernancePanelTemplate'));
  });
});

describe('runtime-governance-panel — 边界·防御', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });
  it('应要求显式传入 deliveryMode', () => {
    const src = readSource();
    assert.ok(src.includes("deliveryMode: 'api' | 'fallback'"));
    assert.ok(src.includes('deliveryMode,'));
  });
  it('应保留 tenant 作用域摘要', () => {
    const src = readSource();
    assert.ok(src.includes('joinRuntimeScopeSummary'));
    assert.ok(src.includes("prefix: '当前租户：'"));
  });
});

describe('runtime-governance-panel — 反例', () => {
  it('fallback 路径应显式提示证据可信度风险', () => {
    const src = readSource();
    assert.ok(src.includes('fallback tenant context'));
    assert.ok(src.includes('需结合来源态判断证据可信度'));
  });
  it('缺少 tenantId 时仍保留 missing 文案兜底', () => {
    const src = readSource();
    assert.ok(src.includes("tenantContext.tenantId || 'missing'"));
  });
});
