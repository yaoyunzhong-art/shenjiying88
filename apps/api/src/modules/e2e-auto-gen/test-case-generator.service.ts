// test-case-generator.service.ts - Phase-19 T29
// 用途: 基于 OpenAPI route + schema 生成边界值 / 错误场景测试用例
// 关联: phase-19-intelligence/spec.md §Phase 2
import { Injectable } from '@nestjs/common';
import type { OpenAPIRoute } from './openapi-parser.service';

export interface GeneratedTestCase {
  id: string;
  route: OpenAPIRoute;
  scenario: 'NORMAL' | 'BOUNDARY' | 'TYPE_ERROR' | 'SECURITY' | 'BUSINESS';
  description: string;
  request: {
    pathParams: Record<string, unknown>;
    queryParams: Record<string, unknown>;
    body: Record<string, unknown>;
    headers: Record<string, string>;
  };
  expectedStatus: number | number[];
  tags: string[];
}

@Injectable()
export class TestCaseGeneratorService {
  /**
   * 为单个 route 生成全套测试用例
   */
  generate(route: OpenAPIRoute): GeneratedTestCase[] {
    const cases: GeneratedTestCase[] = [];

    // 1. NORMAL:正常参数
    cases.push(this.normalCase(route));

    // 2. BOUNDARY:边界值
    for (const boundary of this.boundaryCases(route)) {
      cases.push(boundary);
    }

    // 3. TYPE_ERROR:类型错误
    for (const typeCase of this.typeErrorCases(route)) {
      cases.push(typeCase);
    }

    // 4. SECURITY:安全 payload
    if (route.method === 'POST' || route.method === 'PUT') {
      cases.push(this.securityCase(route));
    }

    return cases;
  }

  /**
   * 批量为 route table 生成
   */
  generateBatch(routes: OpenAPIRoute[]): GeneratedTestCase[] {
    const all: GeneratedTestCase[] = [];
    for (const r of routes) all.push(...this.generate(r));
    return all;
  }

  // ── Case builders ──

  private normalCase(route: OpenAPIRoute): GeneratedTestCase {
    const pathParams = this.buildPathParams(route, 'normal');
    const body = this.buildBody(route, 'normal');
    return {
      id: `${route.method}-${route.path}-normal`,
      route,
      scenario: 'NORMAL',
      description: `正常请求 ${route.method} ${route.path}`,
      request: { pathParams, queryParams: {}, body, headers: route.requiresAuth ? { Authorization: 'Bearer test' } : {} },
      expectedStatus: [200, 201],
      tags: ['normal'],
    };
  }

  private boundaryCases(route: OpenAPIRoute): GeneratedTestCase[] {
    const cases: GeneratedTestCase[] = [];
    // 空 body / 空 params
    cases.push({
      id: `${route.method}-${route.path}-boundary-empty`,
      route,
      scenario: 'BOUNDARY',
      description: '空 body / 空 params',
      request: { pathParams: this.buildPathParams(route, 'normal'), queryParams: {}, body: {}, headers: {} },
      expectedStatus: [400, 422],
      tags: ['boundary', 'empty'],
    });

    // 极端长度字符串
    for (const p of route.parameters.filter((x) => x.type === 'string')) {
      cases.push({
        id: `${route.method}-${route.path}-boundary-long-${p.name}`,
        route,
        scenario: 'BOUNDARY',
        description: `${p.name} 超长字符串 (10000 chars)`,
        request: {
          pathParams: this.buildPathParams(route, 'normal'),
          queryParams: p.in === 'query' ? { [p.name]: 'x'.repeat(10000) } : {},
          body: p.in === 'body' ? { [p.name]: 'x'.repeat(10000) } : {},
          headers: {},
        },
        expectedStatus: [400, 413],
        tags: ['boundary', 'long-string'],
      });
    }

    // 数字边界
    for (const p of route.parameters.filter((x) => x.type === 'number')) {
      cases.push({
        id: `${route.method}-${route.path}-boundary-num-${p.name}`,
        route,
        scenario: 'BOUNDARY',
        description: `${p.name} 负数 / 0 / 极值`,
        request: {
          pathParams: this.buildPathParams(route, 'normal'),
          queryParams: p.in === 'query' ? { [p.name]: -1 } : {},
          body: p.in === 'body' ? { [p.name]: -1 } : {},
          headers: {},
        },
        expectedStatus: [400, 422],
        tags: ['boundary', 'negative-number'],
      });
    }
    return cases;
  }

  private typeErrorCases(route: OpenAPIRoute): GeneratedTestCase[] {
    const cases: GeneratedTestCase[] = [];
    for (const p of route.parameters.filter((x) => x.type === 'number')) {
      cases.push({
        id: `${route.method}-${route.path}-type-${p.name}`,
        route,
        scenario: 'TYPE_ERROR',
        description: `${p.name} 应为 number,传入 string`,
        request: {
          pathParams: this.buildPathParams(route, 'normal'),
          queryParams: p.in === 'query' ? { [p.name]: 'not-a-number' } : {},
          body: p.in === 'body' ? { [p.name]: 'not-a-number' } : {},
          headers: {},
        },
        expectedStatus: [400, 422],
        tags: ['type-error'],
      });
    }
    return cases;
  }

  private securityCase(route: OpenAPIRoute): GeneratedTestCase {
    const payload = '<script>alert(1)</script>' + String.fromCharCode(39) + '; DROP TABLE users;--';
    return {
      id: `${route.method}-${route.path}-security-xss-sqli`,
      route,
      scenario: 'SECURITY',
      description: 'XSS + SQLi payload',
      request: {
        pathParams: this.buildPathParams(route, 'normal'),
        queryParams: {},
        body: { input: payload },
        headers: {},
      },
      expectedStatus: [400, 422],
      tags: ['security', 'xss', 'sqli'],
    };
  }

  // ── Helpers ──

  private buildPathParams(route: OpenAPIRoute, _mode: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const p of route.parameters.filter((x) => x.in === 'path')) {
      result[p.name] = p.type === 'number' ? 1 : 'test-id';
    }
    return result;
  }

  private buildBody(route: OpenAPIRoute, _mode: string): Record<string, unknown> {
    if (route.method !== 'POST' && route.method !== 'PUT') return {};
    const body: Record<string, unknown> = {};
    for (const p of route.parameters.filter((x) => x.in === 'body')) {
      body[p.name] = this.defaultValueFor(p.type);
    }
    return body;
  }

  private defaultValueFor(type: OpenAPIRoute['parameters'][number]['type']): unknown {
    switch (type) {
      case 'string': return 'test-value';
      case 'number': return 100;
      case 'boolean': return true;
      case 'array': return [];
      case 'object': return {};
      default: return null;
    }
  }
}
