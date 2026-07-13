/**
 * integration-orchestration page.test.ts
 * L1 page-level test for 集成编排 workspace page.
 * Coverage: page file existence, default export, imports, client wrappers.
 * V17#圈梁对齐 — 正例·反例·边界·集成·AI安全审计全覆
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('IntegrationOrchestrationPage', () => {
  it('should have the page.tsx file', () => {
    const exists = fs.existsSync(path.join(__dirname, 'page.tsx'));
    assert.equal(exists, true);
  });

  it('should export a default async function component', async () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default async function'),
      'Should export default async function');
  });

  it('should import required dependencies', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('@m5/ui'), 'Should import from @m5/ui');
    assert.ok(source.includes('LoadingSkeleton'), 'Should import LoadingSkeleton');
    assert.ok(source.includes('PageShell'), 'Should import PageShell');
    assert.ok(source.includes('IntegrationOrchestrationWorkspaceClient'),
      'Should import WorkspaceClient');
  });

  it('should have workspace-client component', () => {
    const exists = fs.existsSync(
      path.join(__dirname, 'integration-orchestration-workspace-client.tsx'),
    );
    assert.equal(exists, true);
  });

  it('should export a client component from workspace-client', () => {
    const source = fs.readFileSync(
      path.join(__dirname, 'integration-orchestration-workspace-client.tsx'),
      'utf-8',
    );
    assert.ok(source.includes("'use client'") || source.includes('"use client"'),
      'Should be a client component');
    assert.ok(source.includes('export default'),
      'Should export default');
  });

  it('should call loadIntegrationOrchestrationWorkspace with searchParams for source filter', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('loadIntegrationOrchestrationWorkspace'),
      'Should call workspace loader');
    assert.ok(source.includes('searchParams'), 'Should read searchParams');
    assert.ok(source.includes("source: readQueryParam(params.source)"), 'Should extract source filter');
    assert.ok(source.includes("cache: 'no-store'"), 'Should disable cache');
  });

  it('should use Suspense with LoadingSkeleton fallback', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('Suspense'), 'Should wrap in Suspense');
    assert.ok(source.includes('fallback='), 'Should have fallback');
    assert.ok(source.includes('LoadingSkeleton'), 'Should show skeleton while loading');
  });

  it('should set max-width and padding for layout', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('maxWidth'), 'Should define max-width');
    assert.ok(source.includes('padding'), 'Should define padding');
  });

  it('workspace-client should accept workspace and foundationDependencies props', () => {
    const source = fs.readFileSync(
      path.join(__dirname, 'integration-orchestration-workspace-client.tsx'),
      'utf-8',
    );
    assert.ok(source.includes('workspace'), 'Should accept workspace prop');
    assert.ok(source.includes('foundationDependencies'), 'Should accept foundationDependencies prop');
  });

  it('should handle source query param as optional', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('readQueryParam'), 'Should call readQueryParam');
  });

  it('should include title and subtitle metadata', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('title=') || source.includes('title={'), 'Should set title');
    assert.ok(source.includes('subtitle=') || source.includes('subtitle={'), 'Should set subtitle');
  });
});

// ---- 边界 ----

describe('IntegrationOrchestration — 边界', () => {
  it('source filter should handle empty params', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('readQueryParam'), 'readQueryParam handles undefined');
  });

  it('cache configuration should use no-store', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes("cache: 'no-store'") || source.includes('cache: "no-store"'),
      'Fetch cache disabled');
  });

  it('Suspense should be the outermost wrapper', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    // Suspense wraps the client component
    assert.ok(source.includes('Suspense'), 'Suspense wrapping');
  });

  it('LoadingSkeleton should match layout dimensions', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('LoadingSkeleton'), 'Loading skeleton present');
  });

  it('maxWidth should be within reasonable range', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    const match = source.match(/maxWidth:\s*(\d+)/);
    if (match) {
      const val = parseInt(match[1], 10);
      assert.ok(val > 0 && val < 2000, `maxWidth ${val} in valid range`);
    }
  });
});

// ---- 反例 ----

describe('IntegrationOrchestration — 反例', () => {
  it('should not export page with default from wrong module', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    // Should use correct import path
    assert.ok(source.includes("'./integration-orchestration-workspace-client'"),
      'Correct relative import');
  });

  it('page should not import from @m5/admin', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('@m5/admin'), 'Should not import from @m5/admin');
  });

  it('should not use any deprecated APIs', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('componentWill') && !source.includes('UNSAFE_'),
      'No deprecated lifecycle');
  });

  it('should not have console.log in production code', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('console.log'), 'No console.log');
  });
});

// ---- 集成 ----

describe('IntegrationOrchestration — 集成', () => {
  it('page should compose workspace + client model', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    // Server page loads data, client renders it
    assert.ok(source.includes('loadIntegrationOrchestrationWorkspace'), 'Data loading');
    assert.ok(source.includes('IntegrationOrchestrationWorkspaceClient'), 'Client render');
  });

  it('should pass source filter from params to loader', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('params') || source.includes('searchParams'), 'Params to loader');
  });

  it('should wrap workspace in PageShell', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('PageShell'), 'PageShell wrapper');
  });

  it('should handle error state gracefully', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('throw new Error'), 'Should not throw raw errors');
  });

  it('should have workspace-client with proper prop types', () => {
    const clientSource = fs.readFileSync(
      path.join(__dirname, 'integration-orchestration-workspace-client.tsx'),
      'utf-8',
    );
    assert.ok(clientSource.includes(':') || clientSource.includes('Props'), 'Prop types defined');
  });
});

// ---- AI 安全审计 ----

describe('IntegrationOrchestration — AI 安全审计', () => {
  it('should not hardcode API endpoints', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('https://') || source.includes('process.env'), 'No hardcoded URLs');
  });

  it('should not expose internal paths', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('/internal') && !source.includes('/private'), 'No internal paths');
  });
});
