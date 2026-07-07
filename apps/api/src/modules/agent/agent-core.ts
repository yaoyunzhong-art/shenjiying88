/**
 * agent-core.ts - Phase-23 T85
 * Agent 核心 (ReAct 循环)
 *
 * ReAct (Reasoning + Acting) 循环:
 * 1. Thought: LLM 分析当前状态,决定下一步
 * 2. Action: 选择 tool 并提供 input
 * 3. Observation: 执行 tool 得到结果
 * 4. 重复 1-3,直到 Final Answer 或 maxSteps
 *
 * V2 mock 设计 (生产接 OpenAI/Anthropic):
 * - LLM interface: deterministic mock 基于 prompt keywords
 * - 工具调用解析: JSON schema
 * - 反思 (T88): 在 Final Answer 前可选插入 Reflection step
 */
import { ToolRegistry, ToolDefinition } from './tool-registry';

// ── LLM Interface ──

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  /** tool_call_id (role=tool 时使用) */
  toolCallId?: string;
  /** tool_calls (role=assistant 时使用) */
  toolCalls?: Array<{
    id: string;
    name: string;
    input: unknown;
  }>;
}

export interface LLMRequest {
  messages: LLMMessage[];
  tools?: ToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    input: unknown;
  }>;
  /** token 用量 (mock 时可选) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  /** finish reason */
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

export interface LLM {
  complete(req: LLMRequest): Promise<LLMResponse>;
}

// ── Mock LLM (V2) ──

/**
 * Mock LLM: 基于 prompt 关键词决定行为
 * - 包含 "final" 或 "answer" → 返回 final answer
 * - 包含 tool 名称 → 返回 tool call
 * - 否则 → 返回下一步 thought
 * - 全局 step counter,达到 maxSteps (默认 5) 后返回 final answer
 */
export class MockLLM implements LLM {
  private globalStep = 0;

  async complete(req: LLMRequest): Promise<LLMResponse> {
    this.globalStep++;
    const step = this.globalStep;
    const last = req.messages[req.messages.length - 1];
    const lastContent = last?.content ?? '';

    // 达到 step 上限,返回 final answer
    if (step >= 5 || lastContent.toLowerCase().includes('final') || lastContent.toLowerCase().includes('answer')) {
      return {
        content: `Final answer based on observation: ${lastContent}`,
        finishReason: 'stop',
      };
    }

    // 选第一个 tool
    const firstTool = req.tools?.[0];
    if (firstTool) {
      return {
        content: `I should call ${firstTool.name} to gather more info`,
        toolCalls: [
          {
            id: `call-${step}-${Date.now()}`,
            name: firstTool.name,
            input: { query: lastContent },
          },
        ],
        finishReason: 'tool_calls',
      };
    }

    return {
      content: `Thought ${step}: analyzing "${lastContent}"`,
      finishReason: 'stop',
    };
  }

  /**
   * 重置全局 step counter (测试用)
   */
  reset(): void {
    this.globalStep = 0;
  }
}

// ── Agent Step ──

export interface AgentStep {
  step: number;
  thought: string;
  /** action 选择 (tool call) */
  action?: {
    tool: string;
    input: unknown;
    toolCallId: string;
  };
  /** tool 执行结果 */
  observation?: {
    toolCallId: string;
    result: unknown;
    error?: string;
  };
  /** 最终答案 (循环终止) */
  finalAnswer?: string;
  /** 是否反思 (T88) */
  reflection?: string;
  /** step 耗时 (ms) */
  durationMs: number;
}

export interface AgentRunOptions {
  /** 最大步骤数 (默认 10) */
  maxSteps?: number;
  /** 是否启用反思 (T88) */
  enableReflection?: boolean;
  /** 中断信号 */
  signal?: AbortSignal;
  /** step callback */
  onStep?: (step: AgentStep) => void;
  /** system prompt */
  systemPrompt?: string;
}

export interface AgentRunResult {
  steps: AgentStep[];
  finalAnswer: string;
  /** 是否成功 (达到 finalAnswer) */
  success: boolean;
  /** 总 token 用量 */
  totalUsage: {
    promptTokens: number;
    completionTokens: number;
  };
  /** 总耗时 (ms) */
  totalDurationMs: number;
}

// ── Agent Core ──

export class AgentCore {
  private readonly llm: LLM;
  private readonly tools: ToolRegistry;
  private readonly defaultSystemPrompt: string;

  constructor(llm: LLM, tools: ToolRegistry, defaultSystemPrompt?: string) {
    this.llm = llm;
    this.tools = tools;
    this.defaultSystemPrompt = defaultSystemPrompt ?? this.getDefaultSystemPrompt();
  }

  /**
   * ReAct 主循环:run query 直到 final answer 或 max steps
   */
  async run(query: string, options: AgentRunOptions = {}): Promise<AgentRunResult> {
    const maxSteps = options.maxSteps ?? 10;
    const start = Date.now();
    const messages: LLMMessage[] = [
      { role: 'system', content: this.defaultSystemPrompt },
      { role: 'user', content: query },
    ];

    const steps: AgentStep[] = [];
    let finalAnswer = '';
    let success = false;
    const totalUsage = { promptTokens: 0, completionTokens: 0 };

    for (let i = 0; i < maxSteps; i++) {
      if (options.signal?.aborted) {
        throw new Error('Agent run aborted');
      }

      const stepStart = Date.now();
      const toolDefs = this.tools.list();

      // 1. Thought (LLM)
      const llmResp = await this.llm.complete({
        messages,
        tools: toolDefs,
      });

      if (llmResp.usage) {
        totalUsage.promptTokens += llmResp.usage.promptTokens;
        totalUsage.completionTokens += llmResp.usage.completionTokens;
      }

      const step: AgentStep = {
        step: i + 1,
        thought: llmResp.content,
        durationMs: Date.now() - stepStart,
      };

      // 2. Check final answer
      if (llmResp.finishReason === 'stop' && !llmResp.toolCalls) {
        step.finalAnswer = llmResp.content;
        finalAnswer = llmResp.content;
        success = true;
        steps.push(step);
        options.onStep?.(step);
        break;
      }

      // 3. Action: tool call
      if (llmResp.toolCalls && llmResp.toolCalls.length > 0) {
        const toolCall = llmResp.toolCalls[0];
        step.action = {
          tool: toolCall.name,
          input: toolCall.input,
          toolCallId: toolCall.id,
        };

        // 添加 assistant message
        messages.push({
          role: 'assistant',
          content: llmResp.content,
          toolCalls: llmResp.toolCalls,
        });

        // 4. Observation: 执行 tool
        try {
          const result = await this.tools.execute(toolCall.name, toolCall.input);
          step.observation = { toolCallId: toolCall.id, result };
          messages.push({
            role: 'tool',
            content: typeof result === 'string' ? result : JSON.stringify(result),
            toolCallId: toolCall.id,
          });
        } catch (e) {
          const err = e as Error;
          step.observation = { toolCallId: toolCall.id, result: null, error: err.message };
          messages.push({
            role: 'tool',
            content: `Error: ${err.message}`,
            toolCallId: toolCall.id,
          });
        }
      }

      steps.push(step);
      options.onStep?.(step);
    }

    if (!success) {
      // 未达到 final answer,使用最后 thought 作为 fallback
      finalAnswer = steps[steps.length - 1]?.thought ?? 'No answer (max steps reached)';
    }

    return {
      steps,
      finalAnswer,
      success,
      totalUsage,
      totalDurationMs: Date.now() - start,
    };
  }

  private getDefaultSystemPrompt(): string {
    return `You are a helpful AI agent. Use the provided tools to answer the user's question.
When you have enough information, respond with a final answer.`;
  }
}
