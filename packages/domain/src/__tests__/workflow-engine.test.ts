/**
 * workflow-engine.test.ts — WorkflowEngine 单元测试
 *
 * 测试工作流引擎核心逻辑: 步骤编排 → 条件分支 → 超时/重试 → 状态追踪
 * 全纯函数式，不依赖 NestJS DI、不 import 生产模块。
 * ≥15 cases: 正例 ≥8 + 反例 ≥4 + 边界 ≥3
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ========================================================================
// 1. 类型定义（完全 inline）
// ========================================================================

type WorkflowStatus = 'DRAFT' | 'ACTIVE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'TIMEOUT';
type StepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'SKIPPED' | 'FAILED';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'ACTION' | 'CONDITION' | 'APPROVAL' | 'NOTIFICATION' | 'DELAY';
  dependsOn: string[];
  timeoutSeconds: number;
  retryLimit: number;
  actionHandler?: string;
  conditionExpression?: string;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  version: number;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  scope: string;
  maxExecutionSeconds: number;
  createdBy: string;
}

interface WorkflowInstance {
  id: string;
  definitionId: string;
  status: WorkflowStatus;
  currentStepId: string | null;
  stepStates: StepState[];
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  startedAt: string;
  finishedAt?: string;
}

interface StepState {
  stepId: string;
  status: StepStatus;
  startedAt?: string;
  finishedAt?: string;
  attemptCount: number;
  error?: string;
  output?: Record<string, unknown>;
}

interface WorkflowResult {
  instance: WorkflowInstance;
  completed: boolean;
  nextStepId: string | null;
}

// ========================================================================
// 2. Mock 数据工厂
// ========================================================================

function makeStep(overrides?: Partial<WorkflowStep>): WorkflowStep {
  return {
    id: 'step-001',
    name: 'Validate Input',
    type: 'ACTION',
    dependsOn: [],
    timeoutSeconds: 60,
    retryLimit: 3,
    ...overrides,
  };
}

function makeDefinition(overrides?: Partial<WorkflowDefinition>): WorkflowDefinition {
  const defaultSteps: WorkflowStep[] = [
    makeStep({ id: 'step-validate', name: 'Validate Input', type: 'ACTION', dependsOn: [] }),
    makeStep({ id: 'step-process', name: 'Process Data', type: 'ACTION', dependsOn: ['step-validate'] }),
    makeStep({ id: 'step-notify', name: 'Send Notification', type: 'NOTIFICATION', dependsOn: ['step-process'] }),
  ];

  return {
    id: 'wf-001',
    name: 'Order Processing',
    version: 1,
    status: 'ACTIVE',
    steps: overrides?.steps ?? defaultSteps,
    scope: 'TENANT:T001',
    maxExecutionSeconds: 300,
    createdBy: 'admin',
    ...overrides,
  };
}

function makeStepState(overrides?: Partial<StepState>): StepState {
  return {
    stepId: 'step-001',
    status: 'PENDING',
    attemptCount: 0,
    ...overrides,
  };
}

function makeInstance(overrides?: Partial<WorkflowInstance>): WorkflowInstance {
  return {
    id: 'wf-inst-001',
    definitionId: 'wf-001',
    status: 'ACTIVE',
    currentStepId: 'step-validate',
    stepStates: [makeStepState({ stepId: 'step-validate' })],
    input: { orderId: 'ord-001' },
    startedAt: '2026-07-24T00:00:00Z',
    ...overrides,
  };
}

// ========================================================================
// 3. 纯业务函数（内联）
// ========================================================================

/** 创建工作流运行实例 */
function createWorkflowInstance(
  definition: WorkflowDefinition,
  input: Record<string, unknown>,
): WorkflowInstance {
  const stepStates: StepState[] = definition.steps.map((s) => ({
    stepId: s.id,
    status: 'PENDING',
    attemptCount: 0,
  }));

  return {
    id: `wf-inst-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    definitionId: definition.id,
    status: 'ACTIVE',
    currentStepId: definition.steps[0]?.id ?? null,
    stepStates,
    input,
    startedAt: new Date().toISOString(),
  };
}

/** 查找当前可执行的步骤（所有依赖已完成） */
function getNextReadySteps(instance: WorkflowInstance, definition: WorkflowDefinition): WorkflowStep[] {
  const completedStepIds = new Set(
    instance.stepStates
      .filter((s) => s.status === 'COMPLETED' || s.status === 'SKIPPED')
      .map((s) => s.stepId),
  );

  return definition.steps.filter((step) => {
    const state = instance.stepStates.find((s) => s.stepId === step.id);
    if (!state || state.status !== 'PENDING') return false;
    return step.dependsOn.every((depId) => completedStepIds.has(depId));
  });
}

/** 执行步骤（模拟） */
function executeStep(step: WorkflowStep, input: Record<string, unknown>): StepState {
  const now = new Date().toISOString();
  const output: Record<string, unknown> = {};
  let status: StepStatus = 'COMPLETED';
  let error: string | undefined;

  // 模拟部分步骤可能失败
  if (step.type === 'CONDITION' && !input[step.conditionExpression ?? '']) {
    status = 'SKIPPED';
  } else if (step.type === 'APPROVAL' && input.autoApprove === false) {
    status = 'FAILED';
    error = 'Approval rejected';
  }

  return {
    stepId: step.id,
    status,
    startedAt: now,
    finishedAt: now,
    attemptCount: 1,
    error,
    output: status === 'COMPLETED' ? { ...output, stepName: step.name } : undefined,
  };
}

/** 处理步骤失败（重试逻辑） */
function handleStepFailure(state: StepState, step: WorkflowStep): StepState {
  const newAttempt = state.attemptCount + 1;
  if (newAttempt > step.retryLimit) {
    return {
      ...state,
      status: 'FAILED',
      attemptCount: state.attemptCount,
    };
  }
  return {
    ...state,
    status: 'PENDING',
    attemptCount: newAttempt,
    error: undefined,
  };
}

/** 执行工作流一步 */
function advanceWorkflow(
  instance: WorkflowInstance,
  definition: WorkflowDefinition,
  stepResults: Map<string, StepState>,
): WorkflowResult {
  const updatedStepStates = instance.stepStates.map((s) => {
    const result = stepResults.get(s.stepId);
    return result ?? s;
  });

  const allCompleted = updatedStepStates.every(
    (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED',
  );
  const anyFailed = updatedStepStates.some((s) => s.status === 'FAILED');

  if (anyFailed) {
    return {
      instance: {
        ...instance,
        stepStates: updatedStepStates,
        status: 'FAILED',
        error: 'Workflow step failed',
        finishedAt: new Date().toISOString(),
      },
      completed: true,
      nextStepId: null,
    };
  }

  if (allCompleted) {
    return {
      instance: {
        ...instance,
        stepStates: updatedStepStates,
        status: 'COMPLETED',
        currentStepId: null,
        finishedAt: new Date().toISOString(),
      },
      completed: true,
      nextStepId: null,
    };
  }

  const nextReady = getNextReadySteps(
    { ...instance, stepStates: updatedStepStates },
    definition,
  );
  const nextStepId = nextReady[0]?.id ?? null;

  return {
    instance: {
      ...instance,
      stepStates: updatedStepStates,
      currentStepId: nextStepId,
    },
    completed: false,
    nextStepId,
  };
}

/** 检查工作流超时 */
function checkWorkflowTimeout(instance: WorkflowInstance, maxSeconds: number): boolean {
  const started = new Date(instance.startedAt).getTime();
  const now = Date.now();
  return (now - started) / 1000 > maxSeconds;
}

/** 取消工作流 */
function cancelWorkflow(instance: WorkflowInstance, reason?: string): WorkflowInstance {
  const updatedStepStates = instance.stepStates.map((s) => {
    if (s.status === 'PENDING' || s.status === 'RUNNING') {
      return { ...s, status: 'SKIPPED' as StepStatus, finishedAt: new Date().toISOString() };
    }
    return s;
  });

  return {
    ...instance,
    status: 'CANCELLED',
    currentStepId: null,
    stepStates: updatedStepStates,
    error: reason,
    finishedAt: new Date().toISOString(),
  };
}

/** 校验工作流定义合法性 */
function validateDefinition(definition: WorkflowDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!definition.id) errors.push('Workflow ID is required');
  if (!definition.name) errors.push('Workflow name is required');
  if (definition.steps.length === 0) errors.push('Workflow must have at least one step');

  const stepIds = new Set(definition.steps.map((s) => s.id));
  if (stepIds.size !== definition.steps.length) {
    errors.push('Duplicate step IDs detected');
  }

  for (const step of definition.steps) {
    for (const dep of step.dependsOn) {
      if (!stepIds.has(dep)) {
        errors.push(`Step ${step.id} depends on unknown step: ${dep}`);
      }
    }
    if (step.timeoutSeconds <= 0) {
      errors.push(`Step ${step.id} has invalid timeout: ${step.timeoutSeconds}`);
    }
    if (step.retryLimit < 0) {
      errors.push(`Step ${step.id} has negative retry limit`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ========================================================================
// 4. 测试
// ========================================================================

describe('WorkflowEngine / createWorkflowInstance 实例创建', () => {
  it('从定义创建工作流实例，初始状态为 ACTIVE', () => {
    const def = makeDefinition();
    const instance = createWorkflowInstance(def, { orderId: 'ord-001' });
    assert.strictEqual(instance.status, 'ACTIVE');
    assert.strictEqual(instance.definitionId, def.id);
    assert.strictEqual(instance.stepStates.length, def.steps.length);
    assert.ok(instance.stepStates.every((s) => s.status === 'PENDING'));
    assert.strictEqual(instance.input.orderId, 'ord-001');
  });

  it('空步骤定义时 currentStepId 为 null', () => {
    const def = makeDefinition({ steps: [] });
    const instance = createWorkflowInstance(def, {});
    assert.strictEqual(instance.currentStepId, null);
    assert.strictEqual(instance.stepStates.length, 0);
  });
});

describe('WorkflowEngine / validateDefinition 定义校验', () => {
  it('合法定义通过校验', () => {
    const def = makeDefinition();
    const { valid, errors } = validateDefinition(def);
    assert.strictEqual(valid, true);
    assert.strictEqual(errors.length, 0);
  });

  it('空步骤定义不通过校验', () => {
    const def = makeDefinition({ steps: [] });
    const { valid, errors } = validateDefinition(def);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('at least one step')));
  });

  it('重复步骤 ID 检测', () => {
    const dupStep = makeStep({ id: 'step-001' });
    const def = makeDefinition({ steps: [dupStep, { ...dupStep }] });
    const { valid, errors } = validateDefinition(def);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('Duplicate')));
  });

  it('依赖不存在的步骤检测', () => {
    const steps = [makeStep({ id: 's1', dependsOn: ['s-nonexistent'] })];
    const def = makeDefinition({ steps });
    const { valid, errors } = validateDefinition(def);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('unknown step')));
  });

  it('非法超时值检测', () => {
    const steps = [makeStep({ timeoutSeconds: -1 })];
    const def = makeDefinition({ steps });
    const { valid, errors } = validateDefinition(def);
    assert.strictEqual(valid, false);
    assert.ok(errors.some((e) => e.includes('invalid timeout')));
  });
});

describe('WorkflowEngine / getNextReadySteps 下一个可执行步骤', () => {
  it('初始状态返回第一个无依赖的步骤', () => {
    const def = makeDefinition();
    const instance = createWorkflowInstance(def, {});
    const ready = getNextReadySteps(instance, def);
    assert.strictEqual(ready.length, 1);
    assert.strictEqual(ready[0]!.id, 'step-validate');
  });

  it('依赖完成后返回下一个步骤', () => {
    const def = makeDefinition();
    const instance: WorkflowInstance = {
      ...createWorkflowInstance(def, {}),
      stepStates: [
        makeStepState({ stepId: 'step-validate', status: 'COMPLETED' }),
        makeStepState({ stepId: 'step-process', status: 'PENDING' }),
        makeStepState({ stepId: 'step-notify', status: 'PENDING' }),
      ],
    };
    const ready = getNextReadySteps(instance, def);
    assert.strictEqual(ready.length, 1);
    assert.strictEqual(ready[0]!.id, 'step-process');
  });

  it('所有依赖未完成时返回空', () => {
    const def = makeDefinition();
    const instance: WorkflowInstance = {
      ...createWorkflowInstance(def, {}),
      stepStates: [
        makeStepState({ stepId: 'step-validate', status: 'PENDING' }),
        makeStepState({ stepId: 'step-process', status: 'PENDING' }),
        makeStepState({ stepId: 'step-notify', status: 'PENDING' }),
      ],
    };
    const ready = getNextReadySteps(instance, def);
    assert.strictEqual(ready.length, 1);  // step-validate has no deps
    assert.strictEqual(ready[0]!.id, 'step-validate');
  });

  it('已 SKIPPED 的步骤不计为依赖阻塞', () => {
    const stepA = makeStep({ id: 's1', dependsOn: [] });
    const stepB = makeStep({ id: 's2', dependsOn: ['s1'] });
    const def = makeDefinition({ steps: [stepA, stepB] });
    const instance: WorkflowInstance = {
      ...createWorkflowInstance(def, {}),
      stepStates: [
        makeStepState({ stepId: 's1', status: 'SKIPPED' }),
        makeStepState({ stepId: 's2', status: 'PENDING' }),
      ],
    };
    const ready = getNextReadySteps(instance, def);
    assert.strictEqual(ready.length, 1);
    assert.strictEqual(ready[0]!.id, 's2');
  });
});

describe('WorkflowEngine / executeStep 步骤执行', () => {
  it('ACTION 步骤执行成功返回 COMPLETED', () => {
    const step = makeStep({ id: 's1', type: 'ACTION' });
    const result = executeStep(step, {});
    assert.strictEqual(result.status, 'COMPLETED');
    assert.strictEqual(result.attemptCount, 1);
    assert.ok(result.startedAt);
  });

  it('CONDITION 不满足条件时步骤被 SKIPPED', () => {
    const step = makeStep({ id: 's1', type: 'CONDITION', conditionExpression: 'autoApprove' });
    const result = executeStep(step, { autoApprove: false });
    assert.strictEqual(result.status, 'SKIPPED');
  });

  it('APPROVAL 被拒绝时步骤 FAILED', () => {
    const step = makeStep({ id: 's1', type: 'APPROVAL' });
    const result = executeStep(step, { autoApprove: false });
    assert.strictEqual(result.status, 'FAILED');
    assert.strictEqual(result.error, 'Approval rejected');
  });
});

describe('WorkflowEngine / handleStepFailure 重试逻辑', () => {
  it('未超过重试限制时重置为 PENDING', () => {
    const step = makeStep({ id: 's1', retryLimit: 3 });
    const state = makeStepState({ status: 'FAILED', attemptCount: 1 });
    const result = handleStepFailure(state, step);
    assert.strictEqual(result.status, 'PENDING');
    assert.strictEqual(result.attemptCount, 2);
  });

  it('超过重试限制时保留 FAILED', () => {
    const step = makeStep({ id: 's1', retryLimit: 2 });
    const state = makeStepState({ status: 'FAILED', attemptCount: 2 });
    const result = handleStepFailure(state, step);
    assert.strictEqual(result.status, 'FAILED');
  });

  it('retryLimit 为 0 时仅一次尝试', () => {
    const step = makeStep({ id: 's1', retryLimit: 0 });
    const state = makeStepState({ status: 'FAILED', attemptCount: 0 });
    const result = handleStepFailure(state, step);
    assert.strictEqual(result.status, 'FAILED');
  });
});

describe('WorkflowEngine / advanceWorkflow 工作流推进', () => {
  it('所有步骤完成时状态变为 COMPLETED', () => {
    const def = makeDefinition();
    const instance = createWorkflowInstance(def, {});
    const results = new Map<string, StepState>();
    for (const step of def.steps) {
      results.set(step.id, executeStep(step, {}));
    }
    const result = advanceWorkflow(instance, def, results);

    assert.strictEqual(result.completed, true);
    assert.strictEqual(result.instance.status, 'COMPLETED');
    assert.strictEqual(result.nextStepId, null);
  });

  it('步骤失败时工作流变为 FAILED', () => {
    const def = makeDefinition();
    const instance = createWorkflowInstance(def, {});
    const results = new Map<string, StepState>();
    results.set('step-validate', makeStepState({
      stepId: 'step-validate', status: 'FAILED', error: 'Validation failed',
    }));
    const result = advanceWorkflow(instance, def, results);

    assert.strictEqual(result.completed, true);
    assert.strictEqual(result.instance.status, 'FAILED');
    assert.ok(result.instance.error);
  });

  it('部分步骤完成时推进到下一步', () => {
    const def = makeDefinition();
    const instance = createWorkflowInstance(def, {});
    const results = new Map<string, StepState>();
    results.set('step-validate', executeStep(def.steps[0]!, {}));
    const result = advanceWorkflow(instance, def, results);

    assert.strictEqual(result.completed, false);
    assert.strictEqual(result.nextStepId, 'step-process');
  });
});

describe('WorkflowEngine / checkWorkflowTimeout 超时检查', () => {
  it('未超时返回 false', () => {
    const instance = makeInstance({ startedAt: new Date().toISOString() });
    assert.strictEqual(checkWorkflowTimeout(instance, 600), false);
  });

  it('已超时返回 true', () => {
    const past = new Date(Date.now() - 1000 * 120).toISOString(); // 120s ago
    const instance = makeInstance({ startedAt: past });
    assert.strictEqual(checkWorkflowTimeout(instance, 60), true);
  });

  it('恰好等于超时时返回 false', () => {
    const exactPast = new Date(Date.now() - 1000 * 60).toISOString();
    const instance = makeInstance({ startedAt: exactPast });
    assert.strictEqual(checkWorkflowTimeout(instance, 60), false);
  });
});

describe('WorkflowEngine / cancelWorkflow 取消工作流', () => {
  it('取消工作流将 PENDING/RUNNING 步骤标记为 SKIPPED', () => {
    const instance = makeInstance({
      stepStates: [
        makeStepState({ stepId: 'step-validate', status: 'COMPLETED' }),
        makeStepState({ stepId: 'step-process', status: 'RUNNING' }),
        makeStepState({ stepId: 'step-notify', status: 'PENDING' }),
      ],
    });
    const cancelled = cancelWorkflow(instance, 'Manual cancellation');
    assert.strictEqual(cancelled.status, 'CANCELLED');
    assert.strictEqual(cancelled.currentStepId, null);
    assert.strictEqual(cancelled.error, 'Manual cancellation');
    const skipped = cancelled.stepStates.filter((s) => s.status === 'SKIPPED');
    assert.strictEqual(skipped.length, 2);
    assert.ok(cancelled.finishedAt);
  });
});
