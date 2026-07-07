'use client';

import { useMemo, useState } from 'react';
import {
  FormField,
  FormSubmitFeedback,
  Input,
  InputNumber,
  MultiSelect,
  Select,
  SubmitButton,
  Tabs,
  useFormSubmit
} from '@m5/ui';
import type {
  AgentConfig,
  AgentMessage,
  AgentSessionEvent,
  BatchAgentRequest,
  BatchAgentResponse,
  CreateSessionRequest,
  SessionExecutionResult
} from '@m5/types';
import {
  batchRunAgent,
  deleteAgentConfig,
  FALLBACK_TENANT_ID,
  FALLBACK_USER_ID,
  runAgentSession,
  runAgentSessionStream,
  submitAgentConfig
} from '../agent-view-model';

interface AgentStudioClientProps {
  configs: AgentConfig[];
  deliveryMode: 'api' | 'fallback';
}

type StudioTab = 'create-config' | 'run-session' | 'batch-run' | 'delete-config';
type SessionMode = 'single' | 'batch';

const MODEL_OPTIONS = [
  { label: 'DeepSeek v4', value: 'deepseek-v4' },
  { label: 'DeepSeek v3', value: 'deepseek-v3' },
  { label: 'GPT-4o', value: 'gpt-4o' },
  { label: 'GPT-4o mini', value: 'gpt-4o-mini' },
  { label: 'Claude 3.5 Sonnet', value: 'claude-3.5-sonnet' },
  { label: 'Qwen 2.5', value: 'qwen-2.5' }
];

const TOOL_OPTIONS = [
  { label: 'order_query (订单查询)', value: 'order_query' },
  { label: 'refund_create (发起退款)', value: 'refund_create' },
  { label: 'knowledge_search (知识检索)', value: 'knowledge_search' },
  { label: 'product_search (商品搜索)', value: 'product_search' },
  { label: 'quote_builder (报价生成)', value: 'quote_builder' },
  { label: 'crm_lookup (CRM 客户档案)', value: 'crm_lookup' },
  { label: 'metrics_query (指标查询)', value: 'metrics_query' },
  { label: 'anomaly_detect (异常检测)', value: 'anomaly_detect' },
  { label: 'calculator (计算器)', value: 'calculator' }
];

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function CreateConfigForm() {
  const [name, setName] = useState('');
  const [systemPrompt, setSystemPrompt] = useState(
    '你是一个专业的助手,需要准确、耐心地回答用户问题。'
  );
  const [model, setModel] = useState('deepseek-v4');
  const [maxSteps, setMaxSteps] = useState(10);
  const [enableReflection, setEnableReflection] = useState(true);
  const [allowedTools, setAllowedTools] = useState<string[]>([]);
  const [timeoutMs, setTimeoutMs] = useState(30000);
  const [enabled, setEnabled] = useState(true);
  const [tenantId, setTenantId] = useState(FALLBACK_TENANT_ID);

  const nameError = useMemo(() => {
    if (!name.trim()) return '名称不能为空';
    if (name.length > 64) return '名称长度不能超过 64';
    return null;
  }, [name]);

  const promptError = useMemo(() => {
    if (!systemPrompt.trim()) return '系统提示词不能为空';
    if (systemPrompt.length < 10) return '系统提示词至少 10 字符';
    return null;
  }, [systemPrompt]);

  const canSubmit = !nameError && !promptError;

  const submit = useFormSubmit<AgentConfig>({
    onSubmit: () => {
      const body: AgentConfig = {
        id: genId('agent-cfg'),
        name,
        systemPrompt,
        model,
        maxSteps,
        enableReflection,
        allowedTools,
        timeoutMs,
        enabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId
      };
      return submitAgentConfig(body);
    },
    successMessage: (r) => `创建成功: ${r.id}`
  });

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: '#94a3b8' }}>
        创建新的 Agent 配置。提交后可在「Config 列表」中查看,并用于「运行会话」。
      </div>
      <FormField label="配置名称" required error={nameError ?? undefined}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="客服 Agent" />
      </FormField>
      <FormField label="系统提示词" required error={promptError ?? undefined}>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={5}
          placeholder="你是一个专业的助手..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: `1px solid ${promptError ? '#f87171' : 'rgba(96, 165, 250, 0.3)'}`,
            background: 'rgba(15, 23, 42, 0.5)',
            color: '#e2e8f0',
            fontSize: 13,
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />
      </FormField>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="LLM 模型">
          <Select value={model} onChange={setModel} options={MODEL_OPTIONS} />
        </FormField>
        <FormField label="租户 ID">
          <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        </FormField>
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr 1fr' }}>
        <FormField label="最大步数">
          <InputNumber value={maxSteps} onChange={setMaxSteps} min={1} max={100} />
        </FormField>
        <FormField label="超时时间 (ms)">
          <InputNumber value={timeoutMs} onChange={setTimeoutMs} min={1000} max={600000} step={1000} />
        </FormField>
        <FormField label="启用反思">
          <Select
            value={enableReflection ? 'true' : 'false'}
            onChange={(v) => setEnableReflection(v === 'true')}
            options={[
              { label: '✓ 启用', value: 'true' },
              { label: '✗ 关闭', value: 'false' }
            ]}
          />
        </FormField>
      </div>
      <FormField
        label="允许的工具 (留空 = 无限制)"
        helper="选择 Agent 可调用的工具集,空数组表示禁用工具调用"
      >
        <MultiSelect
          options={TOOL_OPTIONS}
          value={allowedTools}
          onChange={setAllowedTools}
          placeholder="选择工具..."
        />
      </FormField>
      <FormField label="状态">
        <Select
          value={enabled ? 'true' : 'false'}
          onChange={(v) => setEnabled(v === 'true')}
          options={[
            { label: '✓ 启用 (可运行)', value: 'true' },
            { label: '✗ 禁用 (草稿)', value: 'false' }
          ]}
        />
      </FormField>

      <FormSubmitFeedback
        submitting={submit.submitting}
        error={submit.error}
        success={submit.success}
      />

      <SubmitButton
        onClick={submit.submit}
        disabled={!canSubmit}
        loading={submit.submitting}
        label="创建 Config"
        loadingLabel="提交中..."
      />
    </div>
  );
}

interface RunSessionFormProps {
  configs: AgentConfig[];
  mode: SessionMode;
}

function RunSessionForm({ configs, mode }: RunSessionFormProps) {
  const [configId, setConfigId] = useState(configs[0]?.id ?? '');
  const [userInput, setUserInput] = useState(
    mode === 'batch' ? '查询订单 ORD-001 的物流状态' : '查询订单 ORD-20260618-001 的当前状态'
  );
  const [batchInputs, setBatchInputs] = useState<string[]>([
    '查询会员等级与积分',
    '发起退货单 RF-001',
    '推荐适合 ABC 公司的套餐'
  ]);
  const [maxSteps, setMaxSteps] = useState<number | undefined>(undefined);
  const [enableReflection, setEnableReflection] = useState<boolean | undefined>(undefined);
  const [createdBy, setCreatedBy] = useState(FALLBACK_USER_ID);
  const [tenantId, setTenantId] = useState(FALLBACK_TENANT_ID);

  // Phase-27: stream 模式状态
  const [streamMode, setStreamMode] = useState(false);
  const [streamRunning, setStreamRunning] = useState(false);
  const [streamEvents, setStreamEvents] = useState<AgentSessionEvent[]>([]);
  const [streamMessages, setStreamMessages] = useState<AgentMessage[]>([]);
  const [streamStep, setStreamStep] = useState<{ current: number; max: number } | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamFinalSessionId, setStreamFinalSessionId] = useState<string | null>(null);

  const configOptions = useMemo(
    () => configs.map((c) => ({ label: `${c.name} (${c.id})`, value: c.id })),
    [configs]
  );

  const canSubmit =
    !!configId &&
    (mode === 'single'
      ? userInput.trim().length > 0
      : batchInputs.every((b) => b.trim().length > 0));

  const submit = useFormSubmit<SessionExecutionResult | BatchAgentResponse>({
    onSubmit: () => {
      if (mode === 'single') {
        const body: CreateSessionRequest = {
          configId,
          userInput,
          maxSteps,
          enableReflection,
          createdBy,
          tenantId
        };
        return runAgentSession(body);
      }
      const body: BatchAgentRequest = {
        items: batchInputs
          .filter((b) => b.trim().length > 0)
          .map((b) => ({
            configId,
            userInput: b,
            maxSteps,
            enableReflection
          })),
        createdBy,
        tenantId
      };
      return batchRunAgent(body);
    },
    successMessage: (r) => {
      if (mode === 'single') {
        const result = r as SessionExecutionResult;
        return `会话 ${result.session.id} 已执行完成 (${result.session.currentStep} 步, ${result.execution.totalDurationMs}ms)`;
      }
      const result = r as BatchAgentResponse;
      return `批量执行完成: ${result.succeeded}/${result.total} 成功`;
    }
  });

  // ── Phase-27: 流式执行 ──
  const runStream = async () => {
    if (!canSubmit || streamRunning) return;
    setStreamRunning(true);
    setStreamEvents([]);
    setStreamMessages([]);
    setStreamStep(null);
    setStreamError(null);
    setStreamFinalSessionId(null);
    try {
      const body: CreateSessionRequest = {
        configId,
        userInput,
        maxSteps,
        enableReflection,
        createdBy,
        tenantId
      };
      for await (const ev of runAgentSessionStream(body)) {
        setStreamEvents((prev) => [...prev, ev]);
        if (ev.type === 'message_added') {
          setStreamMessages((prev) => [...prev, ev.message]);
        } else if (ev.type === 'step_progress') {
          setStreamStep({ current: ev.step, max: ev.maxSteps });
        } else if (ev.type === 'session_completed') {
          setStreamFinalSessionId(ev.session.id);
        } else if (ev.type === 'session_failed') {
          setStreamError(ev.error);
        }
      }
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : String(err));
    } finally {
      setStreamRunning(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 13, color: '#94a3b8' }}>
        {mode === 'single'
          ? '选择配置 + 输入用户输入 → 立即运行。会话记录可在「会话列表 / 详情」中追踪。'
          : '批量运行同一配置的多个请求,适合批量回归测试与性能压测。'}
      </div>
      <FormField label="选择配置" required>
        <Select value={configId} onChange={setConfigId} options={configOptions} />
      </FormField>

      {mode === 'single' ? (
        <FormField label="用户输入" required helper="直接传给 Agent 的 query 字符串">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={4}
            placeholder="查询订单 ..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid rgba(96, 165, 250, 0.3)',
              background: 'rgba(15, 23, 42, 0.5)',
              color: '#e2e8f0',
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </FormField>
      ) : (
        <FormField label="批量输入" required helper="每行一个请求,会按顺序并发执行">
          <div style={{ display: 'grid', gap: 6 }}>
            {batchInputs.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 6 }}>
                <Input
                  value={v}
                  onChange={(e) => {
                    const next = [...batchInputs];
                    next[i] = e.target.value;
                    setBatchInputs(next);
                  }}
                  placeholder={`请求 #${i + 1}`}
                />
                <button
                  onClick={() => setBatchInputs(batchInputs.filter((_, idx) => idx !== i))}
                  disabled={batchInputs.length <= 1}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    background: 'transparent',
                    color: '#f87171',
                    cursor: batchInputs.length > 1 ? 'pointer' : 'not-allowed',
                    fontSize: 11
                  }}
                >
                  ✗
                </button>
              </div>
            ))}
            <button
              onClick={() => setBatchInputs([...batchInputs, ''])}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: '1px dashed rgba(96, 165, 250, 0.3)',
                background: 'transparent',
                color: '#60a5fa',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'monospace'
              }}
            >
              + 添加请求
            </button>
          </div>
        </FormField>
      )}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="最大步数 (留空 = 用配置默认)">
          <InputNumber
            value={maxSteps}
            onChange={(v) => setMaxSteps(v)}
            min={1}
            max={100}
          />
        </FormField>
        <FormField label="启用反思 (留空 = 用配置默认)">
          <Select
            value={enableReflection === undefined ? 'default' : enableReflection ? 'true' : 'false'}
            onChange={(v) => {
              if (v === 'default') setEnableReflection(undefined);
              else setEnableReflection(v === 'true');
            }}
            options={[
              { label: '用配置默认', value: 'default' },
              { label: '✓ 强制启用', value: 'true' },
              { label: '✗ 强制关闭', value: 'false' }
            ]}
          />
        </FormField>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <FormField label="创建者">
          <Input value={createdBy} onChange={(e) => setCreatedBy(e.target.value)} />
        </FormField>
        <FormField label="租户 ID">
          <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} />
        </FormField>
      </div>

      <FormSubmitFeedback
        submitting={submit.submitting}
        error={submit.error}
        success={submit.success}
      />

      <SubmitButton
        onClick={submit.submit}
        disabled={!canSubmit}
        loading={submit.submitting}
        label={mode === 'single' ? '运行会话' : '批量运行'}
        loadingLabel={mode === 'single' ? '执行中...' : '批量执行中...'}
      />

      {/* Phase-27: stream 模式开关(仅 single 生效) */}
      {mode === 'single' ? (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            borderRadius: 6,
            border: streamMode
              ? '1px solid rgba(96, 165, 250, 0.5)'
              : '1px solid rgba(100, 116, 139, 0.3)',
            background: streamMode ? 'rgba(96, 165, 250, 0.08)' : 'transparent',
            cursor: streamRunning ? 'not-allowed' : 'pointer',
            fontSize: 12,
            color: streamMode ? '#60a5fa' : '#94a3b8'
          }}
        >
          <input
            type="checkbox"
            checked={streamMode}
            disabled={streamRunning}
            onChange={(e) => setStreamMode(e.target.checked)}
            data-testid="studio-stream-mode"
          />
          <span>🚀 实时流式 (Phase-27 SSE) — 逐步接收 step / message / tool_call 事件</span>
        </label>
      ) : null}

      {/* Phase-27: stream 进度面板 */}
      {streamMode && mode === 'single' ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {streamRunning ? (
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(96, 165, 250, 0.1)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                color: '#60a5fa',
                fontSize: 12
              }}
              data-testid="studio-stream-running"
            >
              流式执行中 · 已接收 {streamEvents.length} 事件
              {streamStep ? ` · 步骤 ${streamStep.current}/${streamStep.max}` : ''}
            </div>
          ) : null}

          {streamError ? (
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                color: '#fca5a5',
                fontSize: 12
              }}
              data-testid="studio-stream-error"
            >
              ✗ 会话失败: {streamError}
            </div>
          ) : null}

          {streamFinalSessionId && !streamRunning ? (
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                background: 'rgba(74, 222, 128, 0.1)',
                border: '1px solid rgba(74, 222, 128, 0.3)',
                color: '#4ade80',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
              data-testid="studio-stream-completed"
            >
              ✓ 会话已完成 · 接收 {streamEvents.length} 事件 ·{' '}
              <a
                href={`/agents/sessions/${streamFinalSessionId}`}
                style={{ color: '#4ade80', textDecoration: 'underline' }}
              >
                查看详情 →
              </a>
            </div>
          ) : null}

          {streamStep ? (
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: 'rgba(100, 116, 139, 0.2)',
                overflow: 'hidden'
              }}
              data-testid="studio-stream-progress"
            >
              <div
                style={{
                  height: '100%',
                  width: `${(streamStep.current / streamStep.max) * 100}%`,
                  background: 'linear-gradient(90deg, #60a5fa, #4ade80)',
                  transition: 'width 0.3s'
                }}
              />
            </div>
          ) : null}

          {streamMessages.length > 0 ? (
            <div
              style={{
                maxHeight: 320,
                overflow: 'auto',
                padding: 12,
                borderRadius: 8,
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                display: 'grid',
                gap: 6
              }}
              data-testid="studio-stream-messages"
            >
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                消息流 ({streamMessages.length})
              </div>
              {streamMessages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 4,
                    background:
                      m.role === 'user'
                        ? 'rgba(96, 165, 250, 0.1)'
                        : m.role === 'assistant'
                        ? 'rgba(74, 222, 128, 0.08)'
                        : m.role === 'tool'
                        ? 'rgba(251, 191, 36, 0.08)'
                        : 'rgba(100, 116, 139, 0.1)',
                    color: '#cbd5e1',
                    fontFamily: 'monospace'
                  }}
                >
                  <span style={{ color: '#64748b', marginRight: 8 }}>[{m.role}]</span>
                  {m.content}
                </div>
              ))}
            </div>
          ) : null}

          {streamEvents.length > 0 ? (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                fontSize: 11
              }}
              data-testid="studio-stream-event-types"
            >
              {Array.from(
                streamEvents.reduce((acc, e) => {
                  acc.set(e.type, (acc.get(e.type) ?? 0) + 1);
                  return acc;
                }, new Map<string, number>())
              ).map(([type, count]) => (
                <span
                  key={type}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(100, 116, 139, 0.2)',
                    color: '#94a3b8',
                    fontFamily: 'monospace'
                  }}
                >
                  {type} × {count}
                </span>
              ))}
            </div>
          ) : null}

          <SubmitButton
            onClick={runStream}
            disabled={!canSubmit || streamRunning}
            loading={streamRunning}
            label="🚀 开始流式执行"
            loadingLabel="流式执行中..."
          />
        </div>
      ) : null}
    </div>
  );
}

function DeleteConfigForm({ configs }: { configs: AgentConfig[] }) {
  const [configId, setConfigId] = useState(configs[0]?.id ?? '');
  const [confirmText, setConfirmText] = useState('');

  const configOptions = useMemo(
    () => configs.map((c) => ({ label: `${c.name} (${c.id})`, value: c.id })),
    [configs]
  );

  const target = configs.find((c) => c.id === configId);
  const canSubmit = !!configId && confirmText === configId;

  const submit = useFormSubmit<{ deleted: boolean }>({
    onSubmit: () => deleteAgentConfig(configId),
    successMessage: () => `已删除 Config: ${configId}`
  });

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          color: '#fca5a5',
          fontSize: 12
        }}
      >
        ⚠️ 危险操作:删除 Config 后,使用此 Config 创建的新会话将失败。此操作仅删除配置,不会级联删除历史会话。
      </div>
      <FormField label="选择要删除的 Config" required>
        <Select value={configId} onChange={setConfigId} options={configOptions} />
      </FormField>
      {target ? (
        <div
          style={{
            padding: 12,
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            fontSize: 12,
            color: '#94a3b8'
          }}
        >
          <div>
            <strong style={{ color: '#e2e8f0' }}>{target.name}</strong>
            <span style={{ fontFamily: 'monospace', marginLeft: 8, color: '#64748b' }}>
              {target.id}
            </span>
          </div>
          <div style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 11 }}>
            模型: {target.model} · maxSteps: {target.maxSteps} · timeoutMs: {target.timeoutMs} ·
            allowedTools: [{target.allowedTools.join(', ') || '—'}]
          </div>
        </div>
      ) : null}
      <FormField
        label="二次确认"
        required
        helper={`请输入 Config ID "${configId}" 以确认删除`}
        error={confirmText && confirmText !== configId ? '输入的 ID 不匹配' : undefined}
      >
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={configId}
        />
      </FormField>

      <FormSubmitFeedback
        submitting={submit.submitting}
        error={submit.error}
        success={submit.success}
      />

      <SubmitButton
        onClick={submit.submit}
        disabled={!canSubmit}
        loading={submit.submitting}
        label="永久删除 Config"
        loadingLabel="删除中..."
        variant="danger"
      />
    </div>
  );
}

export default function AgentStudioClient({ configs, deliveryMode }: AgentStudioClientProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('create-config');
  const [sessionMode, setSessionMode] = useState<SessionMode>('single');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {deliveryMode === 'fallback' ? (
        <div
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24',
            fontSize: 12
          }}
        >
          ⚠️ 后端不可达,写操作会直接失败(无 fallback)。
        </div>
      ) : null}

      <Tabs
        items={[
          {
            key: 'create-config',
            label: '① 创建 Config',
            count: configs.length > 0 ? configs.length : undefined
          },
          { key: 'run-session', label: '② 运行会话' },
          { key: 'batch-run', label: '③ 批量运行' },
          { key: 'delete-config', label: '④ 删除 Config' }
        ]}
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as StudioTab)}
        variant="pills"
      />

      {activeTab === 'create-config' ? <CreateConfigForm /> : null}

      {activeTab === 'run-session' || activeTab === 'batch-run' ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setSessionMode('single')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: `1px solid ${sessionMode === 'single' ? '#60a5fa' : 'rgba(100, 116, 139, 0.3)'}`,
                background: sessionMode === 'single' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                color: sessionMode === 'single' ? '#60a5fa' : '#94a3b8',
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              单次
            </button>
            <button
              onClick={() => setSessionMode('batch')}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: `1px solid ${sessionMode === 'batch' ? '#60a5fa' : 'rgba(100, 116, 139, 0.3)'}`,
                background: sessionMode === 'batch' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                color: sessionMode === 'batch' ? '#60a5fa' : '#94a3b8',
                fontSize: 11,
                cursor: 'pointer'
              }}
            >
              批量
            </button>
          </div>
          <RunSessionForm configs={configs} mode={sessionMode} />
        </div>
      ) : null}

      {activeTab === 'delete-config' ? <DeleteConfigForm configs={configs} /> : null}
    </div>
  );
}