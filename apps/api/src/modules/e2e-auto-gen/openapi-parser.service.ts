// openapi-parser.service.ts - Phase-19 T28
// 用途: NestJS 路由表 → OpenAPI 3.0 解析
// 关联: phase-19-intelligence/spec.md §Phase 2
import { Injectable } from '@nestjs/common';

export interface OpenAPIRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  operationId?: string;
  parameters: Array<{
    name: string;
    in: 'path' | 'query' | 'body' | 'header';
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    schema?: Record<string, unknown>;
  }>;
  requestBody?: Record<string, unknown>;
  responses: Array<{ status: number; description: string; schema?: Record<string, unknown> }>;
  tags: string[];
  requiresAuth: boolean;
}

export interface ParsedRouteTable {
  title: string;
  version: string;
  routes: OpenAPIRoute[];
}

@Injectable()
export class OpenAPIParserService {
  /**
   * 从 NestJS 控制器反射元数据生成 OpenAPI 风格 route table
   * V1:接受手工声明的 routes 数组
   * V2:接 @nestjs/swagger 自动 reflect
   */
  parseFromRoutes(input: { title: string; version: string; routes: Array<{
    path: string;
    method: OpenAPIRoute['method'];
    parameters?: OpenAPIRoute['parameters'];
    responses?: OpenAPIRoute['responses'];
    tags?: string[];
    requiresAuth?: boolean;
  }> }): ParsedRouteTable {
    return {
      title: input.title,
      version: input.version,
      routes: input.routes.map((r) => ({
        path: r.path,
        method: r.method,
        parameters: r.parameters ?? [],
        responses: r.responses ?? [{ status: 200, description: 'OK' }],
        tags: r.tags ?? [],
        requiresAuth: r.requiresAuth ?? true,
      })),
    };
  }

  /** 按 tag 过滤 routes */
  filterByTag(table: ParsedRouteTable, tag: string): OpenAPIRoute[] {
    return table.routes.filter((r) => r.tags.includes(tag));
  }

  /** 按 method 过滤 */
  filterByMethod(table: ParsedRouteTable, method: OpenAPIRoute['method']): OpenAPIRoute[] {
    return table.routes.filter((r) => r.method === method);
  }

  /** 统计 */
  summarize(table: ParsedRouteTable): {
    totalRoutes: number;
    byMethod: Record<string, number>;
    byTag: Record<string, number>;
    authRequiredCount: number;
  } {
    const byMethod: Record<string, number> = {};
    const byTag: Record<string, number> = {};
    let authRequiredCount = 0;
    for (const r of table.routes) {
      byMethod[r.method] = (byMethod[r.method] ?? 0) + 1;
      for (const t of r.tags) byTag[t] = (byTag[t] ?? 0) + 1;
      if (r.requiresAuth) authRequiredCount++;
    }
    return { totalRoutes: table.routes.length, byMethod, byTag, authRequiredCount };
  }
}
