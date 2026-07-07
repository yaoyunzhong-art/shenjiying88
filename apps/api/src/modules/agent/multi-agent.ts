/**
 * multi-agent.ts - Phase-23 T87
 * 多 Agent 协作 (Orchestrator + Worker)
 *
 * 模式:
 * - Orchestrator: 任务分解 + 派发给 worker + 汇总结果
 * - Worker: 单一专业 agent (e.g., SearchAgent / CodeAgent / WriterAgent)
 * - Communication: 通过 shared context (AgentContext)
 *
 * 设计:
 * - 任务图 (Task DAG): tasks + dependencies
 * - 并行执行 (Promise.all): 无依赖任务并行
 * - 结果汇总: orchestrator 合并 worker outputs
 */
import { AgentCore, LLM, AgentRunResult } from './agent-core';
import { ToolRegistry } from './tool-registry';

// ── Agent Context ──

export interface AgentContext {
  /** 租户 id */
  tenantId?: string;
  /** 用户 id */
  userId?: string;
  /** 会话 id */
  sessionId?: string;
  /** 共享 memory (key-value) */
  sharedMemory: Map<string, unknown>;
  /** 已收集的 worker results */
  workerResults: Map<string, string>;
  /** 中断信号 */
  signal?: AbortSignal;
}

// ── Worker Agent ──

export interface WorkerAgentConfig {
  /** worker 名称 */
  name: string;
  /** worker 描述 */
  description: string;
  /** 专业领域 */
  specialty: string;
  /** worker 使用的 LLM (可选,默认 orchestrator 的 LLM) */
  llm?: LLM;
  /** worker 使用的 tool registry (可选,默认 orchestrator 的) */
  tools?: ToolRegistry;
  /** worker 自己的 system prompt */
  systemPrompt?: string;
}

export class WorkerAgent {
  readonly name: string;
  readonly description: string;
  readonly specialty: string;
  private readonly core: AgentCore;

  constructor(config: WorkerAgentConfig, defaultLlm: LLM, defaultTools: ToolRegistry) {
    this.name = config.name;
    this.description = config.description;
    this.specialty = config.specialty;
    this.core = new AgentCore(
      config.llm ?? defaultLlm,
      config.tools ?? defaultTools,
      config.systemPrompt ?? `You are ${config.name}, a specialist in ${config.specialty}.`,
    );
  }

  async run(task: string, context: AgentContext): Promise<AgentRunResult> {
    const enrichedQuery = `[${this.name} specialist] ${task}`;
    return this.core.run(enrichedQuery, { signal: context.signal });
  }
}

// ── Orchestrator Agent ──

export interface OrchestratorConfig {
  llm: LLM;
  tools: ToolRegistry;
  workers: WorkerAgent[];
  /** 最大任务数 (默认 20) */
  maxTasks?: number;
}

export interface TaskSpec {
  /** 任务 id */
  id: string;
  /** 任务描述 */
  description: string;
  /** 任务分配的 worker name */
  assignedTo: string;
  /** 依赖的任务 ids (DAG) */
  dependsOn?: string[];
}

export interface TaskResult {
  taskId: string;
  worker: string;
  result: string;
  success: boolean;
  durationMs: number;
}

export interface OrchestratorRunResult {
  /** 任务分解结果 */
  tasks: TaskSpec[];
  /** 任务执行结果 */
  results: TaskResult[];
  /** 最终综合答案 */
  finalAnswer: string;
  /** 总耗时 (ms) */
  totalDurationMs: number;
}

export class OrchestratorAgent {
  private readonly llm: LLM;
  private readonly tools: ToolRegistry;
  private readonly workers: Map<string, WorkerAgent>;
  private readonly maxTasks: number;

  constructor(config: OrchestratorConfig) {
    this.llm = config.llm;
    this.tools = config.tools;
    this.workers = new Map(config.workers.map((w) => [w.name, w]));
    this.maxTasks = config.maxTasks ?? 20;
  }

  /**
   * 列出可用 worker
   */
  listWorkers(): Array<{ name: string; description: string; specialty: string }> {
    return Array.from(this.workers.values()).map((w) => ({
      name: w.name,
      description: w.description,
      specialty: w.specialty,
    }));
  }

  /**
   * 主流程: 分解任务 → 并行执行 → 汇总
   */
  async run(query: string, context: AgentContext = { sharedMemory: new Map(), workerResults: new Map() }): Promise<OrchestratorRunResult> {
    const start = Date.now();

    // 1. 任务分解 (V2: 基于 worker 列表启发式)
    const tasks = this.decompose(query);

    // 2. 执行 (按 DAG 拓扑序)
    const results: TaskResult[] = [];
    const completed = new Set<string>();

    while (results.length < tasks.length) {
      if (context.signal?.aborted) {
        throw new Error('Orchestrator aborted');
      }

      // 找可执行任务 (依赖已完成)
      const ready = tasks.filter(
        (t) =>
          !completed.has(t.id) &&
          (t.dependsOn ?? []).every((dep) => completed.has(dep)),
      );

      if (ready.length === 0) {
        break; // 防止死循环
      }

      // 并行执行
      const readyResults = await Promise.all(
        ready.map(async (task) => {
          const worker = this.workers.get(task.assignedTo);
          if (!worker) {
            return {
              taskId: task.id,
              worker: task.assignedTo,
              result: `Error: worker ${task.assignedTo} not found`,
              success: false,
              durationMs: 0,
            };
          }
          const taskStart = Date.now();
          try {
            const r = await worker.run(task.description, context);
            context.workerResults.set(task.id, r.finalAnswer);
            return {
              taskId: task.id,
              worker: task.assignedTo,
              result: r.finalAnswer,
              success: r.success,
              durationMs: Date.now() - taskStart,
            };
          } catch (e) {
            return {
              taskId: task.id,
              worker: task.assignedTo,
              result: `Error: ${(e as Error).message}`,
              success: false,
              durationMs: Date.now() - taskStart,
            };
          }
        }),
      );

      for (const r of readyResults) {
        results.push(r);
        completed.add(r.taskId);
      }
    }

    // 3. 汇总答案
    const finalAnswer = this.synthesize(query, results);

    return {
      tasks,
      results,
      finalAnswer,
      totalDurationMs: Date.now() - start,
    };
  }

  // ── Private ──

  /**
   * 任务分解 (V2 mock: 基于 query 关键词匹配 worker specialty)
   */
  private decompose(query: string): TaskSpec[] {
    const tasks: TaskSpec[] = [];
    const lowerQuery = query.toLowerCase();
    let taskId = 1;

    for (const worker of this.workers.values()) {
      // 检查 specialty 关键词是否在 query 中
      const keywords = worker.specialty.toLowerCase().split(/\s+/);
      const matched = keywords.some((kw) => lowerQuery.includes(kw));
      if (matched) {
        tasks.push({
          id: `t${taskId++}`,
          description: `${worker.name} task: ${query}`,
          assignedTo: worker.name,
        });
      }
    }

    // 如果没有匹配,分配给第一个 worker
    if (tasks.length === 0 && this.workers.size > 0) {
      const first = this.workers.values().next().value!;
      tasks.push({
        id: 't1',
        description: query,
        assignedTo: first.name,
      });
    }

    return tasks.slice(0, this.maxTasks);
  }

  /**
   * 综合 worker results 为最终答案
   */
  private synthesize(query: string, results: TaskResult[]): string {
    if (results.length === 0) {
      return `No worker results for query: ${query}`;
    }
    const successful = results.filter((r) => r.success);
    if (successful.length === 0) {
      return `All workers failed for query: ${query}`;
    }
    const summary = successful.map((r) => `[${r.worker}] ${r.result}`).join('\n');
    return `Synthesized answer for "${query}":\n${summary}`;
  }
}
