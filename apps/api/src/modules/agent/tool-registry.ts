/**
 * tool-registry.ts - Phase-23 T86
 * 工具注册中心
 *
 * 设计:
 * - ToolDefinition: JSON schema (name + description + input schema)
 * - ToolRegistry: 注册 + 列出 + 执行 + 权限校验
 * - 内置工具: Calculator / WebSearch / KnowledgeSearch / Database
 * - 自定义工具: 用户可注册
 */
import { Injectable } from '@nestjs/common';

// ── Tool Definition ──

export interface ToolDefinition {
  /** tool 名称 (LLM 调用用) */
  name: string;
  /** tool 描述 (LLM 理解用) */
  description: string;
  /** input JSON schema (描述参数) */
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  /** 风险级别 (用于权限校验) */
  riskLevel?: 'low' | 'medium' | 'high';
  /** 分类 (用于过滤) */
  category?: string;
}

export interface ToolExecutionContext {
  /** 调用者 ID (用于审计) */
  callerId?: string;
  /** tenant id (多租户隔离) */
  tenantId?: string;
  /** 超时 ms (默认 5000) */
  timeoutMs?: number;
}

export interface ToolExecutionResult {
  ok: boolean;
  result?: unknown;
  error?: string;
  /** 执行耗时 (ms) */
  durationMs: number;
}

// ── Built-in Tools ──

const CALCULATOR_TOOL: ToolDefinition = {
  name: 'calculator',
  description: 'Evaluate a mathematical expression. Supports + - * / and parentheses.',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'Math expression like "2+2"' },
    },
    required: ['expression'],
  },
  riskLevel: 'low',
  category: 'math',
};

const WEB_SEARCH_TOOL: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for a query and return top results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      topK: { type: 'integer', description: 'Number of results (default 5)' },
    },
    required: ['query'],
  },
  riskLevel: 'low',
  category: 'search',
};

const KNOWLEDGE_SEARCH_TOOL: ToolDefinition = {
  name: 'knowledge_search',
  description: 'Search internal knowledge base (RAG) for documents matching the query.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Natural language query' },
      topK: { type: 'integer', description: 'Number of results (default 5)' },
    },
    required: ['query'],
  },
  riskLevel: 'low',
  category: 'rag',
};

const DATABASE_QUERY_TOOL: ToolDefinition = {
  name: 'database_query',
  description: 'Execute a read-only SQL query against the database.',
  inputSchema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL SELECT statement' },
    },
    required: ['sql'],
  },
  riskLevel: 'high',
  category: 'database',
};

export const BUILTIN_TOOLS: ToolDefinition[] = [
  CALCULATOR_TOOL,
  WEB_SEARCH_TOOL,
  KNOWLEDGE_SEARCH_TOOL,
  DATABASE_QUERY_TOOL,
];

// ── Tool Registry ──

type ToolHandler = (input: unknown, ctx: ToolExecutionContext) => Promise<unknown>;

@Injectable()
export class ToolRegistry {
  private readonly tools = new Map<string, { def: ToolDefinition; handler: ToolHandler }>();
  /** 调用审计 */
  private readonly auditLog: Array<{
    tool: string;
    input: unknown;
    callerId?: string;
    timestamp: number;
    success: boolean;
    durationMs: number;
  }> = [];

  constructor() {
    this.registerBuiltin();
  }

  /**
   * 注册 tool
   */
  register(def: ToolDefinition, handler: ToolHandler): void {
    if (this.tools.has(def.name)) {
      throw new Error(`Tool ${def.name} already registered`);
    }
    this.tools.set(def.name, { def, handler });
  }

  /**
   * 注销 tool
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * 列出所有 tool definition (给 LLM)
   */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.def);
  }

  /**
   * 按 category 过滤
   */
  listByCategory(category: string): ToolDefinition[] {
    return this.list().filter((t) => t.category === category);
  }

  /**
   * 按 riskLevel 过滤
   */
  listByRiskLevel(riskLevel: 'low' | 'medium' | 'high'): ToolDefinition[] {
    return this.list().filter((t) => t.riskLevel === riskLevel);
  }

  /**
   * 获取 tool definition
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name)?.def;
  }

  /**
   * 执行 tool
   */
  async execute(name: string, input: unknown, ctx: ToolExecutionContext = {}): Promise<unknown> {
    const entry = this.tools.get(name);
    if (!entry) {
      throw new Error(`Tool not found: ${name}`);
    }

    const timeoutMs = ctx.timeoutMs ?? 5000;
    const start = Date.now();

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      // 超时保护
      const result = await Promise.race([
        entry.handler(input, ctx),
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(
            () => reject(new Error(`Tool ${name} timeout after ${timeoutMs}ms`)),
            timeoutMs,
          );
        }),
      ]);
      const durationMs = Date.now() - start;
      this.audit(name, input, ctx, true, durationMs);
      return result;
    } catch (e) {
      const durationMs = Date.now() - start;
      this.audit(name, input, ctx, false, durationMs);
      throw e;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  /**
   * 获取审计日志
   */
  getAuditLog(filter?: { tool?: string; callerId?: string; since?: number }): typeof this.auditLog {
    return this.auditLog.filter((log) => {
      if (filter?.tool && log.tool !== filter.tool) return false;
      if (filter?.callerId && log.callerId !== filter.callerId) return false;
      if (filter?.since && log.timestamp < filter.since) return false;
      return true;
    });
  }

  /**
   * 工具数量
   */
  size(): number {
    return this.tools.size;
  }

  // ── Private ──

  private registerBuiltin(): void {
    this.register(CALCULATOR_TOOL, async (input) => {
      const expr = (input as { expression: string }).expression;
      // V2 mock: 简单安全 eval (生产接 math.js)
      if (!/^[\d+\-*/().\s]+$/.test(expr)) {
        throw new Error('Invalid expression (only digits and + - * / ( ) allowed)');
      }
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${expr})`)();
    });

    this.register(WEB_SEARCH_TOOL, async (input) => {
      const { query } = input as { query: string };
      return {
        results: [
          { title: `Mock result for "${query}"`, url: 'https://example.com/1', snippet: 'Mock snippet' },
          { title: `Another result for "${query}"`, url: 'https://example.com/2', snippet: 'Another snippet' },
        ],
      };
    });

    this.register(KNOWLEDGE_SEARCH_TOOL, async (input) => {
      const { query } = input as { query: string };
      return {
        docs: [
          { id: 'd1', content: `Knowledge doc about "${query}"`, score: 0.9 },
        ],
      };
    });

    this.register(DATABASE_QUERY_TOOL, async (input) => {
      const { sql } = input as { sql: string };
      if (!sql.toLowerCase().trim().startsWith('select')) {
        throw new Error('Only SELECT queries are allowed');
      }
      return { rows: [], sql };
    });
  }

  private audit(
    tool: string,
    input: unknown,
    ctx: ToolExecutionContext,
    success: boolean,
    durationMs: number,
  ): void {
    this.auditLog.push({
      tool,
      input,
      callerId: ctx.callerId,
      timestamp: Date.now(),
      success,
      durationMs,
    });
  }
}
