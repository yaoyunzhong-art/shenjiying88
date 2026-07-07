/**
 * Phase-27 T1-T3 smoke test: 验证 AgentService.stream() 与 types export
 */
import { AgentService } from '../apps/api/src/modules/agent/agent.service';
import { ToolRegistry } from '../apps/api/src/modules/agent/tool-registry';
import type { AgentSessionEvent } from '../packages/types/src/index';

const svc = new AgentService(new ToolRegistry());
const events: AgentSessionEvent[] = [];

const result = svc.runSessionWithStream(
  { configId: 'default-agent-v1', userInput: 'test SSE stream', createdBy: 'tester', tenantId: 'default' },
  (e) => events.push(e)
);

console.log('=== Phase-27 smoke test ===');
console.log('total events:', events.length);
console.log('first:', events[0]?.type);
console.log('last:', events[events.length - 1]?.type);

const types = new Set(events.map((e) => e.type));
console.log('event types:', Array.from(types).join(', '));

console.log('has session_started:', types.has('session_started'));
console.log('has session_completed:', types.has('session_completed'));
console.log('has step_progress:', types.has('step_progress'));
console.log('has tool_call_started:', types.has('tool_call_started'));
console.log('has tool_call_completed:', types.has('tool_call_completed'));
console.log('has message_added:', types.has('message_added'));
console.log('has reflection_started:', types.has('reflection_started'));

console.log('session status:', result.session.status);
console.log('session.currentStep:', result.session.currentStep);
console.log('execution.steps:', result.execution.steps);

if (!types.has('session_started')) throw new Error('Missing session_started');
if (!types.has('session_completed')) throw new Error('Missing session_completed');
if (!types.has('step_progress')) throw new Error('Missing step_progress');
if (!types.has('tool_call_started')) throw new Error('Missing tool_call_started');
if (!types.has('tool_call_completed')) throw new Error('Missing tool_call_completed');
if (!types.has('message_added')) throw new Error('Missing message_added');
if (!types.has('reflection_started')) throw new Error('Missing reflection_started');

console.log('✓ all 7 event types present');