import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  adminWorkbenchConsumerDescriptor,
  adminRuntimeActionKeys,
  adminRuntimeActionPresetContractMap,
  defaultRoleWorkbenchContractMap,
  defaultRoleWorkbenchContracts,
} from '@m5/types';
import {
  fallbackRoleWorkbenches,
  fallbackWorkbenchMap,
  fallbackWorkbenchConsumerDescriptor,
} from './workbench-data';

test('fallbackRoleWorkbenches covers all 10 known roles', () => {
  const roles = fallbackRoleWorkbenches.map((w) => w.role);
  for (const role of ['SUPER_ADMIN', 'TENANT_ADMIN', 'BRAND_MANAGER', 'STORE_MANAGER', 'GUIDE', 'CASHIER', 'OPERATIONS', 'FINANCE', 'WAREHOUSE', 'COACH']) {
    assert.ok(roles.includes(role), `fallbackRoleWorkbenches should include ${role}`);
  }
});

test('each workbench has required fields', () => {
  for (const w of fallbackRoleWorkbenches) {
    assert.ok(typeof w.role === 'string', `role should be string for ${w.role}`);
    assert.ok(['PC', 'PAD'].includes(w.channel), `channel should be PC or PAD for ${w.role}`);
    assert.ok(typeof w.title === 'string' && w.title.length > 0, `title required for ${w.role}`);
    assert.ok(Array.isArray(w.navItems), `navItems should be array for ${w.role}`);
    for (const item of w.navItems) {
      assert.ok(typeof item.key === 'string', `navItem.key required for ${w.role}`);
      assert.ok(typeof item.label === 'string', `navItem.label required for ${w.role}`);
    }
  }
});

test('fallbackWorkbenchMap resolves all 10 roles by lowercased role', () => {
  for (const role of ['super_admin', 'tenant_admin', 'brand_manager', 'store_manager', 'guide', 'cashier', 'operations', 'finance', 'warehouse', 'coach']) {
    const contract = fallbackWorkbenchMap[role];
    assert.ok(contract, `${role} should resolve from fallbackWorkbenchMap`);
    assert.equal(contract.role, role.toUpperCase());
  }
});

test('fallback workbench data reuses shared registry exports', () => {
  assert.equal(fallbackRoleWorkbenches, defaultRoleWorkbenchContracts);
  assert.equal(fallbackWorkbenchMap, defaultRoleWorkbenchContractMap);
  assert.equal(fallbackWorkbenchConsumerDescriptor, adminWorkbenchConsumerDescriptor);
});

test('fallbackWorkbenchConsumerDescriptor has expected shape', () => {
  const d = fallbackWorkbenchConsumerDescriptor;
  assert.equal(d.consumer, 'workbench');
  assert.ok(Array.isArray(d.dependsOn));
  assert.ok(d.dependsOn.length >= 3);
  assert.ok(typeof d.responsibility === 'string');
  assert.ok(Array.isArray(d.recommendedSequence));
  assert.ok(Array.isArray(d.governanceTouchpoints));
  assert.ok(Array.isArray(d.highRiskEntrypoints));
});

test('fallbackWorkbenchConsumerDescriptor actionGovernanceExamples', () => {
  const examples = fallbackWorkbenchConsumerDescriptor.actionGovernanceExamples;
  assert.ok(examples.length >= 2);
  assert.deepEqual(fallbackWorkbenchConsumerDescriptor.highRiskEntrypoints, [...adminRuntimeActionKeys]);
  for (const ex of examples) {
    assert.ok(typeof ex.surface === 'string');
    assert.ok(typeof ex.action === 'string');
    assert.ok(typeof ex.riskLevel === 'string');
    assert.ok(typeof ex.bootstrapState === 'string');
    assert.ok(typeof ex.requestEndpoint === 'string');
    assert.equal(ex.requestEndpoint, adminRuntimeActionPresetContractMap[ex.action as keyof typeof adminRuntimeActionPresetContractMap].requestEndpoint);
  }
});

test('fallbackWorkbenchConsumerDescriptor runtimeHandoffExamples have required fields', () => {
  const examples = fallbackWorkbenchConsumerDescriptor.runtimeHandoffExamples;
  assert.ok(examples.length >= 2);
  for (const ex of examples) {
    assert.ok(typeof ex.handlerName === 'string');
    assert.ok(typeof ex.ticketType === 'string');
    assert.ok(typeof ex.ticketStatus === 'string');
    assert.ok(typeof ex.syncMode === 'string');
    assert.equal(ex.handlerName, adminRuntimeActionPresetContractMap[ex.action as keyof typeof adminRuntimeActionPresetContractMap].handlerName);
  }
});

test('fallbackWorkbenchConsumerDescriptor runtimeReceiptExamples', () => {
  const examples = fallbackWorkbenchConsumerDescriptor.runtimeReceiptExamples;
  assert.ok(examples.length >= 2);
  for (const ex of examples) {
    assert.ok(typeof ex.mode === 'string');
    assert.ok(typeof ex.receiptState === 'string');
    assert.ok(typeof ex.runtimeEndpoint === 'string');
  }
});

test('fallbackWorkbenchConsumerDescriptor governanceAlertLifecycleExamples', () => {
  const examples = fallbackWorkbenchConsumerDescriptor.governanceAlertLifecycleExamples;
  assert.ok(examples.length >= 2);
  for (const ex of examples) {
    assert.ok(typeof ex.alertCode === 'string');
    assert.ok(typeof ex.stage === 'string');
    assert.ok(typeof ex.endpoint === 'string');
    assert.ok(Array.isArray(ex.availableActions));
  }
});

describe('fallbackWorkbenchConsumerDescriptor — workbench shape', () => {
  test('consumer 字段应为 workbench', () => {
    assert.equal(fallbackWorkbenchConsumerDescriptor.consumer, 'workbench');
  });

  test('dependsOn 应包含 trust-governance', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.dependsOn.includes('trust-governance'));
  });

  test('dependsOn 应包含 identity-access', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.dependsOn.includes('identity-access'));
  });

  test('dependsOn 应包含 configuration-governance', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.dependsOn.includes('configuration-governance'));
  });

  test('dependsOn 应包含 resilience-operations', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.dependsOn.includes('resilience-operations'));
  });

  test('recommendedSequence 应包含 api/v1/foundation/bootstrap', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.recommendedSequence.includes('/api/v1/foundation/bootstrap'));
  });

  test('recommendedSequence 应包含 api/v1/workbenches/bootstrap', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.recommendedSequence.includes('/api/v1/workbenches/bootstrap'));
  });

  test('highRiskEntrypoints 应包含 runtime-replay', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.highRiskEntrypoints.includes('runtime-replay'));
  });

  test('highRiskEntrypoints 应包含 secret-rotation', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.highRiskEntrypoints.includes('secret-rotation'));
  });

  test('responsibility 应非空', () => {
    assert.ok(fallbackWorkbenchConsumerDescriptor.responsibility.length > 10);
  });
});

describe('fallbackRoleWorkbenches — navItem 完整性', () => {
  test('每个 role 的 navItems 应包含至少 2 项', () => {
    for (const w of fallbackRoleWorkbenches) {
      assert.ok(w.navItems.length >= 2, `${w.role} 应有至少 2 个 navItems, 实际 ${w.navItems.length}`);
    }
  });

  test('navItems 不应有重复的 key', () => {
    for (const w of fallbackRoleWorkbenches) {
      const keys = w.navItems.map(i => i.key);
      assert.equal(new Set(keys).size, keys.length, `${w.role} navItems 有重复 key`);
    }
  });

  test('navItem key 不应为空', () => {
    for (const w of fallbackRoleWorkbenches) {
      for (const item of w.navItems) {
        assert.ok(item.key.length > 0, `${w.role} 有空的 key`);
      }
    }
  });
  
  test('navItems 中所有 label 应非空', () => {
    for (const w of fallbackRoleWorkbenches) {
      for (const item of w.navItems) {
        assert.ok(item.label.length > 0, `${w.role}/${item.key} label 为空`);
      }
    }
  });
});
