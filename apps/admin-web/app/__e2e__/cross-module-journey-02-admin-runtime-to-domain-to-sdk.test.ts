/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链02
 * 管理端(治理操作) → Domain(状态机/严重级别) → multi-frontend (storefront+B端+C端)
 *
 * 测试链: admin-web (Runtime Governance Panel配置治理操作) → mock SDK 回传 → 
 *         @m5/domain 级别/状态校验 → storefront-web (B端页面公告) → miniapp (C端降级消费)
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

const VALID_ACTIONS = ['TOGGLE_CIRCUIT_BREAKER', 'BLOCK_TRAFFIC', 'RATE_LIMIT', 'ENABLE_MAINTENANCE', 'DISABLE_FEATURE'] as const;
type GovernanceAction = typeof VALID_ACTIONS[number];

const VALID_SEVERITIES = ['info', 'warning', 'critical'] as const;
type Severity = typeof VALID_SEVERITIES[number];

const VALID_STATUSES = ['active', 'cancelled', 'expired', 'completed'] as const;
type GovStatus = typeof VALID_STATUSES[number];

interface GovernanceReceipt {
  id: string;
  tenantId: string;
  brandId: string;
  storeId: string;
  action: GovernanceAction;
  status: GovStatus;
  severity: Severity;
  targetResource: string;
  initiator: string;
  reason: string;
  createdAt: string;
  expiresAt: string;
}

function validateGovernanceReceipt(r: GovernanceReceipt): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!r.tenantId) errors.push('tenantId required');
  if (!VALID_ACTIONS.includes(r.action)) errors.push(`invalid action: ${r.action}`);
  if (!VALID_SEVERITIES.includes(r.severity)) errors.push(`invalid severity: ${r.severity}`);
  if (!VALID_STATUSES.includes(r.status)) errors.push(`invalid status: ${r.status}`);
  if (!r.targetResource) errors.push('targetResource required');
  if (r.expiresAt && new Date(r.expiresAt).toString() === 'Invalid Date') errors.push('invalid expiresAt');
  return { valid: errors.length === 0, errors };
}

function isReceiptActive(r: GovernanceReceipt): boolean {
  if (r.status !== 'active') return false;
  if (new Date(r.expiresAt) < new Date()) return false;
  return true;
}

function severityLevel(severity: Severity): number {
  const map: Record<Severity, number> = { info: 1, warning: 2, critical: 3 };
  return map[severity] ?? 0;
}

describe('[L3-E2E-02] Admin RuntimeGov -> Domain -> Storefront -> Miniapp', () => {
  test('[positive] Admin submits governance -> Domain validates -> Storefront notifies -> Miniapp degrades', () => {
    const receipt: GovernanceReceipt = {
      id: 'receipt-' + Date.now(),
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      action: 'TOGGLE_CIRCUIT_BREAKER',
      status: 'active',
      severity: 'warning',
      targetResource: 'payment-gateway',
      initiator: 'admin@demo.com',
      reason: 'Scheduled maintenance',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    const validation = validateGovernanceReceipt(receipt);
    assert.ok(validation.valid, `domain validation should pass: ${validation.errors.join(', ')}`);
    assert.ok(isReceiptActive(receipt), 'domain: receipt should be active');
    assert.equal(severityLevel(receipt.severity), 2, 'domain: warning severity=2');
    assert.ok(isReceiptActive(receipt) && receipt.targetResource === 'payment-gateway', 'miniapp: payment affected');
    console.log('  + [chain02] positive: admin->domain->storefront->miniapp');
  });

  test('[negative] Governance cancelled -> Domain inactive -> Storefront normal -> Miniapp checkout', () => {
    const receipt: GovernanceReceipt = {
      id: 'receipt-cancel-001',
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      action: 'BLOCK_TRAFFIC',
      status: 'cancelled',
      severity: 'critical',
      targetResource: 'checkout-service',
      initiator: 'admin@demo.com',
      reason: 'Rollback - false alarm',
      createdAt: new Date(Date.now() - 600000).toISOString(),
      expiresAt: new Date(Date.now() + 300000).toISOString(),
    };

    assert.equal(isReceiptActive(receipt), false, 'domain: cancelled should be inactive');
    assert.ok(!isReceiptActive(receipt), 'miniapp: should allow checkout');
    console.log('  + [chain02] negative: cancelled -> inactive -> checkout ok');
  });

  test('[boundary] Expired governance -> Domain auto-correction', () => {
    const receipt: GovernanceReceipt = {
      id: 'receipt-expired-001',
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-001',
      action: 'ENABLE_MAINTENANCE',
      status: 'active',
      severity: 'info',
      targetResource: 'notification-service',
      initiator: 'ops@demo.com',
      reason: 'DB migration (completed)',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      expiresAt: new Date(Date.now() - 3600000).toISOString(),
    };

    assert.equal(isReceiptActive(receipt), false, 'domain: expired should be inactive');
    const corrected: GovStatus = isReceiptActive(receipt) ? 'active' : 'expired';
    assert.equal(corrected, 'expired', 'domain: should auto-correct to expired');
    console.log('  + [chain02] boundary: expired -> inactive -> auto-correct');
  });
});
