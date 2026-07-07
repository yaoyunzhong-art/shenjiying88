/**
 * integration-orchestration page.test.ts
 * L1 page-level test for 集成编排 workspace page.
 * Coverage: page file existence, default export, imports, client wrappers.
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
    // In ESM context, we can't dynamic-import .tsx directly.
    // Instead, verify the file contains expected export pattern.
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
