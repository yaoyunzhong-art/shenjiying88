import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { OpenAPIParserService } from './openapi-parser.service';
import { TestCaseGeneratorService } from './test-case-generator.service';
import { AutoRunnerService } from './auto-runner.service';

describe('Phase-19 T28-T30 E2E 自动生成', () => {
  let parser: OpenAPIParserService;
  let generator: TestCaseGeneratorService;
  let runner: AutoRunnerService;

  beforeEach(() => {
    parser = new OpenAPIParserService();
    generator = new TestCaseGeneratorService();
    runner = new AutoRunnerService();
  });

  // AC-1: OpenAPI 解析 - route table
  it('AC-1 OpenAPI parse route table', () => {
    const table = parser.parseFromRoutes({
      title: 'Shenjiying API',
      version: '1.0.0',
      routes: [
        { path: '/api/coupons', method: 'GET', tags: ['coupon'], requiresAuth: true, parameters: [], responses: [{ status: 200, description: 'OK' }] },
        { path: '/api/coupons/:id', method: 'POST', tags: ['coupon'], requiresAuth: true, parameters: [{ name: 'id', in: 'path', type: 'string', required: true }, { name: 'amount', in: 'body', type: 'number', required: true }] },
      ],
    });
    expect(table.routes.length).toBe(2);
    expect(table.routes[0].method).toBe('GET');
    const summary = parser.summarize(table);
    expect(summary.totalRoutes).toBe(2);
    expect(summary.byTag['coupon']).toBe(2);
    expect(summary.authRequiredCount).toBe(2);
  });

  // AC-2: test case generation - NORMAL + BOUNDARY
  it('AC-2 generate normal + boundary cases', () => {
    const route = {
      path: '/api/users/:id',
      method: 'POST' as const,
      parameters: [
        { name: 'id', in: 'path' as const, type: 'string' as const, required: true },
        { name: 'name', in: 'body' as const, type: 'string' as const, required: true },
        { name: 'age', in: 'body' as const, type: 'number' as const, required: false },
      ],
      responses: [{ status: 200, description: 'OK' }],
      tags: ['user'],
      requiresAuth: true,
    };
    const cases = generator.generate(route);
    const scenarios = cases.map((c) => c.scenario);
    expect(scenarios).toContain('NORMAL');
    expect(scenarios).toContain('BOUNDARY');
    expect(scenarios).toContain('TYPE_ERROR');
    expect(scenarios).toContain('SECURITY');
  });

  // AC-3: 批量生成 (整个 route table)
  it('AC-3 batch generation for route table', () => {
    const table = parser.parseFromRoutes({
      title: 't', version: '1.0.0',
      routes: [
        { path: '/a', method: 'GET', parameters: [], tags: ['x'], requiresAuth: false, responses: [{ status: 200, description: 'OK' }] },
        { path: '/b/:id', method: 'POST', parameters: [{ name: 'id', in: 'path', type: 'string', required: true }], tags: ['x'], requiresAuth: true, responses: [{ status: 200, description: 'OK' }] },
      ],
    });
    const allCases = generator.generateBatch(table.routes);
    expect(allCases.length).toBeGreaterThan(5); // 至少 5 个 case per route
  });

  // AC-4: AutoRunner 执行 + 报告
  it('AC-4 auto-runner execution + report', async () => {
    const route = {
      path: '/api/orders', method: 'POST' as const,
      parameters: [{ name: 'total', in: 'body' as const, type: 'number' as const, required: true }],
      responses: [], tags: ['order'], requiresAuth: true,
    };
    const cases = generator.generate(route);
    const { report } = await runner.run(cases);
    expect(report.totalCases).toBe(cases.length);
    expect(report.passRate).toBeGreaterThan(0);
    expect(report.byScenario.NORMAL).toBeDefined();
  });

  // AC-5: CI verdict - passRate >= 95%
  it('AC-5 CI verdict', async () => {
    const route = {
      path: '/api/test', method: 'GET' as const,
      parameters: [], responses: [], tags: [], requiresAuth: false,
    };
    const cases = generator.generate(route);
    const { report } = await runner.run(cases);
    expect(runner.ciVerdict(report)).toBe('pass');
  });
});
